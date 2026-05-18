// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { Colors } from '../utils/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Account created!');
    } catch (e) {
      Alert.alert('Register Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return Alert.alert('Error', 'Enter your email first');
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Done', 'Password reset email sent!');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.logo}>
        <Text style={{ color: Colors.primary }}>Ras</Text>
        <Text style={{ color: Colors.green }}>Book</Text>
      </Text>
      <Text style={s.tagline}>Connect with friends and the world around you.</Text>

      <TextInput
        style={s.input} placeholder="Email address"
        placeholderTextColor="#999" keyboardType="email-address"
        autoCapitalize="none" value={email} onChangeText={setEmail}
      />
      <TextInput
        style={s.input} placeholder="Password"
        placeholderTextColor="#999" secureTextEntry
        value={password} onChangeText={setPassword}
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <>
          <TouchableOpacity style={s.btnPrimary} onPress={handleLogin}>
            <Text style={s.btnText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={s.forgotText}>Forgotten password?</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={[s.btnPrimary, { backgroundColor: Colors.green, width: '70%' }]} onPress={handleRegister}>
            <Text style={s.btnText}>Create New Account</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, padding: 24 },
  logo: { fontSize: 55, fontWeight: '900', marginBottom: 8 },
  tagline: { color: '#444', marginBottom: 30, textAlign: 'center', fontSize: 15 },
  input: { width: '100%', padding: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, fontSize: 16, marginBottom: 12, backgroundColor: '#f5f6f7', color: '#000' },
  btnPrimary: { width: '100%', padding: 15, backgroundColor: Colors.primary, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  btnText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  forgotText: { color: Colors.primary, fontSize: 15, marginBottom: 10 },
  divider: { width: '100%', height: 1, backgroundColor: Colors.border, marginVertical: 20 },
});
