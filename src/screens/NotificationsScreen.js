// src/screens/NotificationsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import {
  collection, query, where, orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Colors, timeAgo } from '../utils/theme';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />;

  const renderItem = ({ item }) => {
    const action = item.type === 'like' ? 'liked your post.' : 'commented on your post.';
    return (
      <View style={[s.item, !item.isRead && s.unread]}>
        <Image source={{ uri: item.fromUserAvatar }} style={s.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={s.text}><Text style={{ fontWeight: 'bold' }}>{item.fromUserName}</Text> {action}</Text>
          <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={s.empty}>No notifications yet.</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  unread: { backgroundColor: '#e7f0fd' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  text: { fontSize: 14, color: Colors.black },
  time: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted, fontSize: 15 },
});
