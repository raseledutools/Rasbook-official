// src/screens/MessengerScreen.js — Fixed: real name, mic permission, smooth UI
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, Modal, KeyboardAvoidingView, Animated,
  Platform, Dimensions, ActivityIndicator, SafeAreaView,
} from 'react-native';
import {
  collection, doc, setDoc, updateDoc,
  onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db, getFirebaseAuth } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../utils/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { sendPushNotification, sendCallNotification } from '../services/notificationService';

// Mic + Camera permission using expo-av and expo-camera
const requestMediaPermission = async (type = 'audio') => {
  if (Platform.OS === 'web') return true; // web handles its own permission dialog
  try {
    if (type === 'audio' || type === 'video') {
      const { Audio } = await import('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return false;
    }
    if (type === 'video') {
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

const CHAT_NS = 'rasbook-messenger-v1';
const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W > 768;

const avatarUri = (name, url) =>
  url
    ? { uri: url }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877F2&color=fff&bold=true` };

const chatId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const timeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const RTC_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function MessengerScreen() {
  const { user } = useAuth();

  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const scrollRef = useRef();
  const chatUnsubRef = useRef(null);

  // calling
  const [callVisible, setCallVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [callType, setCallType] = useState('audio');
  const [incomingCall, setIncomingCall] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const pcRef = useRef(null);
  const localStream = useRef(null);
  const callIdRef = useRef(null);
  const remoteDescSet = useRef(false);
  const ringSound = useRef(null); // ringtone sound object
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for incoming call avatar
  useEffect(() => {
    if (callVisible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callVisible]);

  // ✅ Fix: Get real display name (not email)
  const myUid = user?.uid;
  const myName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const myPhoto = user?.photoURL || null;

  // ── Register & listen ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!myUid) return;

    const userRef = doc(db, 'messenger', CHAT_NS, 'users', myUid);
    // ✅ Fix: Always write real name to Firestore on login
    setDoc(userRef, {
      uid: myUid,
      name: myName,
      photoURL: myPhoto,
      lastActive: Date.now(),
    }, { merge: true });

    const interval = setInterval(() => {
      setDoc(userRef, { lastActive: Date.now() }, { merge: true });
    }, 60_000);

    const unsub = onSnapshot(
      collection(db, 'messenger', CHAT_NS, 'users'),
      (snap) => {
        const list = [];
        snap.forEach((d) => { if (d.id !== myUid) list.push(d.data()); });
        // ✅ Fix: Sort by lastActive so recent users appear first
        list.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
        setAllUsers(list);
        setLoadingUsers(false);
      }
    );

    const callsUnsub = onSnapshot(
      collection(db, 'messenger', CHAT_NS, 'calls'),
      (snap) => {
        snap.docChanges().forEach((change) => {
          const data = change.doc.data();
          const id = change.doc.id;
          if (
            (change.type === 'added' || change.type === 'modified') &&
            data.callee === myUid &&
            data.status === 'calling'
          ) {
            setIncomingCall({ id, ...data });
            setCallType(data.type);
            setCallStatus('Incoming call…');
            setCallVisible(true);
            startRing(true); // 🔔 incoming ringtone
          }
          if (data.status === 'ended' && callIdRef.current === id) {
            resetCallUI();
          }
        });
      }
    );

    return () => {
      clearInterval(interval);
      unsub();
      callsUnsub();
    };
  }, [myUid, myName]);

  // ── Open chat ────────────────────────────────────────────────────────────────
  const openChat = (contact) => {
    setActiveContact(contact);
    setMessages([]);
    if (chatUnsubRef.current) chatUnsubRef.current();

    const cid = chatId(myUid, contact.uid);
    const q = query(
      collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'),
      orderBy('ts', 'asc'),
      limit(150)
    );
    chatUnsubRef.current = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach((d) => {
        msgs.push({ id: d.id, ...d.data() });
        if (!d.data().read && d.data().sender !== myUid) {
          updateDoc(
            doc(db, 'messenger', CHAT_NS, 'chats', cid, 'messages', d.id),
            { read: true }
          );
        }
      });
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = msgInput.trim();
    if (!text || !activeContact) return;
    setMsgInput('');
    const cid = chatId(myUid, activeContact.uid);

    // 1. Save message to Firestore
    await addDoc(
      collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'),
      { text, sender: myUid, senderName: myName, ts: Date.now(), time: timeStr(), read: false }
    );

    // 2. In-app notification → Notification Centre এ দেখাবে
    addDoc(collection(db, 'notifications'), {
      toUserId: activeContact.uid,
      fromUserId: myUid,
      fromUserName: myName,
      fromUserAvatar: user?.photoURL || null,
      type: 'message',
      message: text.length > 60 ? text.slice(0, 60) + '…' : text,
      createdAt: serverTimestamp(),
      isRead: false,
    }).catch(() => {});

    // 3. Push notification (ফোনে system notification)
    getDoc(doc(db, 'users', activeContact.uid)).then((snap) => {
      const token = snap?.data()?.expoPushToken;
      if (token) sendPushNotification(token, myName, text, { type: 'message', fromUid: myUid });
    }).catch(() => {});
  };

  // ── WebRTC ────────────────────────────────────────────────────────────────────
  const initPC = () => {
    if (pcRef.current) pcRef.current.close();
    remoteDescSet.current = false;
    const pc = new RTCPeerConnection(RTC_SERVERS);
    pc.ontrack = (e) => console.log('Remote track:', e.track.kind);
    pcRef.current = pc;
    return pc;
  };

  const startCall = async (type) => {
    if (!activeContact) return;

    // ✅ Fix: Request permission before calling — shows proper dialog
    const granted = await requestMediaPermission(type);
    if (!granted) {
      Alert.alert(
        'Permission Required',
        type === 'video'
          ? 'Camera and Microphone permission needed for video call.'
          : 'Microphone permission needed for voice call.',
        [{ text: 'OK' }]
      );
      return;
    }

    setCallType(type);
    setCallStatus('Calling…');
    setCallVisible(true);
    startRing(false); // 🔔 outgoing ring tone

    try {
      let stream;
      if (Platform.OS === 'web') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video' ? { facingMode: 'user' } : false,
        });
      } else {
        // Native: RTCPeerConnection needs react-native-webrtc
        Alert.alert(
          'Info',
          'For native calling, add react-native-webrtc to your project. Calling works fully on web.',
          [{ text: 'OK', onPress: resetCallUI }]
        );
        return;
      }

      localStream.current = stream;
      const pc = initPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const cid = chatId(myUid, activeContact.uid);
      const callDoc = doc(db, 'messenger', CHAT_NS, 'calls', `call_${cid}_${Date.now()}`);
      callIdRef.current = callDoc.id;

      pc.onicecandidate = (e) => {
        if (e.candidate)
          addDoc(collection(callDoc, 'offerCandidates'), e.candidate.toJSON());
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await setDoc(callDoc, {
        offer: { type: offer.type, sdp: offer.sdp },
        caller: myUid, callerName: myName,
        callee: activeContact.uid,
        type, status: 'calling', ts: Date.now(),
      });

      // Full-screen call notification — CallKeep দিয়ে native call screen দেখাবে
      getDoc(doc(db, 'users', activeContact.uid)).then((snap) => {
        const data = snap?.data() || {};
        const tokens = {
          expoPushToken: data.expoPushToken,
          fcmToken: data.fcmToken,
        };
        sendCallNotification(tokens, myName, type, callDoc.id);
      }).catch(() => {});

      // In-app notification → Notification Centre এ দেখাবে
      addDoc(collection(db, 'notifications'), {
        toUserId: activeContact.uid,
        fromUserId: myUid,
        fromUserName: myName,
        fromUserAvatar: user?.photoURL || null,
        type: 'call',
        callType: type,
        createdAt: serverTimestamp(),
        isRead: false,
      }).catch(() => {});

      onSnapshot(callDoc, async (snap) => {
        const data = snap.data();
        if (pc && !remoteDescSet.current && data?.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          remoteDescSet.current = true;
          stopRing(); // stop ring when connected
          setCallStatus('Connected ✓');
        }
      });
    } catch (e) {
      Alert.alert('Error', 'Could not start call. Check permissions.');
      resetCallUI();
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    stopRing(); // stop ring when answered
    const granted = await requestMediaPermission(incomingCall.type);
    if (!granted) {
      Alert.alert('Permission Required', 'Microphone/Camera access denied.');
      resetCallUI();
      return;
    }
    setCallStatus('Connecting…');
    try {
      let stream;
      if (Platform.OS === 'web') {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: incomingCall.type === 'video' ? { facingMode: 'user' } : false,
        });
      } else {
        Alert.alert('Info', 'Native calling requires react-native-webrtc.', [{ text: 'OK', onPress: resetCallUI }]);
        return;
      }
      localStream.current = stream;
      const pc = initPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const callDoc = doc(db, 'messenger', CHAT_NS, 'calls', incomingCall.id);
      pc.onicecandidate = (e) => {
        if (e.candidate)
          addDoc(collection(callDoc, 'answerCandidates'), e.candidate.toJSON());
      };
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      remoteDescSet.current = true;
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(callDoc, { answer: { type: answer.type, sdp: answer.sdp }, status: 'answered' });
      setCallStatus('Connected ✓');
    } catch (e) {
      Alert.alert('Error', 'Could not connect.');
      resetCallUI();
    }
  };

  const hangupCall = async () => {
    const id = callIdRef.current || incomingCall?.id;
    if (id)
      await updateDoc(doc(db, 'messenger', CHAT_NS, 'calls', id), { status: 'ended' }).catch(() => {});
    resetCallUI();
  };

  // ── Ringtone helpers ─────────────────────────────────────────────────────────
  const startRing = async (isIncoming = false) => {
    try {
      const { Audio } = await import('expo-av');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        staysActiveInBackground: true,
      });
      // Use a free ringtone URL — classic phone ring sound
      const ringUrl = isIncoming
        ? 'https://actions.google.com/sounds/v1/phones/phone_alerts_and_rings.ogg'
        : 'https://actions.google.com/sounds/v1/phones/phone_alerts_and_rings.ogg';
      const { sound } = await Audio.Sound.createAsync(
        { uri: ringUrl },
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      ringSound.current = sound;
    } catch (e) {
      // ringtone failure is non-critical
    }
  };

  const stopRing = async () => {
    if (ringSound.current) {
      try {
        await ringSound.current.stopAsync();
        await ringSound.current.unloadAsync();
      } catch (e) {}
      ringSound.current = null;
    }
  };

  const resetCallUI = () => {
    stopRing();
    setCallVisible(false);
    setIncomingCall(null);
    callIdRef.current = null;
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    remoteDescSet.current = false;
  };

  const toggleMic = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicMuted(!track.enabled); }
  };

  const toggleCam = () => {
    const track = localStream.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOff(!track.enabled); }
  };

  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const showSidebar = !activeContact || IS_TABLET;
  const showChat = activeContact || IS_TABLET;

  // Online indicator (active in last 2 min)
  const isOnline = (u) => u.lastActive && Date.now() - u.lastActive < 120_000;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgGray }}>
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: 'row' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── SIDEBAR ─────────────────────────────────────────────── */}
        {showSidebar && (
          <View style={[s.sidebar, IS_TABLET && { width: 320 }]}>
            <View style={s.sideHeader}>
              <Text style={s.sideTitle}>
                <Text style={{ color: Colors.primary }}>Ras</Text>Book Messenger
              </Text>
            </View>

            <View style={s.searchWrap}>
              <FontAwesome6 name="magnifying-glass" size={14} color={Colors.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Search people…"
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <FontAwesome6 name="xmark" size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {loadingUsers ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
            ) : filteredUsers.length === 0 ? (
              <View style={s.emptyWrap}>
                <Text style={{ fontSize: 32 }}>💬</Text>
                <Text style={s.emptyTxt}>No users found</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {filteredUsers.map((contact) => (
                  <TouchableOpacity
                    key={contact.uid}
                    style={[
                      s.contactRow,
                      activeContact?.uid === contact.uid && s.contactRowActive,
                    ]}
                    onPress={() => openChat(contact)}
                  >
                    <View style={s.avatarWrap}>
                      <Image source={avatarUri(contact.name, contact.photoURL)} style={s.avatar} />
                      {isOnline(contact) && <View style={s.onlineDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      {/* ✅ Fix: Shows real name */}
                      <Text style={s.contactName}>{contact.name}</Text>
                      <Text style={s.contactSub}>
                        {isOnline(contact) ? '🟢 Active now' : 'Tap to message'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── CHAT AREA ──────────────────────────────────────────── */}
        {showChat && (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {activeContact ? (
              <>
                <View style={s.chatHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!IS_TABLET && (
                      <TouchableOpacity onPress={() => { setActiveContact(null); if (chatUnsubRef.current) chatUnsubRef.current(); }} style={{ paddingRight: 4 }}>
                        <FontAwesome6 name="arrow-left" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                    <View style={s.avatarWrap}>
                      <Image source={avatarUri(activeContact.name, activeContact.photoURL)} style={s.avatarSm} />
                      {isOnline(activeContact) && <View style={[s.onlineDot, { width: 10, height: 10, bottom: 0, right: 0 }]} />}
                    </View>
                    <View>
                      <Text style={s.chatHeaderName}>{activeContact.name}</Text>
                      <Text style={s.chatHeaderSub}>
                        {isOnline(activeContact) ? '🟢 Active now' : 'RasBook Messenger'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 18 }}>
                    <TouchableOpacity onPress={() => startCall('audio')} style={s.callIconBtn}>
                      <FontAwesome6 name="phone" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => startCall('video')} style={s.callIconBtn}>
                      <FontAwesome6 name="video" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  ref={scrollRef}
                  style={{ flex: 1, paddingHorizontal: 12, paddingTop: 10 }}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={s.e2eNote}>
                    <FontAwesome6 name="lock" size={10} color="#65676b" />
                    <Text style={s.e2eTxt}> End-to-end encrypted</Text>
                  </View>
                  {messages.map((msg) => {
                    const isMe = msg.sender === myUid;
                    return (
                      <View key={msg.id} style={[s.bubble, isMe ? s.bubbleOut : s.bubbleIn]}>
                        {!isMe && (
                          <Text style={s.bubbleSender}>{msg.senderName}</Text>
                        )}
                        <Text style={[s.bubbleText, isMe && { color: '#fff' }]}>{msg.text}</Text>
                        <View style={s.bubbleMeta}>
                          <Text style={[s.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>{msg.time}</Text>
                          {isMe && (
                            <FontAwesome6
                              name="check-double"
                              size={10}
                              color={msg.read ? '#4fc3f7' : 'rgba(255,255,255,0.5)'}
                            />
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={s.inputRow}>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.textInput}
                      placeholder="Aa"
                      placeholderTextColor={Colors.textMuted}
                      value={msgInput}
                      onChangeText={setMsgInput}
                      multiline
                    />
                  </View>
                  <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
                    <FontAwesome6
                      name={msgInput.trim() ? 'paper-plane' : 'thumbs-up'}
                      size={18}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={s.noChat}>
                <View style={s.noChatIcon}>
                  <FontAwesome6 name="facebook-messenger" size={48} color={Colors.primary} />
                </View>
                <Text style={s.noChatTitle}>Your Messages</Text>
                <Text style={s.noChatSub}>Select a contact to start chatting</Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── CALL MODAL ─────────────────────────────────────────────── */}
      <Modal visible={callVisible} animationType="slide" transparent>
        <View style={s.callBg}>
          {/* Pulse rings behind avatar */}
          <Animated.View style={[s.pulseRing, s.pulseRing3, { transform: [{ scale: pulseAnim }], opacity: 0.15 }]} />
          <Animated.View style={[s.pulseRing, s.pulseRing2, { transform: [{ scale: pulseAnim }], opacity: 0.25 }]} />
          <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.4 }]} />
          <Animated.Image
            source={avatarUri(
              incomingCall ? incomingCall.callerName || 'Caller' : activeContact?.name,
              incomingCall ? null : activeContact?.photoURL
            )}
            style={[s.callAvatar, { transform: [{ scale: pulseAnim }] }]}
          />
          <Text style={s.callName}>
            {incomingCall ? incomingCall.callerName || 'Incoming Call' : activeContact?.name}
          </Text>
          <Text style={s.callType}>
            {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
          </Text>
          <Text style={s.callStatus}>{callStatus}</Text>

          <View style={s.callBtns}>
            {incomingCall && callStatus === 'Incoming call…' && (
              <TouchableOpacity style={[s.callBtn, { backgroundColor: '#4caf50' }]} onPress={answerCall}>
                <FontAwesome6 name={callType === 'video' ? 'video' : 'phone'} size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {callStatus.startsWith('Connected') && (
              <>
                <TouchableOpacity
                  style={[s.callBtn, { backgroundColor: micMuted ? '#f44336' : 'rgba(255,255,255,0.2)' }]}
                  onPress={toggleMic}
                >
                  <FontAwesome6 name={micMuted ? 'microphone-slash' : 'microphone'} size={22} color="#fff" />
                </TouchableOpacity>
                {callType === 'video' && (
                  <TouchableOpacity
                    style={[s.callBtn, { backgroundColor: camOff ? '#f44336' : 'rgba(255,255,255,0.2)' }]}
                    onPress={toggleCam}
                  >
                    <FontAwesome6 name={camOff ? 'video-slash' : 'video'} size={22} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            )}
            <TouchableOpacity style={[s.callBtn, { backgroundColor: '#f44336' }]} onPress={hangupCall}>
              <FontAwesome6 name="phone-slash" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  sidebar: { flex: 1, backgroundColor: '#fff', borderRightWidth: 1, borderColor: Colors.border },
  sideHeader: { padding: 16, paddingTop: Platform.OS === 'ios' ? 8 : 16, borderBottomWidth: 1, borderColor: Colors.border },
  sideTitle: { fontSize: 20, fontWeight: '800', color: '#050505' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 10, backgroundColor: Colors.bgGray,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#050505' },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyTxt: { textAlign: 'center', color: Colors.textMuted, fontSize: 15 },
  avatarWrap: { position: 'relative' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#44b700', borderWidth: 2, borderColor: '#fff',
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    gap: 12, borderBottomWidth: 1, borderColor: Colors.border,
  },
  contactRowActive: { backgroundColor: '#e7f3ff' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarSm: { width: 36, height: 36, borderRadius: 18 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#050505' },
  contactSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  chatHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderColor: Colors.border,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: '#050505' },
  chatHeaderSub: { fontSize: 12, color: Colors.textMuted },
  callIconBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#e7f3ff',
    alignItems: 'center', justifyContent: 'center',
  },

  e2eNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  e2eTxt: { fontSize: 12, color: Colors.textMuted },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10, marginBottom: 6 },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#f0f2f5', borderTopLeftRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderTopRightRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 15, color: '#050505' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 10, borderTopWidth: 1, borderColor: Colors.border, backgroundColor: '#fff',
  },
  inputBox: {
    flex: 1, backgroundColor: Colors.bgGray, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100,
  },
  textInput: { fontSize: 15, color: '#050505' },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  noChat: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  noChatIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#e7f3ff',
    alignItems: 'center', justifyContent: 'center',
  },
  noChatTitle: { fontSize: 22, fontWeight: '700', color: '#050505' },
  noChatSub: { fontSize: 15, color: Colors.textMuted },

  callBg: { flex: 1, backgroundColor: '#1c1e2f', justifyContent: 'center', alignItems: 'center' },
  callAvatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: Colors.primary, marginBottom: 20, zIndex: 2 },
  pulseRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.primary, zIndex: 1 },
  pulseRing2: { width: 190, height: 190, borderRadius: 95 },
  pulseRing3: { width: 220, height: 220, borderRadius: 110 },
  callType: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, marginBottom: 4, letterSpacing: 0.5 },
  callName: { fontSize: 28, fontWeight: '700', color: '#fff' },
  callStatus: { fontSize: 16, color: Colors.primary, marginTop: 8, marginBottom: 50 },
  callBtns: { flexDirection: 'row', gap: 24 },
  callBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
