// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl,
  Text, ActivityIndicator,
} from 'react-native';
import {
  collection, query, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { setCache, getCache, CACHE_KEYS } from '../utils/cache';
import { Colors } from '../utils/theme';
import StoriesBar from '../components/StoriesBar';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import OfflineBanner from '../components/OfflineBanner';

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <Text style={s.empty}>No posts yet. Be the first to post!</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgGray },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.textMuted, fontSize: 16 },
});
