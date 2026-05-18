// src/screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  StyleSheet, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getFirebaseAuth, db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../hooks/useAuth';
import { Colors, getAvatar, getDisplayName } from '../utils/theme';

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) setLocalAvatar(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!auth) return;
    setSaving(true);
    try {
      let photoURL = user.photoURL;
      if (localAvatar) photoURL = await uploadToCloudinary(localAvatar, 'image');
      await updateProfile(auth.currentUser, { displayName: name, photoURL });
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid, displayName: name, photoURL, email: user.email,
      }, { merge: true });
      Alert.alert('Done', 'Profile updated!');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (!auth) return;
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const avatarUri = localAvatar || getAvatar(user);

  return (
    <ScrollView contentContainerStyle={s.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image source={{ uri: avatarUri }} style={s.avatar} />
        <Text style={s.changePhoto}>Change Photo</Text>
      </TouchableOpacity>

      <TextInput
        style={s.input} value={name}
        onChangeText={setName} placeholder="Display Name"
        placeholderTextColor="#999"
      />

      {saving ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 10 }} />
      ) : (
        <TouchableOpacity style={s.btnPrimary} onPress={handleSave}>
          <Text style={s.btnText}>Save Changes</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[s.btnPrimary, { backgroundColor: Colors.danger }]} onPress={handleLogout}>
        <Text style={s.btnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', padding: 24, backgroundColor: Colors.white, flexGrow: 1 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Colors.primary, marginBottom: 8 },
  changePhoto: { color: Colors.primary, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { width: '100%', padding: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, fontSize: 16, marginBottom: 16, color: '#000' },
  btnPrimary: { width: '100%', padding: 15, backgroundColor: Colors.primary, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
});
