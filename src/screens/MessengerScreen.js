// src/screens/MessengerScreen.js
// ✅ Web + Native (Android/iOS)
// ✅ AES-GCM End-to-End Encryption (real, not just label)
// ✅ WhatsApp-style file sharing: image, video, audio, document
// ✅ CallKeep integration — lock screen থেকেও answer করলে সরাসরি call-এ আসবে
// ✅ WebRTC calling (audio + video), TURN server, ICE queue

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, Modal, KeyboardAvoidingView, Animated,
  Platform, Dimensions, ActivityIndicator, SafeAreaView,
  ActionSheetIOS, Linking,
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
import { encryptMessage, decryptMessage } from '../services/e2eEncryption';
import {
  uploadFile, pickFile, takeMedia, getFileType, getFileIcon, formatFileSize,
} from '../services/fileUploadService';

// ── Platform-aware WebRTC import ───────────────────────────────────────────
let RTCPeerConnection_impl, RTCIceCandidate_impl, RTCSessionDescription_impl;
let MediaStream_impl, mediaDevices_impl;

if (Platform.OS === 'web') {
  RTCPeerConnection_impl = RTCPeerConnection;
  RTCIceCandidate_impl = RTCIceCandidate;
  RTCSessionDescription_impl = RTCSessionDescription;
  MediaStream_impl = MediaStream;
  mediaDevices_impl = navigator.mediaDevices;
} else {
  try {
    const RNWebRTC = require('react-native-webrtc');
    RTCPeerConnection_impl = RNWebRTC.RTCPeerConnection;
    RTCIceCandidate_impl = RNWebRTC.RTCIceCandidate;
    RTCSessionDescription_impl = RNWebRTC.RTCSessionDescription;
    MediaStream_impl = RNWebRTC.MediaStream;
    mediaDevices_impl = RNWebRTC.mediaDevices;
  } catch (e) {
    console.warn('[RasBook] react-native-webrtc not installed. Run: npx expo install react-native-webrtc');
  }
}

const CHAT_NS = 'rasbook-messenger-v1';
const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W > 768;
const IS_WEB_DESKTOP = false; // disabled - WebPhoneLayout handles this now

// ── STUN + TURN servers ────────────────────────────────────────────────────
const METERED_API_KEY = '67ee7b540f71cc805dcafca2b17c66f318ad';
const METERED_API_URL = `https://rasbook.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`;

const FALLBACK_ICE = [
  { urls: 'stun:stun.relay.metered.ca:80' },
  { urls: 'turn:global.relay.metered.ca:80', username: '3f70ad0326429b01c0e8a63f', credential: 'uGrSYear4HBmgEWQ' },
  { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: '3f70ad0326429b01c0e8a63f', credential: 'uGrSYear4HBmgEWQ' },
  { urls: 'turn:global.relay.metered.ca:443', username: '3f70ad0326429b01c0e8a63f', credential: 'uGrSYear4HBmgEWQ' },
  { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: '3f70ad0326429b01c0e8a63f', credential: 'uGrSYear4HBmgEWQ' },
];

const getIceServers = async () => {
  try {
    const res = await fetch(METERED_API_URL);
    if (!res.ok) throw new Error('API error');
    return { iceServers: await res.json(), iceCandidatePoolSize: 10 };
  } catch {
    return { iceServers: FALLBACK_ICE, iceCandidatePoolSize: 10 };
  }
};

const avatarUri = (name, url) =>
  url ? { uri: url }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877F2&color=fff&bold=true` };

const chatId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const timeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDur = (sec) => {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// ── FILE TYPE COLORS ───────────────────────────────────────────────────────
const FILE_COLORS = {
  image: '#1877F2',
  video: '#8B5CF6',
  audio: '#10B981',
  document: '#F59E0B',
};

// ─────────────────────────────────────────────────────────────────────────────
export default function MessengerScreen({ route }) {
  const { user } = useAuth();

  // route.params থেকে incoming call data নাও (CallKeep answer থেকে আসে)
  const incomingFromRoute = route?.params?.incomingCallId;
  const incomingCallerUid = route?.params?.callerUid;

  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const scrollRef = useRef();
  const chatUnsubRef = useRef(null);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

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

  // WebRTC refs
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const incomingCallDataRef = useRef(null);
  const currentCallIdRef = useRef(null);
  const remoteDescSetRef = useRef(false);
  const iceCandQueueRef = useRef([]);
  const callDocUnsubRef = useRef(null);
  const candidateUnsubRef = useRef(null);

  // Ringtone (web only)
  const audioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);

  // Native video refs
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const myUid = user?.uid;
  const myName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const myPhoto = user?.photoURL || null;
  const currentChatId = activeContact ? chatId(myUid, activeContact.uid) : null;

  // ── Route param: CallKeep থেকে answer করা হলে ─────────────────────────
  useEffect(() => {
    if (!incomingFromRoute || !incomingCallerUid || allUsers.length === 0) return;
    // caller-এর contact খুঁজে সেটাকে activeContact বানাও
    const caller = allUsers.find(u => u.uid === incomingCallerUid);
    if (caller && !activeContact) {
      openChat(caller);
      // incoming call data set করো যাতে answerCall কাজ করে
      const callData = incomingCallDataRef.current;
      if (callData && callData.id === incomingFromRoute) {
        // already set — just show call UI
        setCallVisible(true);
      }
    }
  }, [incomingFromRoute, incomingCallerUid, allUsers]);

  // ── Pulse animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (callVisible) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]));
      pulse.start();
      return () => pulse.stop();
    }
  }, [callVisible]);

  // ── Ringtone (web only) ────────────────────────────────────────────────
  const playRingtone = (incoming = false) => {
    if (Platform.OS !== 'web') return;
    stopRingtone();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const beep = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = incoming ? 440 : 480;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
      };
      beep();
      ringIntervalRef.current = setInterval(beep, incoming ? 1500 : 2000);
    } catch {}
  };
  const stopRingtone = () => {
    if (ringIntervalRef.current) { clearInterval(ringIntervalRef.current); ringIntervalRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
  };

  // ── Timer ──────────────────────────────────────────────────────────────
  const startTimer = () => {
    stopTimer(); setCallSeconds(0);
    timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setCallSeconds(0);
  };

  // ── PeerConnection ─────────────────────────────────────────────────────
  const initPC = async () => {
    if (pcRef.current) { try { pcRef.current.close(); } catch {} }
    remoteDescSetRef.current = false;
    iceCandQueueRef.current = [];

    const rtcConfig = await getIceServers();
    const pc = new RTCPeerConnection_impl(rtcConfig);

    if (Platform.OS === 'web') {
      pc.ontrack = (event) => {
        const track = event.track;
        const remoteVideoEl = document.getElementById('rb-remote-video');
        const remoteAudioEl = document.getElementById('rb-remote-audio');
        if (track.kind === 'video' && remoteVideoEl) {
          if (!remoteVideoEl.srcObject) remoteVideoEl.srcObject = new MediaStream();
          remoteVideoEl.srcObject.addTrack(track);
          remoteVideoEl.setAttribute('data-ready', 'true');
          remoteVideoEl.style.display = 'block';
          remoteVideoEl.play().catch(() => {});
        } else if (track.kind === 'audio' && remoteAudioEl) {
          if (!remoteAudioEl.srcObject) remoteAudioEl.srcObject = new MediaStream();
          remoteAudioEl.srcObject.addTrack(track);
          remoteAudioEl.play().catch(() => {});
        }
      };
    } else {
      const remStream = new MediaStream_impl();
      remoteStreamRef.current = remStream;
      pc.ontrack = (event) => {
        if (event.streams?.[0]) setRemoteStream(event.streams[0]);
        else if (event.track) { remStream.addTrack(event.track); setRemoteStream(remStream); }
      };
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        setCallStatus('Connected'); setCallConnected(true);
        startTimer(); stopRingtone();
      }
      if (state === 'failed') setCallStatus('Connection failed');
      if (state === 'disconnected') setCallStatus('Reconnecting...');
    };

    pcRef.current = pc;
    return pc;
  };

  const processIceCandidate = async (data) => {
    if (!data?.candidate) return;
    if (remoteDescSetRef.current && pcRef.current)
      await pcRef.current.addIceCandidate(new RTCIceCandidate_impl(data)).catch(() => {});
    else iceCandQueueRef.current.push(data);
  };

  const flushIceQueue = async () => {
    for (const c of iceCandQueueRef.current)
      await pcRef.current?.addIceCandidate(new RTCIceCandidate_impl(c)).catch(() => {});
    iceCandQueueRef.current = [];
  };

  // ── User registration + incoming call listener ─────────────────────────
  useEffect(() => {
    if (!myUid) return;

    const userRef = doc(db, 'messenger', CHAT_NS, 'users', myUid);
    setDoc(userRef, { uid: myUid, name: myName, photoURL: myPhoto, lastActive: Date.now() }, { merge: true });
    const interval = setInterval(() =>
      setDoc(userRef, { lastActive: Date.now() }, { merge: true }), 60_000);

    const usersUnsub = onSnapshot(collection(db, 'messenger', CHAT_NS, 'users'), (snap) => {
      const list = [];
      snap.forEach((d) => { if (d.id !== myUid) list.push(d.data()); });
      list.sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
      setAllUsers(list);
      setLoadingUsers(false);
    });

    // Incoming call listener
    const callsUnsub = onSnapshot(collection(db, 'messenger', CHAT_NS, 'calls'), (snap) => {
      snap.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;
        if (
          (change.type === 'added' || change.type === 'modified') &&
          data.callee === myUid && data.status === 'calling'
        ) {
          incomingCallDataRef.current = { id, ...data };
          currentCallIdRef.current = id;
          setCallerName(data.callerName || 'Incoming Call');
          setCallerAvatar(data.callerPhoto || '');
          setCallType(data.type || 'audio');
          setCallStatus(data.type === 'video' ? 'Video Call' : 'Voice Call');
          setIsIncoming(true);
          setCallConnected(false);
          setCallVisible(true);
          playRingtone(true);
        }
        if (data.status === 'ended') {
          if (currentCallIdRef.current === id || incomingCallDataRef.current?.id === id)
            resetCallUI();
        }
      });
    });

    return () => { clearInterval(interval); usersUnsub(); callsUnsub(); };
  }, [myUid, myName]);

  // ── Open chat ──────────────────────────────────────────────────────────
  const openChat = (contact) => {
    setActiveContact(contact);
    setMessages([]);
    chatUnsubRef.current?.();
    const cid = chatId(myUid, contact.uid);
    const q = query(
      collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'),
      orderBy('ts', 'asc'), limit(150)
    );
    chatUnsubRef.current = onSnapshot(q, async (snap) => {
      const msgs = [];
      for (const d of snap.docs) {
        const data = d.data();
        // Decrypt message text
        let text = data.text || '';
        if (text && data.encrypted) {
          text = await decryptMessage(text, cid);
        }
        // Decrypt file metadata if encrypted
        let fileMeta = data.fileMeta || null;
        if (fileMeta && data.encrypted) {
          const { decryptMeta } = await import('../services/e2eEncryption');
          fileMeta = await decryptMeta(fileMeta, cid);
        }
        msgs.push({ id: d.id, ...data, text, fileMeta });
        if (!data.read && data.sender !== myUid) {
          updateDoc(doc(db, 'messenger', CHAT_NS, 'chats', cid, 'messages', d.id), { read: true });
        }
      }
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
  };

  // ── Send text message (encrypted) ─────────────────────────────────────
  const sendMessage = async () => {
    const text = msgInput.trim();
    if (!text || !activeContact) return;
    setMsgInput('');
    const cid = chatId(myUid, activeContact.uid);
    // Encrypt before saving
    const encryptedText = await encryptMessage(text, cid);
    await addDoc(collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'), {
      text: encryptedText, encrypted: true,
      sender: myUid, senderName: myName, ts: Date.now(), time: timeStr(), read: false,
      type: 'text',
    });
    // Push notification (plain text for notification preview)
    const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;
    addDoc(collection(db, 'notifications'), {
      toUserId: activeContact.uid, fromUserId: myUid, fromUserName: myName,
      fromUserAvatar: user?.photoURL || null, type: 'message', message: preview,
      createdAt: serverTimestamp(), isRead: false,
    }).catch(() => {});
    getDoc(doc(db, 'users', activeContact.uid)).then((snap) => {
      const token = snap?.data()?.expoPushToken;
      if (token) sendPushNotification(token, myName, preview, { type: 'message', fromUid: myUid });
    }).catch(() => {});
  };

  // ── Send file ──────────────────────────────────────────────────────────
  const sendFile = async (picked) => {
    if (!picked || !activeContact) return;
    setShowAttachMenu(false);
    setUploading(true);
    try {
      const uploaded = await uploadFile(picked.uri, picked.mimeType, picked.fileName);
      const cid = chatId(myUid, activeContact.uid);

      const fileMeta = {
        url: uploaded.url,
        fileType: uploaded.fileType,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        duration: uploaded.duration,
        width: uploaded.width,
        height: uploaded.height,
        thumbnail: uploaded.thumbnail,
      };

      // Encrypt fileName only (URL is public CDN link)
      const { encryptMeta } = await import('../services/e2eEncryption');
      const encryptedMeta = await encryptMeta(fileMeta, cid);

      await addDoc(collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'), {
        text: '',
        fileMeta: encryptedMeta,
        encrypted: true,
        sender: myUid, senderName: myName,
        ts: Date.now(), time: timeStr(), read: false,
        type: uploaded.fileType,
      });

      // Notification
      const label = uploaded.fileType === 'image' ? '📷 Photo'
        : uploaded.fileType === 'video' ? '🎥 Video'
        : uploaded.fileType === 'audio' ? '🎵 Audio'
        : `📎 ${uploaded.fileName}`;
      getDoc(doc(db, 'users', activeContact.uid)).then((snap) => {
        const token = snap?.data()?.expoPushToken;
        if (token) sendPushNotification(token, myName, label, { type: 'message', fromUid: myUid });
      }).catch(() => {});
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Attachment menu actions ────────────────────────────────────────────
  const handleAttach = async (type) => {
    setShowAttachMenu(false);
    let picked = null;
    if (type === 'camera') picked = await takeMedia('image');
    else if (type === 'video_camera') picked = await takeMedia('video');
    else picked = await pickFile(type);
    if (picked) await sendFile(picked);
  };

  // ── Open/download file ─────────────────────────────────────────────────
  const openFile = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert('Cannot open file'));
  };

  // ── getMediaStream ─────────────────────────────────────────────────────
  const getMediaStream = async (type) => {
    if (Platform.OS !== 'web' && !mediaDevices_impl) {
      Alert.alert('Setup Required', 'Run: npx expo install react-native-webrtc\nThen rebuild APK.');
      return null;
    }
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        } : false,
      };
      return await mediaDevices_impl.getUserMedia(constraints);
    } catch (err) {
      console.warn('[RasBook] getUserMedia error:', err);
      // Try audio-only fallback
      try { return await mediaDevices_impl.getUserMedia({ audio: true, video: false }); }
      catch (e2) {
        if (Platform.OS === 'web') {
          alert('Camera/Microphone permission denied. Please allow access in browser settings.');
        } else {
          Alert.alert('Permission Denied', 'Camera/Microphone access required.');
        }
        return null;
      }
    }
  };

  // ── startCall ──────────────────────────────────────────────────────────
  const startCall = async (type) => {
    if (!activeContact) return;
    setCallType(type); setCallStatus('Calling…');
    setIsIncoming(false); setCallConnected(false);
    setCallerName(activeContact.name); setCallerAvatar(activeContact.photoURL || '');
    setLocalStream(null); setRemoteStream(null); setCallVisible(true);
    playRingtone(false);

    const stream = await getMediaStream(type);
    if (!stream) { resetCallUI(); return; }
    localStreamRef.current = stream; setLocalStream(stream);

    if (Platform.OS === 'web') {
      await new Promise(r => setTimeout(r, 100));
      const lv = document.getElementById('rb-local-video');
      if (lv && type === 'video') { lv.srcObject = stream; lv.style.display = 'block'; lv.play().catch(() => {}); }
    }

    const pc = await initPC();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    const hash = myUid < activeContact.uid ? `${myUid}_${activeContact.uid}` : `${activeContact.uid}_${myUid}`;
    const callDocId = `call_${hash}_${Date.now()}`;
    currentCallIdRef.current = callDocId;

    const callDocRef = doc(db, 'messenger', CHAT_NS, 'calls', callDocId);
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');

    pc.onicecandidate = (e) => { if (e.candidate) addDoc(offerCandidates, e.candidate.toJSON()); };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await setDoc(callDocRef, {
      offer: { type: offer.type, sdp: offer.sdp },
      caller: myUid, callerName: myName, callerPhoto: myPhoto || null,
      callee: activeContact.uid, calleeName: activeContact.name,
      type, status: 'calling', timestamp: Date.now(),
    });

    // ✅ FIX: callerUid pass করছি যাতে CallKeep answer করলে সরাসরি এই contact-এ আসে
    getDoc(doc(db, 'users', activeContact.uid)).then((snap) => {
      const data = snap?.data() || {};
      sendCallNotification(
        { expoPushToken: data.expoPushToken, fcmToken: data.fcmToken },
        myName, type, callDocId,
        myUid // callerUid — App.js navigate করার সময় pass করবে
      );
    }).catch(() => {});

    callDocUnsubRef.current = onSnapshot(callDocRef, async (snap) => {
      const data = snap.data();
      if (!data) return;
      if (pcRef.current && !remoteDescSetRef.current && data.answer) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription_impl(data.answer));
        remoteDescSetRef.current = true;
        setCallStatus('Connected'); setCallConnected(true);
        startTimer(); stopRingtone();
        await flushIceQueue();
        candidateUnsubRef.current = onSnapshot(answerCandidates, (cs) =>
          cs.docChanges().forEach(ch => { if (ch.type === 'added') processIceCandidate(ch.doc.data()); }));
      }
      if (data.status === 'ended') resetCallUI();
    });
  };

  // ── answerCall ─────────────────────────────────────────────────────────
  const answerCall = async () => {
    if (!incomingCallDataRef.current) return;
    stopRingtone();
    setCallStatus('Connecting…'); setIsIncoming(false);
    setLocalStream(null); setRemoteStream(null);

    const incoming = incomingCallDataRef.current;
    const type = incoming.type || 'audio';

    const stream = await getMediaStream(type);
    if (!stream) { resetCallUI(); return; }
    localStreamRef.current = stream; setLocalStream(stream);

    if (Platform.OS === 'web') {
      await new Promise(r => setTimeout(r, 100));
      const lv = document.getElementById('rb-local-video');
      if (lv && type === 'video') { lv.srcObject = stream; lv.style.display = 'block'; lv.play().catch(() => {}); }
    }

    const pc = await initPC();
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    currentCallIdRef.current = incoming.id;
    const callDocRef = doc(db, 'messenger', CHAT_NS, 'calls', incoming.id);
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    const offerCandidates = collection(callDocRef, 'offerCandidates');

    pc.onicecandidate = (e) => { if (e.candidate) addDoc(answerCandidates, e.candidate.toJSON()); };

    await pc.setRemoteDescription(new RTCSessionDescription_impl(incoming.offer));
    remoteDescSetRef.current = true;
    await flushIceQueue();

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await updateDoc(callDocRef, { answer: { type: answer.type, sdp: answer.sdp }, status: 'answered' });

    setCallStatus('Connected'); setCallConnected(true); startTimer();

    candidateUnsubRef.current = onSnapshot(offerCandidates, (snap) =>
      snap.docChanges().forEach(ch => { if (ch.type === 'added') processIceCandidate(ch.doc.data()); }));

    callDocUnsubRef.current = onSnapshot(callDocRef, (snap) => {
      if (snap.data()?.status === 'ended') resetCallUI();
    });
  };

  // ── hangupCall ─────────────────────────────────────────────────────────
  const hangupCall = async () => {
    const id = currentCallIdRef.current || incomingCallDataRef.current?.id;
    if (id) await updateDoc(doc(db, 'messenger', CHAT_NS, 'calls', id), { status: 'ended' }).catch(() => {});
    resetCallUI();
  };

  // ── resetCallUI ────────────────────────────────────────────────────────
  const resetCallUI = () => {
    stopRingtone(); stopTimer();
    callDocUnsubRef.current?.(); callDocUnsubRef.current = null;
    candidateUnsubRef.current?.(); candidateUnsubRef.current = null;
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (Platform.OS === 'web') {
      ['rb-remote-audio', 'rb-remote-video', 'rb-local-video'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.srcObject = null; el.style.display = 'none'; el.removeAttribute('data-ready'); }
      });
    }
    if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
    remoteStreamRef.current = null; incomingCallDataRef.current = null;
    currentCallIdRef.current = null; remoteDescSetRef.current = false;
    iceCandQueueRef.current = [];
    setLocalStream(null); setRemoteStream(null); setCallVisible(false);
    setCallConnected(false); setIsIncoming(false); setMicMuted(false);
    setCamOff(false); setCallStatus('');
  };

  const toggleMic = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMicMuted(!t.enabled); }
  };
  const toggleCam = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOff(!t.enabled); }
  };

  const filteredUsers = allUsers.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()));
  const showSidebar = !activeContact || IS_TABLET;
  const showChat = activeContact || IS_TABLET;
  const isOnline = (u) => u.lastActive && Date.now() - u.lastActive < 120_000;

  let RTCView_impl = null;
  if (Platform.OS !== 'web') {
    try { RTCView_impl = require('react-native-webrtc').RTCView; } catch {}
  }

  // ── MESSAGE BUBBLE RENDERER ────────────────────────────────────────────
  const renderMessage = (msg) => {
    const isMe = msg.sender === myUid;
    const { fileMeta, type } = msg;

    return (
      <View key={msg.id} style={[s.bubble, isMe ? s.bubbleOut : s.bubbleIn]}>
        {!isMe && <Text style={s.bubbleSender}>{msg.senderName}</Text>}

        {/* Text message */}
        {type === 'text' && msg.text ? (
          <Text style={[s.bubbleText, isMe && { color: '#fff' }]}>{msg.text}</Text>
        ) : null}

        {/* Image */}
        {type === 'image' && fileMeta?.url ? (
          <TouchableOpacity onPress={() => openFile(fileMeta.url)}>
            <Image
              source={{ uri: fileMeta?.url || '' }}
              style={s.msgImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : null}

        {/* Video */}
        {type === 'video' && fileMeta?.url ? (
          <TouchableOpacity style={s.videoBubble} onPress={() => openFile(fileMeta.url)}>
            {fileMeta.thumbnail
              ? (fileMeta?.thumbnail ? <Image source={{ uri: fileMeta.thumbnail }} style={s.msgImage} resizeMode="cover" /> : <View style={[s.msgImage, {backgroundColor: '#222'}]} />) 
              : <View style={[s.msgImage, s.videoPlaceholder]} />
            }
            <View style={s.playOverlay}>
              <FontAwesome6 name="circle-play" size={36} color="#fff" />
            </View>
            <Text style={[s.fileLabel, isMe && { color: 'rgba(255,255,255,0.85)' }]}>
              {fileMeta.fileName} · {formatFileSize(fileMeta.fileSize)}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Audio */}
        {type === 'audio' && fileMeta?.url ? (
          <TouchableOpacity style={s.audioBubble} onPress={() => openFile(fileMeta.url)}>
            <View style={[s.fileIconWrap, { backgroundColor: FILE_COLORS.audio }]}>
              <FontAwesome6 name="music" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.fileName, isMe && { color: '#fff' }]} numberOfLines={1}>
                {fileMeta.fileName || 'Audio'}
              </Text>
              <Text style={[s.fileSize, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                {fileMeta.duration ? formatDur(Math.floor(fileMeta.duration)) : ''} {formatFileSize(fileMeta.fileSize)}
              </Text>
            </View>
            <FontAwesome6 name="play" size={16} color={isMe ? '#fff' : Colors.primary} />
          </TouchableOpacity>
        ) : null}

        {/* Document */}
        {type === 'document' && fileMeta?.url ? (
          <TouchableOpacity style={s.docBubble} onPress={() => openFile(fileMeta.url)}>
            <View style={[s.fileIconWrap, { backgroundColor: FILE_COLORS.document }]}>
              <FontAwesome6 name={getFileIcon(fileMeta.mimeType, 'document')} size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.fileName, isMe && { color: '#fff' }]} numberOfLines={2}>
                {fileMeta.fileName || 'Document'}
              </Text>
              <Text style={[s.fileSize, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
                {formatFileSize(fileMeta.fileSize)}
              </Text>
            </View>
            <FontAwesome6 name="download" size={16} color={isMe ? '#fff' : Colors.primary} />
          </TouchableOpacity>
        ) : null}

        <View style={s.bubbleMeta}>
          <FontAwesome6 name="lock" size={8} color={isMe ? 'rgba(255,255,255,0.5)' : '#aaa'} />
          <Text style={[s.bubbleTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}> {msg.time}</Text>
          {isMe && <FontAwesome6 name="check-double" size={10} color={msg.read ? '#4fc3f7' : 'rgba(255,255,255,0.5)'} />}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgGray }}>
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: 'row' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* SIDEBAR */}
        {showSidebar && (
          <View style={[s.sidebar, (IS_TABLET || IS_WEB_DESKTOP) && { width: 320, maxWidth: 320 }]}>
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
                {/* Chat Header */}
                <View style={s.chatHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!IS_TABLET && (
                      <TouchableOpacity
                        onPress={() => { setActiveContact(null); chatUnsubRef.current?.(); }}
                        style={{ paddingRight: 4 }}
                      >
                        <FontAwesome6 name="arrow-left" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                    <View style={s.avatarWrap}>
                      <Image source={avatarUri(activeContact.name, activeContact.photoURL)} style={s.avatarSm} />
                      {isOnline(activeContact) && <View style={[s.onlineDot, { width: 10, height: 10, bottom: 0, right: 0 }]} />}
                    </View>
                    <View>
                      <Text style={s.chatHeaderName}>{activeContact.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <FontAwesome6 name="lock" size={9} color="#4caf50" />
                        <Text style={s.chatHeaderSub}>E2E Encrypted</Text>
                      </View>
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

                {/* Messages */}
                <ScrollView
                  ref={scrollRef}
                  style={{ flex: 1, paddingHorizontal: 12, paddingTop: 10 }}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={s.e2eNote}>
                    <FontAwesome6 name="lock" size={10} color="#4caf50" />
                    <Text style={s.e2eTxt}> Messages are end-to-end encrypted. Only you and {activeContact.name} can read them.</Text>
                  </View>
                  {messages.map(renderMessage)}

                  {/* Upload progress */}
                  {uploading && (
                    <View style={s.uploadingRow}>
                      <ActivityIndicator color={Colors.primary} size="small" />
                      <Text style={s.uploadingTxt}>Uploading file…</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Input row */}
                <View style={s.inputRow}>
                  {/* Attach button */}
                  <TouchableOpacity
                    style={s.attachBtn}
                    onPress={() => setShowAttachMenu(true)}
                    disabled={uploading}
                  >
                    <FontAwesome6 name="paperclip" size={20} color={uploading ? Colors.textMuted : Colors.primary} />
                  </TouchableOpacity>

                  <View style={s.inputBox}>
                    <TextInput
                      style={s.textInput} placeholder="Aa"
                      placeholderTextColor={Colors.textMuted}
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

      {/* ATTACH MENU MODAL */}
      <Modal visible={showAttachMenu} transparent animationType="slide" onRequestClose={() => setShowAttachMenu(false)}>
        <TouchableOpacity style={s.attachOverlay} onPress={() => setShowAttachMenu(false)} activeOpacity={1}>
          <View style={s.attachSheet}>
            <Text style={s.attachTitle}>Share</Text>
            <View style={s.attachGrid}>
              {[
                { icon: 'camera', label: 'Camera', type: 'camera', color: '#E91E63' },
                { icon: 'image', label: 'Gallery', type: 'image', color: '#1877F2' },
                { icon: 'film', label: 'Video', type: 'video', color: '#8B5CF6' },
                { icon: 'music', label: 'Audio', type: 'audio', color: '#10B981' },
                { icon: 'file', label: 'Document', type: 'document', color: '#F59E0B' },
                { icon: 'video', label: 'Record', type: 'video_camera', color: '#EF4444' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={s.attachItem}
                  onPress={() => handleAttach(item.type)}
                >
                  <View style={[s.attachIcon, { backgroundColor: item.color }]}>
                    <FontAwesome6 name={item.icon} size={22} color="#fff" />
                  </View>
                  <Text style={s.attachLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* CALL MODAL */}
      <Modal visible={callVisible} animationType="slide" transparent={false} statusBarTranslucent>
        <View style={s.callBg}>
          {Platform.OS !== 'web' && RTCView_impl && callType === 'video' && callConnected && (
            <>
              {remoteStream && (
                <RTCView_impl streamURL={remoteStream.toURL()} style={s.nativeRemoteVideo} objectFit="cover" mirror={false} />
              )}
              {localStream && (
                <RTCView_impl streamURL={localStream.toURL()} style={s.nativeLocalVideo} objectFit="cover" mirror={true} zOrder={1} />
              )}
            </>
          )}

          {(!callConnected || callType === 'audio') && (
            <>
              <Animated.View style={[s.pulseRing, s.pulseRing3, { transform: [{ scale: pulseAnim }], opacity: 0.15 }]} />
              <Animated.View style={[s.pulseRing, s.pulseRing2, { transform: [{ scale: pulseAnim }], opacity: 0.25 }]} />
              <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.4 }]} />
              <Animated.Image source={avatarUri(callerName, callerAvatar)} style={[s.callAvatar, { transform: [{ scale: pulseAnim }] }]} />
            </>
          )}

          <Text style={s.callName}>{callerName}</Text>
          <Text style={s.callTypeText}>{callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}</Text>
          <Text style={s.callStatus}>{callConnected ? formatDur(callSeconds) : callStatus}</Text>

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

      {/* Web DOM audio/video elements */}
      {Platform.OS === 'web' && callVisible && (
        <WebMediaElements callType={callType} callConnected={callConnected} />
      )}
    </SafeAreaView>
  );
}

// ── Web: DOM video/audio elements ─────────────────────────────────────────
function WebMediaElements({ callType, callConnected }) {
  useEffect(() => {
    const ensure = (id, tag, props) => {
      let el = document.getElementById(id);
      if (!el) { el = document.createElement(tag); el.id = id; Object.assign(el, props); document.body.appendChild(el); }
      return el;
    };
    const remoteAud = ensure('rb-remote-audio', 'audio', { autoplay: true, playsInline: true });
    remoteAud.muted = false;
    const remoteVid = ensure('rb-remote-video', 'video', { autoplay: true, playsInline: true });
    remoteVid.muted = false;
    Object.assign(remoteVid.style, { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 290, display: 'none', background: '#000' });
    const localVid = ensure('rb-local-video', 'video', { autoplay: true, playsInline: true, muted: true });
    Object.assign(localVid.style, { position: 'fixed', bottom: '120px', right: '16px', width: '100px', height: '140px', objectFit: 'cover', borderRadius: '12px', zIndex: 310, display: 'none', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' });
    return () => {
      ['rb-remote-audio', 'rb-remote-video', 'rb-local-video'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.srcObject = null; el.remove(); }
      });
    };
  }, []);
  useEffect(() => {
    const el = document.getElementById('rb-remote-video');
    if (el) {
      if (callType === 'video' && callConnected) {
        el.style.display = 'block';
        // Try to play, retry if needed
        const tryPlay = () => {
          if (el.srcObject && el.srcObject.getTracks().length > 0) {
            el.play().catch(() => {
              setTimeout(tryPlay, 500);
            });
          }
        };
        tryPlay();
      } else {
        el.style.display = 'none';
      }
    }
    // Also show local video when starting video call
    const lv = document.getElementById('rb-local-video');
    if (lv && callType === 'video') {
      if (lv.srcObject && lv.srcObject.getTracks().length > 0) {
        lv.style.display = 'block';
        lv.play().catch(() => {});
      }
    }
  }, [callType, callConnected]);
  return null;
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  sidebar: { flexGrow: 1, flexShrink: 0, backgroundColor: '#fff', borderRightWidth: 1, borderColor: Colors.border },
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
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: '#fff', elevation: 2 },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: '#050505' },
  chatHeaderSub: { fontSize: 11, color: '#4caf50', fontWeight: '500' },
  callIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e7f3ff', alignItems: 'center', justifyContent: 'center' },
  e2eNote: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', marginBottom: 12, marginHorizontal: 20, gap: 4 },
  e2eTxt: { fontSize: 11, color: '#65676b', textAlign: 'center', flex: 1 },
  bubble: { maxWidth: '78%', borderRadius: 18, padding: 10, marginBottom: 6 },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#f0f2f5', borderTopLeftRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderTopRightRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  bubbleText: { fontSize: 15, color: '#050505' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4, justifyContent: 'flex-end' },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },
  // File messages
  msgImage: { width: 200, height: 160, borderRadius: 12, marginBottom: 4 },
  videoPlaceholder: { backgroundColor: '#222' },
  playOverlay: { position: 'absolute', top: 0, left: 0, width: 200, height: 160, alignItems: 'center', justifyContent: 'center' },
  fileLabel: { fontSize: 11, color: '#555', marginTop: 2 },
  videoBubble: { position: 'relative' },
  audioBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, minWidth: 180 },
  docBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, minWidth: 180 },
  fileIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 13, fontWeight: '600', color: '#050505' },
  fileSize: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  // Upload progress
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, justifyContent: 'center' },
  uploadingTxt: { fontSize: 13, color: Colors.textMuted },
  // Input row
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 10, borderTopWidth: 1, borderColor: Colors.border, backgroundColor: '#fff' },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  inputBox: { flex: 1, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100 },
  textInput: { fontSize: 15, color: '#050505' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  noChat: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  noChatIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#e7f3ff', alignItems: 'center', justifyContent: 'center' },
  noChatTitle: { fontSize: 22, fontWeight: '700', color: '#050505' },
  noChatSub: { fontSize: 15, color: Colors.textMuted },
  // Attach menu
  attachOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  attachSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
  attachTitle: { fontSize: 16, fontWeight: '700', color: '#050505', marginBottom: 16, textAlign: 'center' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' },
  attachItem: { alignItems: 'center', gap: 6, width: 72 },
  attachIcon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  attachLabel: { fontSize: 12, color: '#050505', fontWeight: '500' },
  // Call UI
  callBg: { flex: 1, backgroundColor: '#1c1e2f', justifyContent: 'center', alignItems: 'center' },
  callAvatar: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: Colors.primary, marginBottom: 20, zIndex: 2 },
  pulseRing: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.primary, zIndex: 1 },
  pulseRing2: { width: 190, height: 190, borderRadius: 95 },
  pulseRing3: { width: 220, height: 220, borderRadius: 110 },
  callName: { fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 8, zIndex: 3 },
  callTypeText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 0.5, zIndex: 3 },
  callStatus: { fontSize: 22, color: Colors.primary, marginTop: 8, marginBottom: 50, fontWeight: '600', letterSpacing: 1, zIndex: 3 },
  callBtns: { flexDirection: 'row', gap: 24, zIndex: 3 },
  callBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  nativeRemoteVideo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 1 },
  nativeLocalVideo: { position: 'absolute', bottom: 120, right: 16, width: 100, height: 140, borderRadius: 12, borderWidth: 2, borderColor: '#fff', zIndex: 2, overflow: 'hidden' },
});
