// src/components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../utils/theme';

export default function Header({ onSearch }) {
  return (
    <>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />
      <View style={s.header}>
        <Text style={s.logo}>
          <Text style={{ color: Colors.white }}>Ras</Text>
          <Text style={{ color: Colors.green }}>Book</Text>
        </Text>
        <View style={s.icons}>
          <TouchableOpacity style={s.iconBtn} onPress={onSearch}>
            <Text style={s.iconText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.iconText}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: Colors.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, paddingTop: 14 },
  logo: { fontSize: 28, fontWeight: '900' },
  icons: { flexDirection: 'row', gap: 8 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.25)', width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
});
