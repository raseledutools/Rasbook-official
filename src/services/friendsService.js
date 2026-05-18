// src/services/friendsService.js
import {
  doc, setDoc, deleteDoc, getDoc,
  collection, query, where, onSnapshot,
  serverTimestamp, addDoc,
} from 'firebase/firestore';
import { db } from './firebase';

// friendships collection: id = `${fromUid}_${toUid}`
const friendId = (a, b) => [a, b].sort().join('_');

export const sendFriendRequest = async (fromUser, toUser) => {
  const id = friendId(fromUser.uid, toUser.uid);
  await setDoc(doc(db, 'friendships', id), {
    users: [fromUser.uid, toUser.uid],
    requestedBy: fromUser.uid,
    status: 'pending', // pending | accepted
    createdAt: serverTimestamp(),
  });

  // notification
  await addDoc(collection(db, 'notifications'), {
    toUserId: toUser.uid,
    fromUserId: fromUser.uid,
    fromUserName: fromUser.displayName || 'User',
    fromUserAvatar: fromUser.photoURL || '',
    type: 'friend_request',
    isRead: false,
    createdAt: serverTimestamp(),
  });
};

export const acceptFriendRequest = async (currentUid, otherUid) => {
  const id = friendId(currentUid, otherUid);
  await setDoc(doc(db, 'friendships', id), { status: 'accepted' }, { merge: true });

  await addDoc(collection(db, 'notifications'), {
    toUserId: otherUid,
    fromUserId: currentUid,
    fromUserName: '',
    fromUserAvatar: '',
    type: 'friend_accepted',
    isRead: false,
    createdAt: serverTimestamp(),
  });
};

export const rejectFriendRequest = async (currentUid, otherUid) => {
  const id = friendId(currentUid, otherUid);
  await deleteDoc(doc(db, 'friendships', id));
};

export const unfriend = async (uid1, uid2) => {
  const id = friendId(uid1, uid2);
  await deleteDoc(doc(db, 'friendships', id));
};

// Subscribe to all friendships of a user
export const subscribeFriends = (uid, callback) => {
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
};

// Get friendship status between two users
export const getFriendshipStatus = async (uid1, uid2) => {
  const id = friendId(uid1, uid2);
  const snap = await getDoc(doc(db, 'friendships', id));
  if (!snap.exists()) return null;
  return snap.data();
};
