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
  setupCallKeep,
  showIncomingCall,
  endCallKeep,
  registerCallKeepListeners,
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

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;

    // 1. Expo push token register
    registerForPushNotifications(user.uid).catch(() => {});

    // 2. FCM foreground handler (app open বা background)
    import('@react-native-firebase/messaging').then((messaging) => {
      fcmUnsubRef.current = messaging.default().onMessage(async (remoteMessage) => {
        const data = remoteMessage?.data;
        if (data?.type === 'incoming_call') {
          // Native phone-style full-screen call screen
          showIncomingCall(
            data.callerName || 'Unknown',
            data.callId,
            data.callType === 'video'
          );
        }
      });

      // Background state — notification tap করলে
      messaging.default().onNotificationOpenedApp((remoteMessage) => {
        if (remoteMessage?.data?.type === 'incoming_call') {
          navigationRef.current?.navigate('Messenger');
        }
      });
    }).catch(() => {});

    // 3. CallKeep answer/reject listener
    callKeepUnsubRef.current = registerCallKeepListeners(
      (callUUID) => navigationRef.current?.navigate('Messenger'), // Answer
      (callUUID) => endCallKeep(callUUID)                         // Decline
    );

    // 4. Expo notification tap (fallback)
    import('expo-notifications').then((N) => {
      notifResponseRef.current = N.addNotificationResponseReceivedListener((r) => {
        if (r?.notification?.request?.content?.data?.type === 'incoming_call') {
          navigationRef.current?.navigate('Messenger');
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootApp />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
