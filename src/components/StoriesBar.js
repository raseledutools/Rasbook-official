// src/components/StoriesBar.js
import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView, View, Text, Image, TouchableOpacity,
  StyleSheet, Alert, Modal, Animated, Dimensions,
  FlatList, TouchableWithoutFeedback,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  collection, addDoc, serverTimestamp, query,
  orderBy, onSnapshot, doc, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { Colors, getAvatar, getDisplayName } from '../utils/theme';
import { setCache, getCache, CACHE_KEYS } from '../utils/cache';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const STORY_DURATION = 5000;

export default function StoriesBar({ currentUser }) {
  const [stories, setStories] = useState([]);
  const [viewingStories, setViewingStories] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const isOnline = useNetworkStatus();

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getCache(CACHE_KEYS.STORIES);
      if (cached) setStories(cached);
    };
    loadCached();
    if (!isOnline) return;
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const valid = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          if (!s.createdAt) return true;
          return (now - s.createdAt.toMillis()) / 3600000 < 24;
        });
      setStories(valid);
      setCache(CACHE_KEYS.STORIES, valid);
    });
    return unsub;
  }, [isOnline]);

  const grouped = stories.reduce((acc, s) => {
    if (!acc[s.userId]) acc[s.userId] = [];
    acc[s.userId].push(s);
    return acc;
  }, {});
  const groupedList = Object.values(grouped);

  const openStories = (userStories) => {
    setViewingStories(userStories);
    setCurrentIndex(0);
    startProgress();
    if (isOnline) {
      userStories.forEach((story) => {
        updateDoc(doc(db, 'stories', story.id), {
          viewers: arrayUnion(currentUser.uid),
        }).catch(() => {});
      });
    }
  };

  const startProgress = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) goNext();
    });
  };

  const goNext = () => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (!viewingStories || next >= viewingStories.length) {
        closeStory();
        return prev;
      }
      startProgress();
      return next;
    });
  };

  const goPrev = () => {
    setCurrentIndex((prev) => {
      const p = Math.max(0, prev - 1);
      startProgress();
      return p;
    });
  };

  const closeStory = () => {
    setViewingStories(null);
    setShowViewers(false);
    progress.stopAnimation();
  };

  const addStory = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8,
    });
    if (result.canceled) return;
    if (!isOnline) return Alert.alert('Offline', 'Story upload করতে internet দরকার');
    try {
      const asset = result.assets[0];
      const url = await uploadToCloudinary(asset.uri, asset.type === 'video' ? 'video' : 'image');
      await addDoc(collection(db, 'stories'), {
        userId: currentUser.uid,
        userName: getDisplayName(currentUser),
        userAvatar: getAvatar(currentUser),
        mediaUrl: url,
        viewers: [],
        createdAt: serverTimestamp(),
      });
      Alert.alert('Done', 'Story add হয়েছে!');
    } catch {
      Alert.alert('Error', 'Story upload failed');
    }
  };

  const activeStory = viewingStories?.[currentIndex];

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.container} contentContainerStyle={s.content}>
        <TouchableOpacity style={s.card} onPress={addStory}>
          <Image source={{ uri: getAvatar(currentUser) }} style={s.storyAvatar} />
          <View style={s.overlay} />
          <Text style={s.name}>+ Create</Text>
        </TouchableOpacity>
        {groupedList.map((userStories) => {
          const first = userStories[0];
          const isViewed = first.viewers?.includes(currentUser.uid);
          return (
            <TouchableOpacity key={first.userId} style={[s.card, isViewed && s.viewedCard]} onPress={() => openStories(userStories)}>
              <Image source={{ uri: first.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <Image source={{ uri: first.userAvatar }} style={[s.storyAvatar, isViewed && s.viewedRing]} />
              <View style={s.overlay} />
              <Text style={s.name}>{first.userName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!viewingStories} animationType="fade" statusBarTranslucent>
        {activeStory && (
          <View style={s.storyModal}>
            <Image source={{ uri: activeStory.mediaUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            <View style={s.progressRow}>
              {viewingStories.map((_, i) => (
                <View key={i} style={s.progressBg}>
                  <Animated.View style={[s.progressFill, {
                    width: i < currentIndex ? '100%'
                      : i === currentIndex
                        ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                        : '0%',
                  }]} />
                </View>
              ))}
            </View>
            <View style={s.storyHeader}>
              <Image source={{ uri: activeStory.userAvatar }} style={s.storyUserAvatar} />
              <Text style={s.storyUserName}>{activeStory.userName}</Text>
              <TouchableOpacity style={s.closeBtn} onPress={closeStory}>
                <Text style={s.closeText}>X</Text>
              </TouchableOpacity>
            </View>
            <View style={s.tapZones}>
              <TouchableWithoutFeedback onPress={goPrev}><View style={{ flex: 1 }} /></TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={goNext}><View style={{ flex: 2 }} /></TouchableWithoutFeedback>
            </View>
            {activeStory.userId === currentUser.uid && (
              <TouchableOpacity style={s.viewersBtn} onPress={() => setShowViewers(true)}>
                <Text style={s.viewersText}>Viewers: {activeStory.viewers?.length || 0}</Text>
              </TouchableOpacity>
            )}
            <Modal visible={showViewers} transparent animationType="slide">
              <TouchableOpacity style={s.viewersBg} onPress={() => setShowViewers(false)}>
                <View style={s.viewersList}>
                  <Text style={s.viewersTitle}>Who viewed</Text>
                  {(activeStory.viewers || []).length === 0
                    ? <Text style={{ color: Colors.textMuted, textAlign: 'center' }}>কেউ দেখেনি এখনো</Text>
                    : (activeStory.viewers || []).map((uid) => (
                        <View key={uid} style={s.viewerRow}>
                          <Text style={s.viewerUid}>{uid.slice(0, 16)}...</Text>
                        </View>
                      ))
                  }
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { backgroundColor: Colors.white, marginBottom: 8 },
  content: { padding: 12, gap: 10 },
  card: { width: 100, height: 170, borderRadius: 12, backgroundColor: Colors.bgGray, overflow: 'hidden', position: 'relative', borderWidth: 2, borderColor: Colors.primary, justifyContent: 'flex-end' },
  viewedCard: { borderColor: Colors.border },
  storyAvatar: { position: 'absolute', top: 8, left: 8, width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: Colors.primary, zIndex: 2 },
  viewedRing: { borderColor: Colors.border },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  name: { color: Colors.white, fontWeight: 'bold', fontSize: 11, padding: 8, zIndex: 2, textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  storyModal: { flex: 1, backgroundColor: '#000' },
  progressRow: { flexDirection: 'row', gap: 4, padding: 12, paddingTop: 50, zIndex: 10 },
  progressBg: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  storyHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8, zIndex: 10 },
  storyUserAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  storyUserName: { color: '#fff', fontWeight: '700', flex: 1, fontSize: 15 },
  closeBtn: { padding: 8 },
  closeText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  tapZones: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 60, flexDirection: 'row', zIndex: 5 },
  viewersBtn: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, zIndex: 10 },
  viewersText: { color: '#fff', fontWeight: '600' },
  viewersBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  viewersList: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: 300 },
  viewersTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  viewerRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  viewerUid: { fontSize: 14, color: Colors.black },
});
