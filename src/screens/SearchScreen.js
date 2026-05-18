// src/screens/SearchScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, Image,
  StyleSheet,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import { Colors, getAvatar } from '../utils/theme';
import FriendButton from '../components/FriendButton';
import OfflineBanner from '../components/OfflineBanner';

export default function SearchScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const { getFriendStatus } = useFriends();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setAllUsers(snap.docs.map((d) => d.data()));
    });
    return unsub;
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.length < 2) return setResults([]);
    const filtered = allUsers.filter(
      (u) =>
        u.uid !== user.uid &&
        u.displayName?.toLowerCase().includes(text.toLowerCase())
    );
    setResults(filtered);
  };

  return (
    <View style={s.container}>
      <OfflineBanner />
      <TextInput
        style={s.input}
        placeholder="Search people..."
        placeholderTextColor="#999"
        value={query}
        onChangeText={handleSearch}
      />
      <FlatList
        data={results}
        keyExtractor={(i) => i.uid}
        renderItem={({ item }) => {
          const status = getFriendStatus(item.uid);
          return (
            <View style={s.item}>
              <Image source={{ uri: item.photoURL || getAvatar(item) }} style={s.avatar} />
              <Text style={s.name}>{item.displayName}</Text>
              <FriendButton
                targetUser={item}
                status={status}
                onStatusChange={() => {}}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          query.length >= 2 ? <Text style={s.empty}>No users found.</Text> : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 24, padding: 12, paddingHorizontal: 16, fontSize: 15, margin: 16, marginBottom: 8, backgroundColor: Colors.bgGray, color: '#000' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.black, flex: 1 },
  empty: { textAlign: 'center', marginTop: 30, color: Colors.textMuted },
});
