// src/components/FriendButton.js
import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
} from '../services/friendsService';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../utils/theme';

export default function FriendButton({ targetUser, status, onStatusChange }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handle = async (action) => {
    setLoading(true);
    try {
      if (action === 'send') {
        await sendFriendRequest(
          { uid: user.uid, displayName: user.displayName, photoURL: user.photoURL },
          targetUser
        );
        onStatusChange?.('sent');
      } else if (action === 'accept') {
        await acceptFriendRequest(user.uid, targetUser.uid);
        onStatusChange?.('friends');
      } else if (action === 'reject') {
        await rejectFriendRequest(user.uid, targetUser.uid);
        onStatusChange?.('none');
      } else if (action === 'unfriend') {
        Alert.alert('Unfriend', `${targetUser.displayName}-কে unfriend করবেন?`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unfriend', style: 'destructive',
            onPress: async () => {
              await unfriend(user.uid, targetUser.uid);
              onStatusChange?.('none');
            },
          },
        ]);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ margin: 8 }} />;

  if (status === 'none') {
    return (
      <TouchableOpacity style={[s.btn, { backgroundColor: Colors.primary }]} onPress={() => handle('send')}>
        <Text style={s.btnText}>➕ Add Friend</Text>
      </TouchableOpacity>
    );
  }

  if (status === 'sent') {
    return (
      <TouchableOpacity style={[s.btn, { backgroundColor: Colors.textMuted }]} onPress={() => handle('reject')}>
        <Text style={s.btnText}>⏳ Requested</Text>
      </TouchableOpacity>
    );
  }

  if (status === 'received') {
    return (
      <React.Fragment>
        <TouchableOpacity style={[s.btn, { backgroundColor: Colors.green }]} onPress={() => handle('accept')}>
          <Text style={s.btnText}>✅ Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, { backgroundColor: Colors.danger, marginTop: 6 }]} onPress={() => handle('reject')}>
          <Text style={s.btnText}>✖ Decline</Text>
        </TouchableOpacity>
      </React.Fragment>
    );
  }

  if (status === 'friends') {
    return (
      <TouchableOpacity style={[s.btn, { backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border }]} onPress={() => handle('unfriend')}>
        <Text style={[s.btnText, { color: Colors.black }]}>👥 Friends</Text>
      </TouchableOpacity>
    );
  }

  return null;
}

const s = StyleSheet.create({
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
