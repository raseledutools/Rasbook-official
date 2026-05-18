// src/hooks/useFriends.js
import { useState, useEffect } from 'react';
import { subscribeFriends } from '../services/friendsService';
import { useAuth } from './useAuth';

export const useFriends = () => {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeFriends(user.uid, setFriendships);
    return unsub;
  }, [user]);

  const friends = friendships
    .filter((f) => f.status === 'accepted')
    .map((f) => f.users.find((u) => u !== user.uid));

  const pendingReceived = friendships.filter(
    (f) => f.status === 'pending' && f.requestedBy !== user.uid
  );

  const pendingSent = friendships.filter(
    (f) => f.status === 'pending' && f.requestedBy === user.uid
  );

  const getFriendStatus = (otherUid) => {
    const f = friendships.find((fs) => fs.users.includes(otherUid));
    if (!f) return 'none';
    if (f.status === 'accepted') return 'friends';
    if (f.requestedBy === user.uid) return 'sent';
    return 'received';
  };

  return { friends, pendingReceived, pendingSent, getFriendStatus, friendships };
};
