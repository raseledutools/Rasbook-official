// src/components/StoriesBar.js
import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, Image, TouchableOpacity,
  StyleSheet, Alert, Linking,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { Colors, getAvatar, getDisplayName } from '../utils/theme';

export default function StoriesBar({ currentUser }) {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const valid = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          if (!s.createdAt) return true;
          const diffHours = (now - s.createdAt.toMillis()) / (1000 * 60 * 60);
          return diffHours < 24;
        });
      setStories(valid);
    });
    return unsub;
  }, []);

  const addStory = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8,
    });
    if (result.canceled) return;
    try {
      const asset = result.assets[0];
      const url = await uploadToCloudinary(asset.uri, asset.type === 'video' ? 'video' : 'image');
      await addDoc(collection(db, 'stories'), {
        userId: currentUser.uid,
        userName: getDisplayName(currentUser),
        userAvatar: getAvatar(currentUser),
        mediaUrl: url,
        createdAt: serverTimestamp(),
      });
    } catch {
      Alert.alert('Error', 'Failed to upload story');
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.container} contentContainerStyle={s.content}>
      {/* Create Story card */}
      <TouchableOpacity style={s.card} onPress={addStory}>
        <Image source={{ uri: getAvatar(currentUser) }} style={s.storyAvatar} />
        <View style={s.overlay} />
        <Text style={s.name}>Create Story</Text>
      </TouchableOpacity>

      {/* Dynamic Stories */}
      {stories.map((story) => (
        <TouchableOpacity
          key={story.id} style={s.card}
          onPress={() => Linking.openURL(story.mediaUrl)}
        >
          <Image source={{ uri: story.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <Image source={{ uri: story.userAvatar }} style={s.storyAvatar} />
          <View style={s.overlay} />
          <Text style={s.name}>{story.userName}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: Colors.white, marginBottom: 8 },
  content: { padding: 12, gap: 10 },
  card: { width: 100, height: 170, borderRadius: 12, backgroundColor: Colors.bgGray, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: Colors.border, justifyContent: 'flex-end' },
  storyAvatar: { position: 'absolute', top: 10, left: 10, width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: Colors.primary, zIndex: 2 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  name: { color: Colors.white, fontWeight: 'bold', fontSize: 12, padding: 8, zIndex: 2, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
});
