// src/screens/ReelsScreen.js — Fixed: permission before media pick, web video fallback
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, FlatList, StyleSheet, Dimensions, Text,
  TouchableOpacity, Image, Alert, ActivityIndicator, Platform,
} from 'react-native';
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
import { FontAwesome6 } from '@expo/vector-icons';

const { height: SCREEN_H } = Dimensions.get('window');
const _SW = Dimensions.get('window').width;
const SCREEN_W = (Platform.OS === 'web' && _SW > 500) ? 390 : _SW;
const SCREEN_H_SAFE = (Platform.OS === 'web') ? Math.min(Dimensions.get('window').height - 48, 780) : SCREEN_H;

// Platform-aware video player
const VideoComponent = Platform.select({
  web: ({ uri, isActive, muted }) => (
    <video
      src={uri}
      autoPlay={isActive}
      loop
      muted={muted}
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
    />
  ),
  default: ({ uri, isActive, muted, videoRef }) => {
    const { Video } = require('expo-av');
    return (
      <Video
        ref={videoRef}
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        isLooping
        isMuted={muted}
        shouldPlay={isActive}
      />
    );
  },
});

function ReelItem({ reel, currentUser, isActive, isOnline }) {
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(reel.likes?.includes(currentUser.uid));
  const [likeCount, setLikeCount] = useState(reel.likes?.length || 0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [isActive]);

  const handleLike = async () => {
    if (!isOnline) return Alert.alert('Offline', 'Internet needed to like');
    const ref = doc(db, 'reels', reel.id);
    if (liked) {
      await updateDoc(ref, { likes: arrayRemove(currentUser.uid) });
      setLiked(false); setLikeCount((c) => c - 1);
    } else {
      await updateDoc(ref, { likes: arrayUnion(currentUser.uid) });
      setLiked(true); setLikeCount((c) => c + 1);
    }
  };

  return (
    <View style={s.reelContainer}>
      <TouchableOpacity activeOpacity={1} onPress={() => setMuted((m) => !m)} style={StyleSheet.absoluteFill}>
        <VideoComponent uri={reel.videoUrl} isActive={isActive} muted={muted} videoRef={videoRef} />
      </TouchableOpacity>
      <View style={s.gradientOverlay} />
      {muted && <View style={s.muteIcon}><Text style={{ fontSize: 22 }}>🔇</Text></View>}

      <View style={s.userRow}>
        <Image source={{ uri: reel.userAvatar || getAvatar({ uid: reel.userId }) }} style={s.avatar} />
        <View>
          <Text style={s.userName}>{reel.userName || 'User'}</Text>
          <Text style={s.timeAgo}>{timeAgo(reel.createdAt)}</Text>
        </View>
      </View>
      {reel.caption ? <Text style={s.caption}>{reel.caption}</Text> : null}

      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn} onPress={handleLike}>
          <FontAwesome6 name="heart" size={28} color={liked ? '#f44336' : '#fff'} solid={liked} />
          <Text style={s.actionCount}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}>
          <FontAwesome6 name="comment" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn}>
          <FontAwesome6 name="share" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReelsScreen() {
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getCache(CACHE_KEYS.REELS);
      if (cached) { setReels(cached); setLoading(false); }
    };
    loadCached();
    if (!isOnline) { setLoading(false); return; }
    const q = query(collection(db, 'reels'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReels(data);
      setCache(CACHE_KEYS.REELS, data);
      setLoading(false);
    });
  }, [isOnline]);

  const pickAndUpload = async () => {
    // ✅ Fix: Request permission properly
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Gallery access needed to upload a Reel.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const videoUrl = await uploadToCloudinary(asset.uri, 'video');
      await addDoc(collection(db, 'reels'), {
        videoUrl, userId: user.uid,
        userName: getDisplayName(user),
        userAvatar: getAvatar(user),
        caption: '',
        likes: [], views: 0,
        createdAt: serverTimestamp(),
      });
    } catch {
      Alert.alert('Error', 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index);
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={s.container}>
      <OfflineBanner />
      <FlatList
        data={reels}
        keyExtractor={(i) => i.id}
        renderItem={({ item, index }) => (
          <ReelItem reel={item} currentUser={user} isActive={index === activeIndex} isOnline={isOnline} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        ListEmptyComponent={
          <View style={[s.center, { height: SCREEN_H }]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎬</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>No Reels yet</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Upload the first one!</Text>
          </View>
        }
      />

      {/* Upload button */}
      <TouchableOpacity style={s.uploadBtn} onPress={pickAndUpload} disabled={uploading || !isOnline}>
        {uploading
          ? <ActivityIndicator color="#fff" />
          : <FontAwesome6 name="plus" size={22} color="#fff" />
        }
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  reelContainer: { width: SCREEN_W, height: typeof SCREEN_H_SAFE !== 'undefined' ? SCREEN_H_SAFE : SCREEN_H, backgroundColor: '#000' },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: Platform.OS === 'web'
      ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)'
      : undefined,
    backgroundColor: Platform.OS !== 'web' ? 'transparent' : undefined,
  },
  muteIcon: {
    position: 'absolute', top: 20, right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 6,
  },
  userRow: {
    position: 'absolute', bottom: 120, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  userName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  timeAgo: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  caption: { position: 'absolute', bottom: 80, left: 16, right: 80, color: '#fff', fontSize: 14 },
  actions: { position: 'absolute', bottom: 100, right: 12, gap: 20 },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionCount: { color: '#fff', fontSize: 13, fontWeight: '600' },
  uploadBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 16, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
});
