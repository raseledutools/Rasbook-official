// src/screens/MessengerScreen.js
// ✅ WebRTC logic ported from verified webrtc_core.js (RasGram)
// ✅ ICE candidate queue, proper track handling, ringtone, call timer, end sync

import React, { useState, useEffect, useRef } from 'react';
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

const CHAT_NS = 'rasbook-messenger-v1';
const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W > 768;

// ── Same STUN servers as webrtc_core.js
const RTC_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const avatarUri = (name, url) =>
  url
    ? { uri: url }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877F2&color=fff&bold=true` };

const chatId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const timeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatTime = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  // Call UI state
  const [callVisible, setCallVisible] = useState(false);
  const [callStatus, setCallStatus] = useState('');
  const [callType, setCallType] = useState('audio');
  const [isIncoming, setIsIncoming] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callerAvatar, setCallerAvatar] = useState('');
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef(null);

  // WebRTC refs — mirrors webrtc_core.js variables exactly
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const incomingCallDataRef = useRef(null);  // = incomingCallData
  const currentCallIdRef = useRef(null);      // = currentCallId
  const remoteDescSetRef = useRef(false);     // = remoteDescriptionSet
  const iceCandQueueRef = useRef([]);         // = iceCandidateQueue
  const callDocUnsubRef = useRef(null);
  const candidateUnsubRef = useRef(null);

  // Ringtone
  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);

  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const myUid = user?.uid;
  const myName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const myPhoto = user?.photoURL || null;

  // Pulse loop
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

  // ── Ringtone (Web Audio API)
  const playRingtone = (incoming = false) => {
    if (Platform.OS !== 'web') return;
    stopRingtone();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const beep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = incoming ? 440 : 480;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      };
      beep();
      ringIntervalRef.current = setInterval(beep, incoming ? 1500 : 2000);
    } catch (e) {}
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) { clearInterval(ringIntervalRef.current); ringIntervalRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} audioCtxRef.current = null; }
  };

  // ── Timer
  const startTimer = () => {
    stopTimer();
    setCallSeconds(0);
    timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setCallSeconds(0);
  };

  // ── initializePeerConnection — mirrors initializePeerConnection() in webrtc_core.js
  const initPC = () => {
    if (pcRef.current) pcRef.current.close();
    remoteDescSetRef.current = false;
    iceCandQueueRef.current = [];

    const pc = new RTCPeerConnection(RTC_SERVERS);

    if (Platform.OS === 'web') {
      // Create fresh MediaStream for remote tracks — exact same as webrtc_core.js
      let remoteVideoEl = document.getElementById('rb-remote-video');
      let remoteAudioEl = document.getElementById('rb-remote-audio');
      if (remoteVideoEl) remoteVideoEl.srcObject = new MediaStream();
      if (remoteAudioEl) remoteAudioEl.srcObject = new MediaStream();

      pc.ontrack = (event) => {
        const track = event.track;
        if (track.kind === 'video' && remoteVideoEl) {
          remoteVideoEl.srcObject.addTrack(track);
          remoteVideoEl.style.display = 'block';
          setTimeout(() => remoteVideoEl.play().catch(() => {}), 100);
        } else if (track.kind === 'audio' && remoteAudioEl) {
          remoteAudioEl.srcObject.addTrack(track);
          setTimeout(() => remoteAudioEl.play().catch(() => {}), 100);
        }
      };
    }

    // ICE state — start timer on connect
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setCallStatus('Connected');
        setCallConnected(true);
        startTimer();
        stopRingtone();
      }
      if (pc.iceConnectionState === 'failed') setCallStatus('Connection failed');
    };

    pcRef.current = pc;
    return pc;
  };

  // ── processIceCandidate — queue if remote desc not set yet (exact webrtc_core.js logic)
  const processIceCandidate = async (candidateData) => {
    if (remoteDescSetRef.current && pcRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateData)).catch(() => {});
    } else {
      iceCandQueueRef.current.push(candidateData);
    }
  };

  const flushIceQueue = async () => {
    for (const cand of iceCandQueueRef.current) {
      await pcRef.current?.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
    }
    iceCandQueueRef.current = [];
  };

  // ── User registration + incoming call listener
  useEffect(() => {
    if (!myUid) return;

    const userRef = doc(db, 'messenger', CHAT_NS, 'users', myUid);
    setDoc(userRef, { uid: myUid, name: myName, photoURL: myPhoto, lastActive: Date.now() }, { merge: true });

    const interval = setInterval(() => {
      setDoc(userRef, { lastActive: Date.now() }, { merge: true });
    }, 60_000);

    const usersUnsub = onSnapshot(collection(db, 'messenger', CHAT_NS, 'users'), (snap) => {
      const list = [];
      snap.forEach((d) => { if (d.id !== myUid) list.push(d.data()); });
      list.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
      setAllUsers(list);
      setLoadingUsers(false);
    });

    // ── listenForIncomingCallsWebRTC logic ported here
    const callsUnsub = onSnapshot(collection(db, 'messenger', CHAT_NS, 'calls'), (snap) => {
      snap.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;

        if (
          (change.type === 'added' || change.type === 'modified') &&
          data.callee === myUid &&
          data.status === 'calling'
        ) {
          incomingCallDataRef.current = { id, ...data };
          currentCallIdRef.current = id;
          setCallerName(data.callerName || 'Incoming Call');
          setCallerAvatar('');
          setCallType(data.type || 'audio');
          setCallStatus(data.type === 'video' ? 'Video Call' : 'Audio Call');
          setIsIncoming(true);
          setCallConnected(false);
          setCallVisible(true);
          playRingtone(true);
        }

        // Call ended — reset on both sides
        if (data.status === 'ended') {
          if (
            currentCallIdRef.current === id ||
            incomingCallDataRef.current?.id === id
          ) {
            resetCallUI();
          }
        }
      });
    });

    return () => {
      clearInterval(interval);
      usersUnsub();
      callsUnsub();
    };
  }, [myUid, myName]);

  // ── Open chat
  const openChat = (contact) => {
    setActiveContact(contact);
    setMessages([]);
    chatUnsubRef.current?.();
    const cid = chatId(myUid, contact.uid);
    const q = query(
      collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'),
      orderBy('ts', 'asc'), limit(150)
    );
    chatUnsubRef.current = onSnapshot(q, (snap) => {
      const msgs = [];
      snap.forEach((d) => {
        msgs.push({ id: d.id, ...d.data() });
        if (!d.data().read && d.data().sender !== myUid) {
          updateDoc(doc(db, 'messenger', CHAT_NS, 'chats', cid, 'messages', d.id), { read: true });
        }
      });
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
  };

  // ── Send message
  const sendMessage = async () => {
    const text = msgInput.trim();
    if (!text || !activeContact) return;
    setMsgInput('');
    const cid = chatId(myUid, activeContact.uid);
    await addDoc(collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'), {
      text, sender: myUid, senderName: myName, ts: Date.now(), time: timeStr(), read: false,
    });
    addDoc(collection(db, 'notifications'), {
      toUserId: activeContact.uid, fromUserId: myUid, fromUserName: myName,
      fromUserAvatar: user?.photoURL || null, type: 'message',
      message: text.length > 60 ? text.slice(0, 60) + '…' : text,
      createdAt: serverTimestamp(), isRead: false,
    }).catch(() => {});
    getDoc(doc(db, 'users', activeContact.uid)).then((snap) => {
      const token = snap?.data()?.expoPushToken;
      if (token) sendPushNotification(token, myName, text, { type: 'message', fromUid: myUid });
    }).catch(() => {});
  };

  // ── getMediaStream with fallback (mirrors webrtc_core.js)
  const getMediaStream = async (type) => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Calling works fully on web. Native requires react-native-webrtc.');
      return null;
    }
    let constraints = { audio: true };
    if (type === 'video') constraints.video = { facingMode: 'user' };
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // Camera fallback — mirrors webrtc_core.js
      console.warn('Camera failed, fallback to audio only.', err);
      try {
        return await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        Alert.alert('Permission Denied', 'Microphone access is required for calls.');
        return null;
      }
    }
  };

  // ── startCall — mirrors window.startCall in webrtc_core.js
  const startCall = async (type) => {
    if (!activeContact) return;
    setCallType(type);
    setCallStatus('Calling...');
    setIsIncoming(false);
    setCallConnected(false);
    setCallerName(activeContact.name);
    setCallerAvatar(activeContact.photoURL || '');
    setCallVisible(true);
    playRingtone(false);

    const stream = await getMediaStream(type);
    if (!stream) { resetCallUI(); return; }
    localStreamRef.current = stream;

    if (Platform.OS === 'web' && type === 'video') {
      const localVid = document.getElementById('rb-local-video');
      if (localVid) { localVid.srcObject = stream; localVid.style.display = 'block'; }
    }

    const pc = initPC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const chatHash = myUid < activeContact.uid
      ? `${myUid}_${activeContact.uid}`
      : `${activeContact.uid}_${myUid}`;
    const callDocId = `call_${chatHash}_${Date.now()}`;
    currentCallIdRef.current = callDocId;

    const callDocRef = doc(db, 'messenger', CHAT_NS, 'calls', callDocId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    pc.onicecandidate = (e) => {
      if (e.candidate) addDoc(offerCandidates, e.candidate.toJSON());
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await setDoc(callDocRef, {
      offer: { type: offer.type, sdp: offer.sdp },
      caller: myUid, callerName: myName, callerPhoto: myPhoto || null,
      callee: activeContact.uid, calleeName: activeContact.name,
      type, status: 'calling', timestamp: Date.now(),
    });

    // Push notification
    getDoc(doc(db, 'users', activeContact.uid)).then((snap) => {
      const data = snap?.data() || {};
      sendCallNotification({ expoPushToken: data.expoPushToken, fcmToken: data.fcmToken }, myName, type, callDocId);
    }).catch(() => {});

    addDoc(collection(db, 'notifications'), {
      toUserId: activeContact.uid, fromUserId: myUid, fromUserName: myName,
      fromUserAvatar: user?.photoURL || null, type: 'call', callType: type,
      createdAt: serverTimestamp(), isRead: false,
    }).catch(() => {});

    // Listen for answer — mirrors webrtc_core.js onSnapshot(callDocRef)
    callDocUnsubRef.current = onSnapshot(callDocRef, async (snap) => {
      const data = snap.data();
      if (!data) return;
      if (pc && !remoteDescSetRef.current && data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        remoteDescSetRef.current = true;
        setCallStatus('Connected');
        setCallConnected(true);
        startTimer();
        stopRingtone();
        await flushIceQueue();

        // Now listen for answer ICE candidates
        candidateUnsubRef.current = onSnapshot(answerCandidates, (candSnap) => {
          candSnap.docChanges().forEach((change) => {
            if (change.type === 'added') processIceCandidate(change.doc.data());
          });
        });
      }
      if (data.status === 'ended') resetCallUI();
    });
  };

  // ── answerCall — mirrors window.answerCall in webrtc_core.js
  const answerCall = async () => {
    if (!incomingCallDataRef.current) return;
    stopRingtone();
    setCallStatus('Connecting...');
    setIsIncoming(false);

    const incoming = incomingCallDataRef.current;
    const type = incoming.type || 'audio';

    const stream = await getMediaStream(type);
    if (!stream) { resetCallUI(); return; }
    localStreamRef.current = stream;

    if (Platform.OS === 'web' && type === 'video') {
      const localVid = document.getElementById('rb-local-video');
      if (localVid) { localVid.srcObject = stream; localVid.style.display = 'block'; }
    }

    const pc = initPC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    currentCallIdRef.current = incoming.id;
    const callDocRef = doc(db, 'messenger', CHAT_NS, 'calls', incoming.id);
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    const offerCandidates = collection(callDocRef, 'offerCandidates');

    pc.onicecandidate = (e) => {
      if (e.candidate) addDoc(answerCandidates, e.candidate.toJSON());
    };

    // Set remote desc (offer) first
    await pc.setRemoteDescription(new RTCSessionDescription(incoming.offer));
    remoteDescSetRef.current = true;
    await flushIceQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(callDocRef, {
      answer: { type: answer.type, sdp: answer.sdp },
      status: 'answered',
    });

    setCallStatus('Connected');
    setCallConnected(true);
    startTimer();

    // Listen for offer ICE candidates
    candidateUnsubRef.current = onSnapshot(offerCandidates, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') processIceCandidate(change.doc.data());
      });
    });

    // Listen for call end
    callDocUnsubRef.current = onSnapshot(callDocRef, (snap) => {
      if (snap.data()?.status === 'ended') resetCallUI();
    });
  };

  // ── hangupCall — mirrors window.hangupCall in webrtc_core.js
  const hangupCall = async () => {
    const id = currentCallIdRef.current || incomingCallDataRef.current?.id;
    if (id) {
      await updateDoc(doc(db, 'messenger', CHAT_NS, 'calls', id), { status: 'ended' }).catch(() => {});
    }
    resetCallUI();
  };

  // ── resetCallUI — mirrors window.resetCallUI in webrtc_core.js
  const resetCallUI = () => {
    stopRingtone();
    stopTimer();
    callDocUnsubRef.current?.(); callDocUnsubRef.current = null;
    candidateUnsubRef.current?.(); candidateUnsubRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (Platform.OS === 'web') {
      const ids = ['rb-remote-audio', 'rb-remote-video', 'rb-local-video'];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.srcObject = null; el.style.display = 'none'; }
      });
    }

    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    incomingCallDataRef.current = null;
    currentCallIdRef.current = null;
    remoteDescSetRef.current = false;
    iceCandQueueRef.current = [];

    setCallVisible(false);
    setCallConnected(false);
    setIsIncoming(false);
    setMicMuted(false);
    setCamOff(false);
    setCallStatus('');
  };

  // ── toggleMic / toggleCam — mirrors webrtc_core.js
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setMicMuted(!track.enabled); }
  };
  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setCamOff(!track.enabled); }
  };

  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );
  const showSidebar = !activeContact || IS_TABLET;
  const showChat = activeContact || IS_TABLET;
  const isOnline = (u) => u.lastActive && Date.now() - u.lastActive < 120_000;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgGray }}>
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: 'row' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* SIDEBAR */}
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
                style={s.searchInput} placeholder="Search people…"
                placeholderTextColor={Colors.textMuted} value={search} onChangeText={setSearch}
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
                    style={[s.contactRow, activeContact?.uid === contact.uid && s.contactRowActive]}
                    onPress={() => openChat(contact)}
                  >
                    <View style={s.avatarWrap}>
                      <Image source={avatarUri(contact.name, contact.photoURL)} style={s.avatar} />
                      {isOnline(contact) && <View style={s.onlineDot} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.contactName}>{contact.name}</Text>
                      <Text style={s.contactSub}>{isOnline(contact) ? '🟢 Active now' : 'Tap to message'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* CHAT AREA */}
        {showChat && (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {activeContact ? (
              <>
                <View style={s.chatHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!IS_TABLET && (
                      <TouchableOpacity onPress={() => { setActiveContact(null); chatUnsubRef.current?.(); }} style={{ paddingRight: 4 }}>
                        <FontAwesome6 name="arrow-left" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                    <View style={s.avatarWrap}>
                      <Image source={avatarUri(activeContact.name, activeContact.photoURL)} style={s.avatarSm} />
                      {isOnline(activeContact) && <View style={[s.onlineDot, { width: 10, height: 10, bottom: 0, right: 0 }]} />}
                    </View>
                    <View>
                      <Text style={s.chatHeaderName}>{activeContact.name}</Text>
                      <Text style={s.chatHeaderSub}>{isOnline(activeContact) ? '🟢 Active now' : 'RasBook Messenger'}</Text>
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
                <ScrollView ref={scrollRef} style={{ flex: 1, paddingHorizontal: 12, paddingTop: 10 }} contentContainerStyle={{ paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
                  <View style={s.e2eNote}>
                    <FontAwesome6 name="lock" size={10} color="#65676b" />
                    <Text style={s.e2eTxt}> End-to-end encrypted</Text>
                  </View>
                  {messages.map((msg) => {
                    const isMe = msg.sender === myUid;
                    return (
                      <View key={msg.id} style={[s.bubble, isMe ? s.bubbleOut : s.bubbleIn]}>
                        {!isMe && <Text style={s.bubbleSender}>{msg.senderName}</Text>}
                        <Text style={[s.bubbleText, isMe && { color: '#fff' }]}>{msg.text}</Text>
                        <View style={s.bubbleMeta}>
                          <Text style={[s.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>{msg.time}</Text>
                          {isMe && <FontAwesome6 name="check-double" size={10} color={msg.read ? '#4fc3f7' : 'rgba(255,255,255,0.5)'} />}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={s.inputRow}>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.textInput} placeholder="Aa" placeholderTextColor={Colors.textMuted}
                      value={msgInput} onChangeText={setMsgInput} multiline
                    />
                  </View>
                  <TouchableOpacity style={s.sendBtn} onPress={sendMessage}>
                    <FontAwesome6 name={msgInput.trim() ? 'paper-plane' : 'thumbs-up'} size={18} color="#fff" />
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

      {/* CALL MODAL */}
      <Modal visible={callVisible} animationType="slide" transparent={false}>
        <View style={s.callBg}>
          {(!callConnected || callType === 'audio') && (
            <>
              <Animated.View style={[s.pulseRing, s.pulseRing3, { transform: [{ scale: pulseAnim }], opacity: 0.15 }]} />
              <Animated.View style={[s.pulseRing, s.pulseRing2, { transform: [{ scale: pulseAnim }], opacity: 0.25 }]} />
              <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.4 }]} />
              <Animated.Image
                source={avatarUri(callerName, callerAvatar)}
                style={[s.callAvatar, { transform: [{ scale: pulseAnim }] }]}
              />
            </>
          )}
          <Text style={s.callName}>{callerName}</Text>
          <Text style={s.callTypeText}>{callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}</Text>
          <Text style={s.callStatus}>{callConnected ? formatTime(callSeconds) : callStatus}</Text>

          <View style={s.callBtns}>
            {isIncoming && !callConnected && (
              <TouchableOpacity style={[s.callBtn, { backgroundColor: '#4caf50' }]} onPress={answerCall}>
                <FontAwesome6 name={callType === 'video' ? 'video' : 'phone'} size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {callConnected && (
              <>
                <TouchableOpacity style={[s.callBtn, { backgroundColor: micMuted ? '#f44336' : 'rgba(255,255,255,0.2)' }]} onPress={toggleMic}>
                  <FontAwesome6 name={micMuted ? 'microphone-slash' : 'microphone'} size={22} color="#fff" />
                </TouchableOpacity>
                {callType === 'video' && (
                  <TouchableOpacity style={[s.callBtn, { backgroundColor: camOff ? '#f44336' : 'rgba(255,255,255,0.2)' }]} onPress={toggleCam}>
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

      {/* Web: inject <audio> and <video> DOM elements for remote/local streams */}
      {Platform.OS === 'web' && callVisible && <WebMediaElements callType={callType} callConnected={callConnected} />}
    </SafeAreaView>
  );
}

// Inject real DOM <video>/<audio> elements for web WebRTC streams
function WebMediaElements({ callType, callConnected }) {
  useEffect(() => {
    const ensure = (id, tag, props) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement(tag); el.id = id; Object.assign(el, props); document.body.appendChild(el); }
      return el;
    };
    ensure('rb-remote-audio', 'audio', { autoplay: true, playsInline: true });
    const remoteVid = ensure('rb-remote-video', 'video', { autoplay: true, playsInline: true });
    Object.assign(remoteVid.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 290, display: 'none', background: '#000' });
    const localVid = ensure('rb-local-video', 'video', { autoplay: true, playsInline: true, muted: true });
    Object.assign(localVid.style, { position: 'fixed', bottom: '120px', right: '16px', width: '100px', height: '140px', objectFit: 'cover', borderRadius: '12px', zIndex: 310, display: 'none', border: '2px solid #fff' });
    return () => {
      ['rb-remote-audio', 'rb-remote-video', 'rb-local-video'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.srcObject = null; el.remove(); }
      });
    };
  }, []);

  useEffect(() => {
    const el = document.getElementById('rb-remote-video');
    if (el) el.style.display = (callType === 'video' && callConnected) ? 'block' : 'none';
  }, [callType, callConnected]);

  return null;
}

const s = StyleSheet.create({
  sidebar: { flex: 1, backgroundColor: '#fff', borderRightWidth: 1, borderColor: Colors.border },
  sideHeader: { padding: 16, paddingTop: Platform.OS === 'ios' ? 8 : 16, borderBottomWidth: 1, borderColor: Colors.border },
  sideTitle: { fontSize: 20, fontWeight: '800', color: '#050505' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 10, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#050505' },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyTxt: { textAlign: 'center', color: Colors.textMuted, fontSize: 15 },
  avatarWrap: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#44b700', borderWidth: 2, borderColor: '#fff' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 1, borderColor: Colors.border },
  contactRowActive: { backgroundColor: '#e7f3ff' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarSm: { width: 36, height: 36, borderRadius: 18 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#050505' },
  contactSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: '#050505' },
  chatHeaderSub: { fontSize: 12, color: Colors.textMuted },
  callIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e7f3ff', alignItems: 'center', justifyContent: 'center' },
  e2eNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  e2eTxt: { fontSize: 12, color: Colors.textMuted },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10, marginBottom: 6 },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#f0f2f5', borderTopLeftRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderTopRightRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 15, color: '#050505' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1, borderColor: Colors.border, backgroundColor: '#fff' },
  inputBox: { flex: 1, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100 },
  textInput: { fontSize: 15, color: '#050505' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  noChat: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  noChatIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e7f3ff', alignItems: 'center', justifyContent: 'center' },
  noChatTitle: { fontSize: 22, fontWeight: '700', color: '#050505' },
  noChatSub: { fontSize: 15, color: Colors.textMuted },
  callBg: { flex: 1, backgroundColor: '#1c1e2f', justifyContent: 'center', alignItems: 'center' },
  callAvatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: Colors.primary, marginBottom: 20, zIndex: 2 },
  pulseRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.primary, zIndex: 1 },
  pulseRing2: { width: 190, height: 190, borderRadius: 95 },
  pulseRing3: { width: 220, height: 220, borderRadius: 110 },
  callName: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 8 },
  callTypeText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 0.5 },
  callStatus: { fontSize: 22, color: Colors.primary, marginTop: 8, marginBottom: 50, fontWeight: '600', letterSpacing: 1 },
  callBtns: { flexDirection: 'row', gap: 24 },
  callBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});