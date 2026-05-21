// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { FontAwesome6 } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/hooks/useAuth';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { Colors } from './src/utils/theme';
import { registerForPushNotifications } from './src/services/notificationService';
import {
  setupCallKeep, showIncomingCall, endCallKeep, registerCallKeepListeners,
} from './src/services/callKeepService';

// CallKeep — delay করে setup করো (permission crash avoid)
if (Platform.OS !== 'web') {
  setTimeout(() => {
    setupCallKeep().catch(() => {});
  }, 2000);
}

function RootApp() {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);
  const notifResponseRef = useRef(null);
  const fcmUnsubRef = useRef(null);
  const callKeepUnsubRef = useRef(null);
  const pendingCallRef = useRef(null);

  // ── FIX 1: Icon rectangle fix — web-এ font আগে load করো ──────────────
  const [fontsLoaded] = useFonts({ ...FontAwesome6.font });

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    registerForPushNotifications(user.uid).catch(() => {});

    try {
      const _msg = require('@react-native-firebase/messaging').default;
      fcmUnsubRef.current = _msg().onMessage(async (remoteMessage) => {
        const data = remoteMessage?.data;
        if (data?.type === 'incoming_call') {
          pendingCallRef.current = {
            callId: data.callId,
            callerUid: data.callerUid,
            callerName: data.callerName,
          };
          showIncomingCall(
            data.callerName || 'Unknown',
            data.callId,
            data.callType === 'video'
          );
        }
      });

      _msg().onNotificationOpenedApp((remoteMessage) => {
        const data = remoteMessage?.data;
        if (data?.type === 'incoming_call') {
          navigationRef.current?.navigate('Messenger', {
            incomingCallId: data.callId,
            callerUid: data.callerUid,
          });
        }
      });

      _msg().getInitialNotification().then((remoteMessage) => {
        if (remoteMessage?.data?.type === 'incoming_call') {
          const d = remoteMessage.data;
          pendingCallRef.current = { callId: d.callId, callerUid: d.callerUid, callerName: d.callerName };
          setTimeout(() => {
            navigationRef.current?.navigate('Messenger', {
              incomingCallId: d.callId,
              callerUid: d.callerUid,
            });
          }, 1000);
        }
      }).catch(() => {});
    } catch (_fcmErr) { console.warn('[FCM] setup failed:', _fcmErr?.message); }

    callKeepUnsubRef.current = registerCallKeepListeners(
      (callUUID) => {
        const pending = pendingCallRef.current;
        navigationRef.current?.navigate('Messenger', {
          incomingCallId: callUUID || pending?.callId,
          callerUid: pending?.callerUid,
        });
        pendingCallRef.current = null;
      },
      (callUUID) => {
        endCallKeep(callUUID);
        pendingCallRef.current = null;
      }
    );

    import('expo-notifications').then((N) => {
      notifResponseRef.current = N.addNotificationResponseReceivedListener((r) => {
        const data = r?.notification?.request?.content?.data;
        if (data?.type === 'incoming_call') {
          navigationRef.current?.navigate('Messenger', {
            incomingCallId: data.callId,
            callerUid: data.callerUid,
          });
        }
      });
    }).catch(() => {});

    return () => {
      fcmUnsubRef.current?.();
      callKeepUnsubRef.current?.();
      notifResponseRef.current?.remove?.();
    };
  }, [user]);

  // Font load না হলে loading দেখাও — এতে icon rectangle আর হবে না
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  return user ? (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  ) : <LoginScreen />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
        <SafeAreaProvider>
          <AuthProvider>
            <ErrorBoundary>
              <RootApp />
            </ErrorBoundary>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
