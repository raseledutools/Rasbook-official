// src/screens/NotificationsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import {
  collection, query, where, orderBy, onSnapshot, limit, doc, updateDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import { Colors, timeAgo, getAvatar } from '../utils/theme';
import FriendButton from '../components/FriendButton';
import OfflineBanner from '../components/OfflineBanner';

const typeLabel = {
  like: 'liked your post.',
  comment: 'commented on your post.',
  friend_request: 'sent you a friend request.',
  friend_accepted: 'accepted your friend request.',
  message: 'sent you a message.',
  call: 'called you.',
};

const typeIcon = {
  like: '❤️',
  comment: '💬',
  friend_request: '👤',
  friend_accepted: '✅',
  message: '✉️',
  call: '📞',
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getFriendStatus } = useFriends();

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
      // Mark all as read
      snap.docs.forEach((d) => {
        if (!d.data()?.isRead) {
          updateDoc(doc(db, 'notifications', d.id), { isRead: true }).catch(() => {});
        }
      });
    });
    return unsub;
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />;

  const renderItem = ({ item }) => {
    const label = typeLabel[item.type] || 'interacted with you.';
    const icon = typeIcon[item.type] || '🔔';
    const isFriendRequest = item.type === 'friend_request';
    const isMessage = item.type === 'message';
    const isCall = item.type === 'call';
    const friendStatus = isFriendRequest ? getFriendStatus(item.fromUserId) : null;

    return (
      <View style={[s.item, !item.isRead && s.unread]}>
        <Image
          source={{ uri: item.fromUserAvatar || getAvatar({ uid: item.fromUserId }) }}
          style={s.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={s.text}>
            <Text style={{ fontWeight: 'bold' }}>{icon} {item.fromUserName}</Text> {isCall && item.callType === 'video' ? 'video called you.' : label}
          </Text>
          {isMessage && item.message && (
            <Text style={s.preview}>"{item.message}"</Text>
          )}
          <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
          {isFriendRequest && friendStatus && (
            <View style={{ marginTop: 8 }}>
              <FriendButton
                targetUser={{ uid: item.fromUserId, displayName: item.fromUserName, photoURL: item.fromUserAvatar }}
                status={friendStatus}
                onStatusChange={() => {}}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <OfflineBanner />
      <Text style={s.header}>Notifications</Text>
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
  header: { fontSize: 20, fontWeight: '800', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: Colors.border },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  unread: { backgroundColor: '#e7f0fd' },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  text: { fontSize: 14, color: Colors.black },
  time: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 60, color: Colors.textMuted, fontSize: 15 },
  preview: { fontSize: 13, color: Colors.textMuted, fontStyle: 'italic', marginTop: 2 },
});
