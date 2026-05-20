// index.js
import { AppRegistry, Platform } from 'react-native';
import App from './App';

// FCM Background handler (Android only, app killed state)
if (Platform.OS !== 'web') {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      try {
        const data = remoteMessage?.data;
        if (data?.type === 'incoming_call') {
          const { setupCallKeep, showIncomingCall } = require('./src/services/callKeepService');
          await setupCallKeep();
          showIncomingCall(
            data.callerName || 'Unknown',
            data.callId,
            data.callType === 'video'
          );
        }
      } catch (e) {
        console.warn('[FCM Background] Error:', e?.message);
      }
    });
  } catch (e) {
    console.warn('[FCM] Background handler setup failed (non-fatal):', e?.message);
  }
}

AppRegistry.registerComponent('main', () => App);
