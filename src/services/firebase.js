// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDvQjNIgVvKk0qa0WZX25etZH73UmHqtIg",
  authDomain: "rasbook-5159d.firebaseapp.com",
  projectId: "rasbook-5159d",
  storageBucket: "rasbook-5159d.firebasestorage.app",
  messagingSenderId: "983241676717",
  appId: "1:983241676717:web:bb35a559bd9935c8517324",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Auth with correct persistence per platform
let _auth = null;

export const getFirebaseAuth = async () => {
  if (_auth) return _auth;

  if (Platform.OS === 'web') {
    // Web: use browserLocalPersistence so login survives refresh
    const { getAuth, browserLocalPersistence, setPersistence } = await import('firebase/auth');
    _auth = getAuth(app);
    await setPersistence(_auth, browserLocalPersistence);
  } else {
    // Native (Android/iOS): use AsyncStorage persistence
    const { initializeAuth, getReactNativePersistence } = await import('firebase/auth');
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }

  return _auth;
};

export default app;
