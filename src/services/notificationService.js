// src/services/notificationService.js
import { Platform } from 'react-native';

const isNative = Platform.OS !== 'web';

// ── Register Expo push token ─────────────────────────────────────────────────
export const registerForPushNotifications = async (uid) => {
  if (!isNative) return null;
  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    if (!Device.default.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // FCM token — app killed state-এ call notification-এর জন্য দরকার
    let fcmToken = null;
    try {
      const messaging = await import('@react-native-firebase/messaging');
      fcmToken = await messaging.default().getToken();
    } catch (e) {}

    await setDoc(doc(db, 'users', uid), {
      expoPushToken: token,
      ...(fcmToken ? { fcmToken } : {}),
    }, { merge: true });

    return { expoPushToken: token, fcmToken };
  } catch (e) {
    console.warn('Push notifications unavailable:', e.message);
    return null;
  }
};

// ── Regular push notification (message, like, comment) ──────────────────────
// App open/background-এ কাজ করে
export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body, data }),
  });
};

// ── Call notification — Firebase Function দিয়ে FCM high-priority ─────────────
// App killed থাকলেও এটা কাজ করে
// Firestore trigger (onCallCreated) থাকলে এই function call নাও করলেও চলে।
// কিন্তু double-safety হিসেবে রাখা হলো।
export const sendCallNotification = async (calleeUid, callerName, callType, callId) => {
  if (!calleeUid) return;
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const { app } = await import('./firebase');

    const functions = getFunctions(app);
    const sendCall = httpsCallable(functions, 'sendCallNotification');

    await sendCall({ calleeUid, callerName, callType, callId });
    console.log('Call notification sent via Firebase Function');
  } catch (e) {
    console.warn('sendCallNotification error:', e.message);

    // Fallback: Expo Push (app open/background-এ কাজ করবে)
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('./firebase');
      const userDoc = await getDoc(doc(db, 'users', calleeUid));
      const expoPushToken = userDoc.data()?.expoPushToken;
      if (expoPushToken) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: expoPushToken,
            title: `📞 ${callerName}`,
            body: callType === 'video' ? 'Incoming Video Call' : 'Incoming Voice Call',
            sound: 'default',
            priority: 'high',
            channelId: 'incoming-call',
            data: { type: 'incoming_call', callType, callerName, callId },
          }),
        });
      }
    } catch (fallbackErr) {
      console.warn('Fallback notification also failed:', fallbackErr.message);
    }
  }
};

// ── Android notification channel (MAX importance = full-screen) ──────────────
if (isNative) {
  import('expo-notifications').then((N) => {
    N.setNotificationHandler({
      handleNotification: async (notification) => {
        const isCall = notification?.request?.content?.data?.type === 'incoming_call';
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: !isCall,
          priority: isCall
            ? N.AndroidNotificationPriority.MAX
            : N.AndroidNotificationPriority.DEFAULT,
        };
      },
    });

    if (Platform.OS === 'android') {
      N.setNotificationChannelAsync('incoming-call', {
        name: 'Incoming Calls',
        importance: N.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 500, 250, 500],
        enableVibrate: true,
        lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
        showBadge: false,
      });
    }
  }).catch(() => {});
}
