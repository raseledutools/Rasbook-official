// index.js  ← এটা project root-এ রাখো (App.js-এর পাশে)
// FCM background handler — app killed থাকলেও এটা চলে
import { AppRegistry, Platform } from 'react-native';
import App from './App';

// ── FCM Background handler (Android only, app killed state) ─────────────────
if (Platform.OS !== 'web') {
  import('@react-native-firebase/messaging').then((messaging) => {
    messaging.default().setBackgroundMessageHandler(async (remoteMessage) => {
      const data = remoteMessage?.data;

      // Incoming call push → show full-screen call UI via CallKeep
      if (data?.type === 'incoming_call') {
        const { setupCallKeep, showIncomingCall } = await import('./src/services/callKeepService');
        await setupCallKeep();
        showIncomingCall(
          data.callerName || 'Unknown',
          data.callId,
          data.callType === 'video'
        );
      }
    });
  }).catch(() => {});
}

AppRegistry.registerComponent('main', () => App);
