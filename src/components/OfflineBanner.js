// src/components/OfflineBanner.js
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={s.banner}>
      <Text style={s.text}>📵 No Internet — Offline Mode</Text>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    backgroundColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 999,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
