// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
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

// ── CallKeep setup — শুধু Android/iOS, delay দিয়ে ──────────────────────────
if (Platform.OS !== 'web') {
  setTimeout(() => {
    setupCallKeep().catch(() => {});
  }, 3000); // 2000 থেকে বাড়িয়ে 3000 — app fully load হওয়ার পর
}

function RootApp() {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);
  const notifResponseRef = useRef(null);
  const fcmUnsubRef = useRef(null);
  const callKeepUnsubRef = useRef(null);
<<<<<<< HEAD

  // ── FIX 1: @expo/vector-icons font preload ─────────────────────────────
  // Web-এ FontAwesome6 font আগে load না হলে icon rectangle দেখায়
  const [fontsLoaded] = useFonts({
    ...FontAwesome6.font,
  });

  // Pending call data — CallKeep answer করার সময় সাথে রাখো
  const pendingCallRef = useRef(null); // { callId, callerUid, callerName }
=======
  const pendingCallRef = useRef(null);
>>>>>>> 24cce17e80c3415405fcbb847731a3a2ea1859ad

  useEffect(() => {
    // শুধু native + user logged in হলে চালাও
    if (!user || Platform.OS === 'web') return;

    let isMounted = true;

    // ── 1. Push notification token register ─────────────────────────────────
    registerForPushNotifications(user.uid).catch(() => {});

<<<<<<< HEAD
    // 2. FCM foreground handler (app open বা background)
    try { const _msg = require('@react-native-firebase/messaging').default;
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
=======
    // ── 2. FCM — async দিয়ে load করো, require() সরাসরি না ──────────────────
    // কারণ: @react-native-firebase/messaging prebuild ছাড়া crash করে
    const setupFCM = async () => {
      try {
        // Dynamic import — crash হলেও app বন্ধ হবে না
        const messagingModule = await import('@react-native-firebase/messaging');
        const messaging = messagingModule.default;

        if (!messaging || typeof messaging !== 'function') return;
        const _msg = messaging();
        if (!_msg) return;

        // Foreground message
        if (isMounted) {
          fcmUnsubRef.current = _msg.onMessage(async (remoteMessage) => {
            if (!isMounted) return;
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
>>>>>>> 24cce17e80c3415405fcbb847731a3a2ea1859ad
          });
        }

<<<<<<< HEAD
      _msg().getInitialNotification().then((remoteMessage) => {
        if (remoteMessage?.data?.type === 'incoming_call') {
          const d = remoteMessage.data;
          pendingCallRef.current = { callId: d.callId, callerUid: d.callerUid, callerName: d.callerName };
=======
        // Background — notification tap
        _msg.onNotificationOpenedApp((remoteMessage) => {
          if (!isMounted) return;
          const data = remoteMessage?.data;
          if (data?.type === 'incoming_call') {
            navigationRef.current?.navigate('Messenger', {
              incomingCallId: data.callId,
              callerUid: data.callerUid,
            });
          }
        });

        // App killed state
        const initialMsg = await _msg.getInitialNotification().catch(() => null);
        if (initialMsg?.data?.type === 'incoming_call' && isMounted) {
          const d = initialMsg.data;
          pendingCallRef.current = {
            callId: d.callId,
            callerUid: d.callerUid,
            callerName: d.callerName,
          };
>>>>>>> 24cce17e80c3415405fcbb847731a3a2ea1859ad
          setTimeout(() => {
            if (!isMounted) return;
            navigationRef.current?.navigate('Messenger', {
              incomingCallId: d.callId,
              callerUid: d.callerUid,
            });
<<<<<<< HEAD
          }, 1000);
=======
          }, 1500);
>>>>>>> 24cce17e80c3415405fcbb847731a3a2ea1859ad
        }

<<<<<<< HEAD
    // 3. CallKeep answer/reject listener
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
=======
      } catch (fcmErr) {
        // FCM load failed — এটা non-fatal, app চলতে থাকবে
        console.warn('[FCM] setup skipped:', fcmErr?.message);
>>>>>>> 24cce17e80c3415405fcbb847731a3a2ea1859ad
      }
    };

    // FCM setup একটু delay দিয়ে করো — navigation ready হওয়ার পর
    const fcmTimer = setTimeout(setupFCM, 1000);

    // ── 3. CallKeep listeners ────────────────────────────────────────────────
    const setupCallKeepListeners = () => {
      try {
        callKeepUnsubRef.current = registerCallKeepListeners(
          (callUUID) => {
            if (!isMounted) return;
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
      } catch (e) {
        console.warn('[CallKeep] listener setup failed:', e?.message);
      }
    };

    const callTimer = setTimeout(setupCallKeepListeners, 500);

    // ── 4. Expo notifications (fallback) ────────────────────────────────────
    const setupExpoNotif = async () => {
      try {
        const N = await import('expo-notifications');
        if (!isMounted) return;
        notifResponseRef.current = N.addNotificationResponseReceivedListener((r) => {
          if (!isMounted) return;
          const data = r?.notification?.request?.content?.data;
          if (data?.type === 'incoming_call') {
            navigationRef.current?.navigate('Messenger', {
              incomingCallId: data.callId,
              callerUid: data.callerUid,
            });
          }
        });
      } catch (e) {
        console.warn('[Notif] expo-notifications setup failed:', e?.message);
      }
    };

    setupExpoNotif();

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      isMounted = false;
      clearTimeout(fcmTimer);
      clearTimeout(callTimer);
      try { fcmUnsubRef.current?.(); } catch (e) {}
      try { callKeepUnsubRef.current?.(); } catch (e) {}
      try { notifResponseRef.current?.remove?.(); } catch (e) {}
    };
  }, [user]);

<<<<<<< HEAD
  // ── FIX 1: Font load না হলে blank screen দেখাও (rectangle এড়াতে) ──────
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
=======
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' }}>
>>>>>>> 24cce17e80c3415405fcbb847731a3a2ea1859ad
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
<<<<<<< HEAD

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
=======
>>>>>>> 24cce17e80c3415405fcbb847731a3a2ea1859ad

  return user ? (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  ) : (
    <LoginScreen />
  );
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
