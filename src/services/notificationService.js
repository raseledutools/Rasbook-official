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

    // Also get FCM token for direct FCM sends (callkeep)
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
export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body, data }),
  });
};

// ── Call notification — FCM data-only (wakes killed app via CallKeep) ────────
// FCM data-only message → background handler জাগে → CallKeep full-screen দেখায়
export const sendCallNotification = async (tokens, callerName, callType, callId) => {
  const { expoPushToken, fcmToken } = tokens || {};

  // Method 1: FCM direct (app killed হলেও কাজ করে — CallKeep trigger)
  // Note: এটার জন্য Firebase Admin SDK লাগে server-side।
  // Client-side থেকে সরাসরি FCM পাঠানো যায় না (security)।
  // তাই Expo Push API দিয়ে high-priority পাঠাচ্ছি।

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
        data: {
          type: 'incoming_call',
          callType,
          callerName,
          callId,
        },
      }),
    });
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
