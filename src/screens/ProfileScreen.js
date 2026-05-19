// src/screens/ProfileScreen.js — Fixed: proper name update, smooth UI
import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  StyleSheet, Alert, ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../hooks/useAuth';
import { Colors, getAvatar, getDisplayName } from '../utils/theme';
import { FontAwesome6 } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [name, setName] = useState(getDisplayName(user));
  const [saving, setSaving] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(null);
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    getFirebaseAuth().then(setAuth);
  }, []);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Gallery access needed to change photo.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setLocalAvatar(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!auth || !name.trim()) return Alert.alert('Error', 'Name cannot be empty');
    setSaving(true);
    try {
      let photoURL = user.photoURL;
      if (localAvatar) photoURL = await uploadToCloudinary(localAvatar, 'image');
      await updateProfile(auth.currentUser, { displayName: name.trim(), photoURL });
      // ✅ Fix: Update Firestore too — so Messenger shows updated name
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, displayName: name.trim(), photoURL, email: user.email,
      }, { merge: true });
      // ✅ Fix: Update messenger presence too
      const { doc: fDoc, setDoc: fSet } = await import('firebase/firestore');
      await fSet(fDoc(db, 'messenger', 'rasbook-messenger-v1', 'users', user.uid), {
        name: name.trim(), photoURL,
      }, { merge: true });
      Alert.alert('Done', 'Profile updated! ✅');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (!auth) return;
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const avatarSrc = { uri: localAvatar || getAvatar(user) };

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.headerBg} />

      {/* Avatar */}
      <TouchableOpacity onPress={pickImage} style={s.avatarWrap}>
        <Image source={avatarSrc} style={s.avatar} />
        <View style={s.cameraBadge}>
          <FontAwesome6 name="camera" size={14} color="#fff" />
        </View>
      </TouchableOpacity>

      {/* Name */}
      <Text style={s.currentName}>{getDisplayName(user)}</Text>
      <Text style={s.currentEmail}>{user?.email}</Text>

      {/* Edit Card */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Edit Profile</Text>

        <Text style={s.label}>Display Name</Text>
        <View style={s.inputWrap}>
          <FontAwesome6 name="user" size={15} color={Colors.textMuted} />
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#aaa"
          />
        </View>

        <Text style={s.label}>Email</Text>
        <View style={[s.inputWrap, { opacity: 0.6 }]}>
          <FontAwesome6 name="envelope" size={15} color={Colors.textMuted} />
          <Text style={[s.input, { paddingTop: 13, color: Colors.textMuted }]}>{user?.email}</Text>
        </View>

        {saving ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <TouchableOpacity style={s.btnPrimary} onPress={handleSave}>
            <FontAwesome6 name="floppy-disk" size={16} color="#fff" />
            <Text style={s.btnText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={s.btnDanger} onPress={handleLogout}>
        <FontAwesome6 name="arrow-right-from-bracket" size={16} color="#fff" />
        <Text style={s.btnText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', backgroundColor: Colors.bgGray, paddingBottom: 40 },
  headerBg: { width: '100%', height: 120, backgroundColor: Colors.primary },

  avatarWrap: { marginTop: -56, position: 'relative' },
  avatar: {
    width: 112, height: 112, borderRadius: 56,
    borderWidth: 4, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  cameraBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  currentName: { fontSize: 22, fontWeight: '800', color: '#050505', marginTop: 12 },
  currentEmail: { fontSize: 14, color: Colors.textMuted, marginBottom: 20 },

  card: {
    width: '92%', backgroundColor: '#fff', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, marginBottom: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#050505', marginBottom: 16 },

  label: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, marginLeft: 4 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, marginBottom: 14, backgroundColor: '#fafafa',
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#050505' },

  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 14, marginTop: 4,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDanger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '92%', backgroundColor: Colors.danger,
    borderRadius: 10, paddingVertical: 14,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
