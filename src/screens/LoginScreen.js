// src/screens/LoginScreen.js — Fixed: Google Sign In web popup, proper error handling
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, db } from '../services/firebase';
import { Colors } from '../utils/theme';
import WebPhoneLayout from '../components/WebPhoneLayout';

// Google Sign In — only on native
let GoogleSignin = null;
if (Platform.OS !== 'web') {
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GoogleSignin.configure({
      webClientId: '983241676717-vlvkt72jel22k4p4bfbaihicfboa823v.apps.googleusercontent.com',
    });
  } catch (e) {
    GoogleSignin = null;
  }
}

export default function LoginScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [auth, setAuth] = useState(null);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    getFirebaseAuth().then(setAuth);
  }, []);

  const saveUserToFirestore = async (firebaseUser, displayName) => {
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        displayName: displayName || firebaseUser.displayName || firebaseUser.email.split('@')[0],
        photoURL: firebaseUser.photoURL || null,
        email: firebaseUser.email,
        createdAt: Date.now(),
      }, { merge: true });
    } catch (e) {
      console.log('Firestore save error:', e);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) return Alert.alert('Error', 'Please enter your name');
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      await saveUserToFirestore(cred.user, name.trim());
      Alert.alert('Welcome!', `Account created for ${name.trim()}! 🎉`);
    } catch (e) {
      Alert.alert('Register Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setGoogleLoading(true);
    try {
      if (Platform.OS === 'web') {
        // ✅ Fix: Web — signInWithPopup with proper error handling
        const { signInWithPopup } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        // Force account selection every time
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        await saveUserToFirestore(result.user, result.user.displayName);
      } else {
        // Native
        if (!GoogleSignin) {
          Alert.alert(
            'Setup Required',
            'Install @react-native-google-signin/google-signin and set correct webClientId.'
          );
          setGoogleLoading(false);
          return;
        }
        await GoogleSignin.hasPlayServices();
        const { idToken } = await GoogleSignin.signIn();
        const googleCred = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, googleCred);
        await saveUserToFirestore(result.user, result.user.displayName);
      }
    } catch (e) {
      // Ignore user-cancelled popup
      if (
        e.code === 'auth/cancelled-popup-request' ||
        e.code === 'auth/popup-closed-by-user'
      ) {
        setGoogleLoading(false);
        return;
      }
      // Unauthorized domain error — helpful message
      if (e.code === 'auth/unauthorized-domain') {
        Alert.alert(
          'Domain Not Authorized',
          'Go to Firebase Console → Authentication → Settings → Authorized domains → add your domain (e.g. localhost or your deployed URL).'
        );
      } else {
        Alert.alert('Google Sign In Failed', e.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return Alert.alert('Error', 'Enter your email first');
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Done', 'Password reset email sent! Check your inbox.');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const isLoading = loading || !auth;

  return (
    <WebPhoneLayout>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bgGray }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ backgroundColor: Colors.bgGray }} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <Text style={s.logo}>
            <Text style={{ color: Colors.primary }}>Ras</Text>
            <Text style={{ color: Colors.green }}>Book</Text>
          </Text>
          <Text style={s.tagline}>Connect with friends and the world around you.</Text>
        </View>

        <View style={s.card}>
          <View style={s.tabs}>
            <TouchableOpacity
              style={[s.tab, mode === 'login' && s.tabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tab, mode === 'register' && s.tabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[s.tabText, mode === 'register' && s.tabTextActive]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>👤</Text>
              <TextInput
                style={s.input}
                placeholder="Full Name"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>✉️</Text>
            <TextInput
              style={s.input}
              placeholder="Email address"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={s.inputWrap}>
            <Text style={s.inputIcon}>🔒</Text>
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
              <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : (
            <>
              <TouchableOpacity
                style={s.btnPrimary}
                onPress={mode === 'login' ? handleLogin : handleRegister}
              >
                <Text style={s.btnText}>{mode === 'login' ? 'Log In' : 'Create Account'}</Text>
              </TouchableOpacity>

              {mode === 'login' && (
                <TouchableOpacity onPress={handleForgotPassword} style={s.forgotWrap}>
                  <Text style={s.forgotText}>Forgotten password?</Text>
                </TouchableOpacity>
              )}

              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>OR</Text>
                <View style={s.dividerLine} />
              </View>

              <TouchableOpacity style={s.googleBtn} onPress={handleGoogleSignIn} disabled={googleLoading}>
                {googleLoading ? (
                  <ActivityIndicator color="#333" />
                ) : (
                  <>
                    <Text style={s.googleIcon}>G</Text>
                    <Text style={s.googleText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={s.footer}>RasBook © 2025 · Connect · Share · Discover</Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </WebPhoneLayout>
  );
}

const s = StyleSheet.create({
  container: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgGray, padding: 20,
    minHeight: '100%',
  },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: '#555', marginTop: 6, textAlign: 'center', fontSize: 14, maxWidth: 280 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: '#fff',
    borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
  },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.bgGray,
    borderRadius: 10, marginBottom: 20, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 12, backgroundColor: '#fafafa',
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: '#000' },
  eyeBtn: { padding: 4 },
  btnPrimary: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  forgotWrap: { alignItems: 'center', marginTop: 12 },
  forgotText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingVertical: 13, gap: 10, backgroundColor: '#fff',
  },
  googleIcon: {
    fontSize: 18, fontWeight: '900', color: '#4285F4',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  googleText: { fontSize: 15, fontWeight: '600', color: '#333' },
  footer: { marginTop: 24, color: '#aaa', fontSize: 12, textAlign: 'center' },
});
