// src/screens/HomeScreen.js — Fixed: Facebook-style header
import React, { useState, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  Text, ActivityIndicator, Image, TouchableOpacity, Platform,
} from 'react-native';
import {
  collection, query, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { setCache, getCache, CACHE_KEYS } from '../utils/cache';
import { Colors, getAvatar, getDisplayName } from '../utils/theme';
import StoriesBar from '../components/StoriesBar';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import OfflineBanner from '../components/OfflineBanner';
import { FontAwesome6 } from '@expo/vector-icons';

function HomeHeader({ user }) {
  return (
    <View style={h.header}>
      <Text style={h.logo}>
        <Text style={{ color: Colors.primary }}>Ras</Text>
        <Text style={{ color: Colors.green }}>Book</Text>
      </Text>
      <View style={h.icons}>
        <TouchableOpacity style={h.iconBtn}>
          <FontAwesome6 name="magnifying-glass" size={18} color="#050505" />
        </TouchableOpacity>
        <TouchableOpacity style={h.iconBtn}>
          <FontAwesome6 name="bell" size={18} color="#050505" />
        </TouchableOpacity>
        <Image source={{ uri: getAvatar(user) }} style={h.avatar} />
      </View>
    </View>
  );
}

const h = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  logo: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 34, height: 34, borderRadius: 17, marginLeft: 4 },
});

export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isOnline = useNetworkStatus();

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getCache(CACHE_KEYS.POSTS);
      if (cached) { setPosts(cached); setLoading(false); }
    };
    loadCached();

    if (!isOnline) { setLoading(false); return; }

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(data);
      setCache(CACHE_KEYS.POSTS, data);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, [isOnline]);

  const onRefresh = () => setRefreshing(true);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <HomeHeader user={user} />
      <OfflineBanner />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} currentUser={user} />}
        ListHeaderComponent={
          <>
            <StoriesBar currentUser={user} />
            <CreatePost currentUser={user} />
          </>
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={{ fontSize: 48 }}>📰</Text>
            <Text style={s.empty}>No posts yet. Be the first to post!</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgGray },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  empty: { textAlign: 'center', color: Colors.textMuted, fontSize: 16 },
});
