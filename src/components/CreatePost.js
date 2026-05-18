// src/components/CreatePost.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, Image, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { Colors, getAvatar, getDisplayName } from '../utils/theme';

const pickMediaWeb = () =>
  new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return resolve(null);
      const uri = URL.createObjectURL(file);
      resolve({ uri, type: file.type.startsWith('video') ? 'video' : 'image' });
    };
    input.click();
  });

export default function CreatePost({ currentUser }) {
  const [text, setText] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [posting, setPosting] = useState(false);

  const pickMedia = async () => {
    if (Platform.OS === 'web') {
      const result = await pickMediaWeb();
      if (result) { setMedia(result.uri); setMediaType(result.type); }
      return;
    }
    const IP = await import('expo-image-picker');
    const result = await IP.launchImageLibraryAsync({
      mediaTypes: IP.MediaTypeOptions.All, quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setMedia(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const handlePost = async () => {
    if (!text.trim() && !media) return Alert.alert('', 'Post cannot be empty!');
    setPosting(true);
    try {
      let mediaUrl = null;
      if (media) mediaUrl = await uploadToCloudinary(media, mediaType);
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: getDisplayName(currentUser),
        userAvatar: getAvatar(currentUser),
        text: text.trim(), mediaUrl, mediaType,
        likes: [], comments: [],
        createdAt: serverTimestamp(),
      });
      setText(''); setMedia(null); setMediaType(null);
    } catch {
      Alert.alert('Error', 'Failed to post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.inputRow}>
        <Image source={{ uri: getAvatar(currentUser) }} style={s.avatar} />
        <TextInput
          style={s.input}
          placeholder={`What's on your mind, ${getDisplayName(currentUser)}?`}
          placeholderTextColor="#999" value={text} onChangeText={setText} multiline
        />
      </View>
      {media && (
        <View style={s.preview}>
          <Image source={{ uri: media }} style={s.previewImg} />
          <TouchableOpacity style={s.removeBtn} onPress={() => { setMedia(null); setMediaType(null); }}>
            <Text style={{ color: '#fff' }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={s.actions}>
        <TouchableOpacity onPress={pickMedia} style={s.mediaBtn}>
          <Text style={{ color: Colors.green, fontWeight: '600' }}>📸 Photo/Video</Text>
        </TouchableOpacity>
        {posting
          ? <ActivityIndicator color={Colors.primary} />
          : <TouchableOpacity style={s.postBtn} onPress={handlePost}>
              <Text style={s.postBtnText}>Post</Text>
            </TouchableOpacity>
        }
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: Colors.white, padding: 12, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  input: { flex: 1, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#000', maxHeight: 100 },
  preview: { position: 'relative', marginTop: 10 },
  previewImg: { width: '100%', height: 200, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  mediaBtn: { padding: 6 },
  postBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  postBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 15 },
});
