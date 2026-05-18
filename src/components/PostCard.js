// src/components/PostCard.js
import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, Pressable, Platform,
} from 'react-native';
import {
  doc, updateDoc, deleteDoc, arrayUnion, arrayRemove,
  getDoc, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Colors, getAvatar, getDisplayName, timeAgo } from '../utils/theme';

// expo-av crashes on web — lazy load only on native
const VideoPlayer = Platform.OS !== 'web'
  ? require('./VideoPlayerNative').default
  : ({ uri }) => (
      <video src={uri} controls style={{ width: '100%', height: 300, backgroundColor: '#000' }} />
    );

export default function PostCard({ post, currentUser }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editText, setEditText] = useState(post.text || '');

  const postRef = doc(db, 'posts', post.id);
  const isLiked = (post.likes || []).includes(currentUser.uid);
  const isOwner = post.userId === currentUser.uid;

  const sendNotification = async (type) => {
    if (post.userId === currentUser.uid) return;
    await addDoc(collection(db, 'notifications'), {
      toUserId: post.userId,
      fromUserName: getDisplayName(currentUser),
      fromUserAvatar: getAvatar(currentUser),
      type, postId: post.id,
      createdAt: serverTimestamp(), isRead: false,
    });
  };

  const handleLike = async () => {
    if (isLiked) {
      await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
      sendNotification('like');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const cId = Date.now().toString();
    await updateDoc(postRef, {
      comments: arrayUnion({
        commentId: cId, userId: currentUser.uid,
        userName: getDisplayName(currentUser),
        userAvatar: getAvatar(currentUser),
        text: commentText.trim(),
        timestamp: new Date().toISOString(),
      }),
    });
    setCommentText('');
    sendNotification('comment');
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert('Delete', 'Delete this comment?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const snap = await getDoc(postRef);
          if (snap.exists()) {
            await updateDoc(postRef, {
              comments: snap.data().comments.filter((c) => c.commentId !== commentId),
            });
          }
        },
      },
    ]);
  };

  const handleDelete = () =>
    Alert.alert('Delete Post', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(postRef) },
    ]);

  const handleEdit = () => { setEditText(post.text || ''); setEditModal(true); setShowMenu(false); };
  const saveEdit = async () => {
    if (editText.trim()) await updateDoc(postRef, { text: editText.trim() });
    setEditModal(false);
  };

  return (
    <View style={s.card}>
      <Modal visible={editModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setEditModal(false)}>
          <Pressable style={s.modalBox} onPress={() => {}}>
            <Text style={s.modalTitle}>Edit Post</Text>
            <TextInput
              style={s.modalInput} value={editText}
              onChangeText={setEditText} multiline autoFocus
              placeholder="Edit your post..." placeholderTextColor="#999"
            />
            <View style={s.modalActions}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={s.modalCancel}>
                <Text style={{ color: Colors.textMuted }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={s.modalSave}>
                <Text style={{ color: Colors.white, fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={s.header}>
        <Image source={{ uri: post.userAvatar || getAvatar({ displayName: post.userName }) }} style={s.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={s.author}>{post.userName}</Text>
          <Text style={s.time}>{timeAgo(post.createdAt)} • 🌎</Text>
        </View>
        {isOwner && (
          <View>
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
              <Text style={s.more}>•••</Text>
            </TouchableOpacity>
            {showMenu && (
              <View style={s.dropdown}>
                <TouchableOpacity style={s.menuItem} onPress={handleEdit}>
                  <Text>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.menuItem} onPress={() => { setShowMenu(false); handleDelete(); }}>
                  <Text style={{ color: Colors.danger }}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {!!post.text && <Text style={s.postText}>{post.text}</Text>}
      {post.mediaUrl && post.mediaType === 'image' && (
        <Image source={{ uri: post.mediaUrl }} style={s.media} resizeMode="cover" />
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <VideoPlayer uri={post.mediaUrl} />
      )}

      <View style={s.stats}>
        <Text style={s.statText}>👍 {(post.likes || []).length || ''}</Text>
        <Text style={s.statText}>{(post.comments || []).length} Comments</Text>
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.actionBtn} onPress={handleLike}>
          <Text style={[s.actionText, isLiked && { color: Colors.primary }]}>
            👍 {isLiked ? 'Liked' : 'Like'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtn} onPress={() => setShowComments(!showComments)}>
          <Text style={s.actionText}>💬 Comment</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={s.commentsSection}>
          {(post.comments || []).map((c) => {
            const canDel = c.userId === currentUser.uid || post.userId === currentUser.uid;
            return (
              <View key={c.commentId} style={s.commentItem}>
                <Image source={{ uri: c.userAvatar }} style={s.commentAvatar} />
                <View style={s.bubble}>
                  <Text style={s.commentAuthor}>{c.userName}</Text>
                  <Text style={s.commentText}>{c.text}</Text>
                </View>
                {canDel && (
                  <TouchableOpacity onPress={() => handleDeleteComment(c.commentId)}>
                    <Text style={{ color: Colors.danger, fontSize: 12, marginLeft: 4 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <View style={s.addComment}>
            <Image source={{ uri: getAvatar(currentUser) }} style={s.commentAvatar} />
            <TextInput
              style={s.commentInput} placeholder="Write a comment..."
              placeholderTextColor="#999" value={commentText}
              onChangeText={setCommentText} onSubmitEditing={handleComment}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleComment}>
              <Text style={{ color: Colors.primary, fontSize: 22 }}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.white, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: Colors.white, borderRadius: 12, padding: 20, width: '85%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: Colors.black },
  modalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 15, minHeight: 80, color: '#000', textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancel: { padding: 10 },
  modalSave: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, position: 'relative' },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  author: { fontWeight: 'bold', fontSize: 15, color: Colors.black },
  time: { fontSize: 12, color: Colors.textMuted },
  more: { fontSize: 20, color: Colors.textMuted, padding: 4 },
  dropdown: { position: 'absolute', right: 0, top: 30, backgroundColor: Colors.white, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 5, zIndex: 10, minWidth: 130 },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  postText: { paddingHorizontal: 15, paddingBottom: 10, fontSize: 15, lineHeight: 22, color: Colors.black },
  media: { width: '100%', height: 300, backgroundColor: '#000' },
  stats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statText: { color: Colors.textMuted, fontSize: 14 },
  footer: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 4 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 8 },
  actionText: { fontWeight: '600', color: Colors.textMuted, fontSize: 14 },
  commentsSection: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  commentItem: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  bubble: { backgroundColor: Colors.bgGray, borderRadius: 18, padding: 8, maxWidth: '80%' },
  commentAuthor: { fontWeight: 'bold', fontSize: 12, color: Colors.black },
  commentText: { fontSize: 14, color: Colors.black },
  addComment: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  commentInput: { flex: 1, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: '#000' },
});
