// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';

// 🔥 Replace with your Firebase config if needed
const firebaseConfig = {
  apiKey: "AIzaSyDvQjNIgVvKk0qa0WZX25etZH73UmHqtIg",
  authDomain: "rasbook-5159d.firebaseapp.com",
  databaseURL: "https://rasbook-5159d-default-rtdb.firebaseio.com",
  projectId: "rasbook-5159d",
  storageBucket: "rasbook-5159d.firebasestorage.app",
  messagingSenderId: "983241676717",
  appId: "1:983241676717:web:bb35a559bd9935c8517324",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;
