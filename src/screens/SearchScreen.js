// src/screens/SearchScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, FlatList, Image,
  StyleSheet, TouchableOpacity,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../utils/theme';

export default function SearchScreen() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (text) => {
    setQuery(text);
    if (text.length < 2) return setResults([]);
    onSnapshot(collection(db, 'users'), (snap) => {
      const filtered = snap.docs
        .map((d) => d.data())
        .filter(
          (u) =>
            u.uid !== user.uid &&
            u.displayName?.toLowerCase().includes(text.toLowerCase())
        );
      setResults(filtered);
    });
  };

  return (
    <View style={s.container}>
      <TextInput
        style={s.input} placeholder="Search people..."
        placeholderTextColor="#999"
        value={query} onChangeText={handleSearch}
      />
      <FlatList
        data={results}
        keyExtractor={(i) => i.uid}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.item}>
            <Image source={{ uri: item.photoURL }} style={s.avatar} />
            <Text style={s.name}>{item.displayName}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 ? <Text style={s.empty}>No users found.</Text> : null
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: 16 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 24, padding: 12, paddingHorizontal: 16, fontSize: 15, marginBottom: 16, backgroundColor: Colors.bgGray, color: '#000' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.black },
  empty: { textAlign: 'center', marginTop: 30, color: Colors.textMuted },
});
