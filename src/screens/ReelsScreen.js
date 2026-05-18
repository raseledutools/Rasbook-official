// src/screens/ReelsScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, Dimensions, Text,
  TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import {
  collection, addDoc, serverTimestamp,
  onSnapshot, query, orderBy, doc,
  updateDoc, increment, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../hooks/useAuth';
import { Colors, getAvatar, getDisplayName, timeAgo } from '../utils/theme';
import { setCache, getCache, CACHE_KEYS } from '../utils/cache';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineBanner from '../components/OfflineBanner';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

function ReelItem({ reel, currentUser, isActive, isOnline }) {
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(reel.likes?.includes(currentUser.uid));
  const [likeCount, setLikeCount] = useState(reel.likes?.length || 0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [isActive]);

  const handleLike = async () => {
    if (!isOnline) return Alert.alert('Offline', 'Like করতে internet দরকার');
    const ref = doc(db, 'reels', reel.id);
    if (liked) {
      await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
      setLiked(false);
      setLikeCount((c) => c - 1);
    } else {
      await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  return (
    <View style={s.reelContainer}>
      <TouchableOpacity activeOpacity={1} onPress={() => setMuted((m) => !m)} style={StyleSheet.absoluteFill}>
        <Video
          ref={videoRef}
          source={{ uri: reel.videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          isLooping
          isMuted={muted}
          shouldPlay={isActive}
        />
      </TouchableOpacity>

      {/* Gradient overlay */}
      <View style={s.gradientOverlay} />

      {/* Mute indicator */}
      {muted && (
        <View style={s.muteIcon}>
          <Text style={{ fontSize: 22 }}>🔇</Text>
        </View>
      )}

      {/* User info */}
      <View style={s.userRow}>
        <Image source={{ uri: reel.userAvatar || getAvatar({ uid: reel.userId }) }} style={s.avatar} />
        <View>
          <Text style={s.userName}>{reel.userName}</Text>
          <Text style={s.reelCaption} numberOfLines={2}>{reel.caption}</Text>
          <Text style={s.timeText}>{timeAgo(reel.createdAt)}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn} onPress={handleLike}>
          <Text style={s.actionIcon}>{liked ? '❤️' : '🤍'}</Text>
          <Text style={s.actionCount}>{likeCount}</Text>
        </TouchableOpacity>
        <View style={s.actionBtn}>
          <Text style={s.actionIcon}>💬</Text>
          <Text style={s.actionCount}>{reel.comments || 0}</Text>
        </View>
        <View style={s.actionBtn}>
          <Text style={s.actionIcon}>↗️</Text>
          <Text style={s.actionCount}>Share</Text>
        </View>
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const isOnline = useNetworkStatus();
  const flatListRef = useRef(null);

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getCache(CACHE_KEYS.REELS);
      if (cached) { setReels(cached); setLoading(false); }
    };
    loadCached();
    if (!isOnline) { setLoading(false); return; }

    const q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReels(data);
      setCache(CACHE_KEYS.REELS, data);
      setLoading(false);
    });
    return unsub;
  }, [isOnline]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const uploadReel = async () => {
    if (!isOnline) return Alert.alert('Offline', 'Reel upload করতে internet দরকার');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(result.assets[0].uri, 'video');
      await addDoc(collection(db, 'reels'), {
        userId: user.uid,
        userName: getDisplayName(user),
        userAvatar: getAvatar(user),
        videoUrl: url,
        caption: '',
        likes: [],
        comments: 0,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Done', 'Reel upload হয়েছে!');
    } catch (e) {
      Alert.alert('Error', 'Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;

  return (
    <View style={s.container}>
      <OfflineBanner />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Reels</Text>
        {uploading
          ? <ActivityIndicator color={Colors.primary} />
          : (
            <TouchableOpacity onPress={uploadReel}>
              <Text style={s.uploadBtn}>+ Upload</Text>
            </TouchableOpacity>
          )
        }
      </View>

      {reels.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 40 }}>🎬</Text>
          <Text style={s.emptyText}>No reels yet. প্রথমে upload করুন!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={reels}
          keyExtractor={(i) => i.id}
          pagingEnabled
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item, index }) => (
            <ReelItem
              reel={item}
              currentUser={user}
              isActive={index === activeIndex}
              isOnline={isOnline}
            />
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingTop: 50,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  uploadBtn: { color: Colors.primary, fontWeight: '700', fontSize: 15, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reelContainer: { width: SCREEN_W, height: SCREEN_H, position: 'relative' },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 250, backgroundColor: 'rgba(0,0,0,0.5)' },
  muteIcon: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -20 }, { translateY: -20 }] },
  userRow: { position: 'absolute', bottom: 100, left: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, right: 70 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  userName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reelCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  timeText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
  actions: { position: 'absolute', bottom: 100, right: 16, alignItems: 'center', gap: 20 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 28 },
  actionCount: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#fff', fontSize: 16, marginTop: 12, opacity: 0.7 },
});
