// App.js
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

import { AuthProvider, useAuth } from './src/hooks/useAuth';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { Colors } from './src/utils/theme';
import { registerForPushNotifications } from './src/services/notificationService';
import {
  setupCallKeep, showIncomingCall, endCallKeep, registerCallKeepListeners,
} from './src/services/callKeepService';

// ── Android 13+ dangerous permissions runtime request ────────────────────────
async function requestAndroidPermissions() {
  if (Platform.OS !== 'android') return;
  try {
    // CAMERA + MIC — WebRTC এর জন্য দরকার
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    ]);
  } catch (e) {
    console.warn('[Permissions] request failed:', e?.message);
  }
}

// ── SYSTEM_ALERT_WINDOW — overlay permission (separate flow দরকার) ────────────
async function requestOverlayPermission() {
  if (Platform.OS !== 'android') return;
  try {
    // Android এ এই permission Settings থেকে manually দিতে হয়
    // Direct API দিয়ে check করা যায় না সরাসরি, তাই Settings এ পাঠাই
    const { canDrawOverlays } = await import('react-native').then(m => m.NativeModules || {});
    // Fallback: just skip — CallKeep কাজ করবে overlay ছাড়াও
  } catch (e) {
    // non-fatal
  }
}

// ── CallKeep setup — শুধু Android/iOS, delay দিয়ে ──────────────────────────
if (Platform.OS !== 'web') {
  setTimeout(() => {
    setupCallKeep().catch(() => {});
  }, 3000);
}

function RootApp() {
  const { user, loading } = useAuth();
  const navigationRef = useRef(null);
  const notifResponseRef = useRef(null);
  const fcmUnsubRef = useRef(null);
  const callKeepUnsubRef = useRef(null);
  const pendingCallRef = useRef(null);

  // ── App launch এ permissions request ──────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'android') {
      requestAndroidPermissions();
    }
  }, []);

  useEffect(() => {
    // শুধু native + user logged in হলে চালাও
    if (!user || Platform.OS === 'web') return;

    let isMounted = true;

    // ── 1. Push notification token register ─────────────────────────────────
    registerForPushNotifications(user.uid).catch(() => {});

    // ── 2. FCM — async দিয়ে load করো, require() সরাসরি না ──────────────────
    const setupFCM = async () => {
      try {
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
          });
        }

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
          setTimeout(() => {
            if (!isMounted) return;
            navigationRef.current?.navigate('Messenger', {
              incomingCallId: d.callId,
              callerUid: d.callerUid,
            });
          }, 1500);
        }

      } catch (fcmErr) {
        console.warn('[FCM] setup skipped:', fcmErr?.message);
      }
    };

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
