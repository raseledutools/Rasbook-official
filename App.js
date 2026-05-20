// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Platform } from 'react-native';

import { AuthProvider, useAuth } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { Colors } from './src/utils/theme';
import { registerForPushNotifications } from './src/services/notificationService';
import {
  setupCallKeep, showIncomingCall, endCallKeep, registerCallKeepListeners,
} from './src/services/callKeepService';

// CallKeep — app launch-এই একবার setup
if (Platform.OS !== 'web') {
  setupCallKeep();
}

function RootApp() {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);
  const notifResponseRef = useRef(null);
  const fcmUnsubRef = useRef(null);
  const callKeepUnsubRef = useRef(null);

  // ── Pending call data — CallKeep answer করার সময় সাথে রাখো ─────────────
  // FCM message থেকে callId + callerUid আসে, CallKeep answer-এ pass করো
  const pendingCallRef = useRef(null); // { callId, callerUid, callerName }

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    // 1. Expo push token register
    registerForPushNotifications(user.uid).catch(() => {});

    // 2. FCM foreground handler (app open বা background)
    import('@react-native-firebase/messaging').then((messaging) => {
      fcmUnsubRef.current = messaging.default().onMessage(async (remoteMessage) => {
        const data = remoteMessage?.data;
        if (data?.type === 'incoming_call') {
          // callId + callerUid save করো — answer করলে Messenger-এ pass হবে
          pendingCallRef.current = {
            callId: data.callId,
            callerUid: data.callerUid,
            callerName: data.callerName,
          };
          // Native full-screen call screen
          showIncomingCall(
            data.callerName || 'Unknown',
            data.callId,
            data.callType === 'video'
          );
        }
      });

      // Background state — notification tap করলে
      messaging.default().onNotificationOpenedApp((remoteMessage) => {
        const data = remoteMessage?.data;
        if (data?.type === 'incoming_call') {
          // ✅ FIX: callerUid সহ navigate করো
          navigationRef.current?.navigate('Messenger', {
            incomingCallId: data.callId,
            callerUid: data.callerUid,
          });
        }
      });

      // App killed থেকে open — getInitialNotification দিয়ে check করো
      messaging.default().getInitialNotification().then((remoteMessage) => {
        if (remoteMessage?.data?.type === 'incoming_call') {
          const d = remoteMessage.data;
          pendingCallRef.current = { callId: d.callId, callerUid: d.callerUid, callerName: d.callerName };
          setTimeout(() => {
            navigationRef.current?.navigate('Messenger', {
              incomingCallId: d.callId,
              callerUid: d.callerUid,
            });
          }, 1000); // navigation ready হওয়ার জন্য delay
        }
      }).catch(() => {});
    }).catch(() => {});

    // 3. CallKeep answer/reject listener
    // ✅ FIX: answer করলে pendingCallRef থেকে callerUid নিয়ে navigate করো
    callKeepUnsubRef.current = registerCallKeepListeners(
      (callUUID) => {
        // Answer — Messenger screen খোলো + caller contact খুঁজে show করো
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

    // 4. Expo notification tap (fallback)
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootApp />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
