// src/services/notificationService.js
import { Platform } from 'react-native';

// expo-notifications does NOT support web — skip entirely on web
const isNative = Platform.OS !== 'web';

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
    await setDoc(doc(db, 'users', uid), { expoPushToken: token }, { merge: true });
    return token;
  } catch (e) {
    console.warn('Push notifications unavailable:', e.message);
    return null;
  }
};

export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body, data }),
  });
};

// Set up notification handler only on native
if (isNative) {
  import('expo-notifications').then((N) => {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }).catch(() => {});
}
