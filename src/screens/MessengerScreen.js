// src/screens/MessengerScreen.js
// RasBook Messenger — merged from RasGram (WhatsApp-style chat + WebRTC calling)

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Image, Alert, Modal, KeyboardAvoidingView,
  Platform, Dimensions, ActivityIndicator, SafeAreaView,
} from 'react-native';
import {
  collection, doc, setDoc, getDoc, updateDoc,
  onSnapshot, query, orderBy, limit, addDoc,
} from 'firebase/firestore';
import { db, getFirebaseAuth } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../utils/theme';
import { FontAwesome6 } from '@expo/vector-icons';

const CHAT_NS = 'rasbook-messenger-v1'; // Firestore namespace
const { width: SCREEN_W } = Dimensions.get('window');
const IS_TABLET = SCREEN_W > 768;

// ─── helpers ────────────────────────────────────────────────────────────────
const avatarUri = (name, url) =>
  url
    ? { uri: url }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=1877F2&color=fff&bold=true` };

const chatId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
const timeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

// ─── WebRTC STUN ─────────────────────────────────────────────────────────────
const RTC_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function MessengerScreen() {
  const { user } = useAuth();

  // contacts / chat
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const scrollRef = useRef();

  // calling (WebRTC)
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
  const iceCandQueue = useRef([]);

  const myUid = user?.uid;
  const myName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const myPhoto = user?.photoURL || null;

  // ── Register / keep user presence ──────────────────────────────────────────
  useEffect(() => {
    if (!myUid) return;

    const userRef = doc(db, 'messenger', CHAT_NS, 'users', myUid);
    setDoc(userRef, {
      uid: myUid,
      name: myName,
      photoURL: myPhoto,
      lastActive: Date.now(),
    }, { merge: true });

    const interval = setInterval(() => {
      setDoc(userRef, { lastActive: Date.now() }, { merge: true });
    }, 60_000);

    // listen all users
    const unsub = onSnapshot(
      collection(db, 'messenger', CHAT_NS, 'users'),
      (snap) => {
        const list = [];
        snap.forEach((d) => { if (d.id !== myUid) list.push(d.data()); });
        setAllUsers(list);
        setLoadingUsers(false);
      }
    );

    // listen incoming calls
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
          }
          if (
            data.status === 'ended' &&
            (callIdRef.current === id || incomingCall?.id === id)
          ) {
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
  }, [myUid]);

  // ── Open chat ───────────────────────────────────────────────────────────────
  const openChat = (contact) => {
    setActiveContact(contact);
    const cid = chatId(myUid, contact.uid);
    const q = query(
      collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'),
      orderBy('ts', 'asc'),
      limit(150)
    );
    onSnapshot(q, (snap) => {
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

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = msgInput.trim();
    if (!text || !activeContact) return;
    setMsgInput('');
    const cid = chatId(myUid, activeContact.uid);
    await addDoc(
      collection(db, 'messenger', CHAT_NS, 'chats', cid, 'messages'),
      { text, sender: myUid, senderName: myName, ts: Date.now(), time: timeStr(), read: false }
    );
  };

  // ── WebRTC ──────────────────────────────────────────────────────────────────
  const initPC = () => {
    if (pcRef.current) pcRef.current.close();
    remoteDescSet.current = false;
    iceCandQueue.current = [];
    const pc = new RTCPeerConnection(RTC_SERVERS);
    pc.ontrack = (e) => console.log('Remote track:', e.track.kind);
    pcRef.current = pc;
    return pc;
  };

  const startCall = async (type) => {
    if (!activeContact) return;
    setCallType(type);
    setCallStatus('Calling…');
    setCallVisible(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false,
      });
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
        caller: myUid, callee: activeContact.uid,
        type, status: 'calling', ts: Date.now(),
      });

      onSnapshot(callDoc, async (snap) => {
        const data = snap.data();
        if (pc && !remoteDescSet.current && data?.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          remoteDescSet.current = true;
          setCallStatus('Connected');
        }
      });
    } catch {
      Alert.alert('Error', 'Microphone/Camera permission denied.');
      resetCallUI();
    }
  };

  const answerCall = async () => {
    if (!incomingCall) return;
    setCallStatus('Connecting…');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: incomingCall.type === 'video' ? { facingMode: 'user' } : false,
      });
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
      setCallStatus('Connected');
    } catch {
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

  const resetCallUI = () => {
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

  // ── Filtered users ──────────────────────────────────────────────────────────
  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  const showSidebar = !activeContact || IS_TABLET;
  const showChat = activeContact || IS_TABLET;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgGray }}>
      <KeyboardAvoidingView
        style={{ flex: 1, flexDirection: 'row' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        {showSidebar && (
          <View style={[s.sidebar, IS_TABLET && { width: 320 }]}>
            {/* Header */}
            <View style={s.sideHeader}>
              <Text style={s.sideTitle}>
                <Text style={{ color: Colors.primary }}>Ras</Text>Book Messenger
              </Text>
            </View>

            {/* Search */}
            <View style={s.searchWrap}>
              <FontAwesome6 name="magnifying-glass" size={14} color={Colors.textMuted} />
              <TextInput
                style={s.searchInput}
                placeholder="Search people…"
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Users list */}
            {loadingUsers ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />
            ) : filteredUsers.length === 0 ? (
              <Text style={s.emptyTxt}>No users found</Text>
            ) : (
              <ScrollView>
                {filteredUsers.map((contact) => (
                  <TouchableOpacity
                    key={contact.uid}
                    style={[
                      s.contactRow,
                      activeContact?.uid === contact.uid && s.contactRowActive,
                    ]}
                    onPress={() => openChat(contact)}
                  >
                    <Image source={avatarUri(contact.name, contact.photoURL)} style={s.avatar} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.contactName}>{contact.name}</Text>
                      <Text style={s.contactSub} numberOfLines={1}>Tap to message</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── CHAT AREA ───────────────────────────────────────────────── */}
        {showChat && (
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {activeContact ? (
              <>
                {/* Chat header */}
                <View style={s.chatHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!IS_TABLET && (
                      <TouchableOpacity onPress={() => setActiveContact(null)} style={{ paddingRight: 4 }}>
                        <FontAwesome6 name="arrow-left" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    )}
                    <Image source={avatarUri(activeContact.name, activeContact.photoURL)} style={s.avatarSm} />
                    <View>
                      <Text style={s.chatHeaderName}>{activeContact.name}</Text>
                      <Text style={s.chatHeaderSub}>RasBook Messenger</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 18 }}>
                    <TouchableOpacity onPress={() => startCall('audio')}>
                      <FontAwesome6 name="phone" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => startCall('video')}>
                      <FontAwesome6 name="video" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Messages */}
                <ScrollView
                  ref={scrollRef}
                  style={{ flex: 1, paddingHorizontal: 12, paddingTop: 10 }}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  <View style={s.e2eNote}>
                    <FontAwesome6 name="lock" size={10} color="#65676b" />
                    <Text style={s.e2eTxt}> End-to-end encrypted</Text>
                  </View>
                  {messages.map((msg) => {
                    const isMe = msg.sender === myUid;
                    return (
                      <View
                        key={msg.id}
                        style={[s.bubble, isMe ? s.bubbleOut : s.bubbleIn]}
                      >
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

                {/* Input */}
                <View style={s.inputRow}>
                  <View style={s.inputBox}>
                    <TextInput
                      style={s.textInput}
                      placeholder="Aa"
                      placeholderTextColor={Colors.textMuted}
                      value={msgInput}
                      onChangeText={setMsgInput}
                      multiline
                      onSubmitEditing={sendMessage}
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
                <FontAwesome6 name="facebook-messenger" size={64} color={Colors.primary} />
                <Text style={s.noChatTitle}>Your Messages</Text>
                <Text style={s.noChatSub}>Select a contact to start chatting</Text>
              </View>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── CALL MODAL ──────────────────────────────────────────────────── */}
      <Modal visible={callVisible} animationType="slide" transparent>
        <View style={s.callBg}>
          <Image
            source={avatarUri(
              incomingCall ? 'Caller' : activeContact?.name,
              incomingCall ? null : activeContact?.photoURL
            )}
            style={s.callAvatar}
          />
          <Text style={s.callName}>{incomingCall ? 'Incoming call' : activeContact?.name}</Text>
          <Text style={s.callStatus}>{callStatus}</Text>

          <View style={s.callBtns}>
            {incomingCall && callStatus === 'Incoming call…' && (
              <TouchableOpacity style={[s.callBtn, { backgroundColor: '#4caf50' }]} onPress={answerCall}>
                <FontAwesome6 name={callType === 'video' ? 'video' : 'phone'} size={24} color="#fff" />
              </TouchableOpacity>
            )}
            {callStatus === 'Connected' && (
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
  // sidebar
  sidebar: { flex: 1, backgroundColor: '#fff', borderRightWidth: 1, borderColor: Colors.border },
  sideHeader: { padding: 16, borderBottomWidth: 1, borderColor: Colors.border },
  sideTitle: { fontSize: 20, fontWeight: '800', color: '#050505' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 10, backgroundColor: Colors.bgGray,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#050505' },
  emptyTxt: { textAlign: 'center', marginTop: 40, color: Colors.textMuted },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12,
    gap: 12, borderBottomWidth: 1, borderColor: Colors.border,
  },
  contactRowActive: { backgroundColor: '#e7f3ff' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarSm: { width: 36, height: 36, borderRadius: 18 },
  contactName: { fontSize: 15, fontWeight: '600', color: '#050505' },
  contactSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  // chat header
  chatHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderColor: Colors.border, backgroundColor: '#fff',
  },
  chatHeaderName: { fontSize: 15, fontWeight: '700', color: '#050505' },
  chatHeaderSub: { fontSize: 12, color: Colors.textMuted },

  // messages
  e2eNote: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  e2eTxt: { fontSize: 12, color: Colors.textMuted },
  bubble: {
    maxWidth: '78%', borderRadius: 18, padding: 10, marginBottom: 6,
  },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#f0f2f5', borderTopLeftRadius: 4 },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: Colors.primary, borderTopRightRadius: 4 },
  bubbleText: { fontSize: 15, color: '#050505' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, justifyContent: 'flex-end' },
  bubbleTime: { fontSize: 10, color: Colors.textMuted },

  // input
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

  // no chat
  noChat: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  noChatTitle: { fontSize: 22, fontWeight: '700', color: '#050505' },
  noChatSub: { fontSize: 15, color: Colors.textMuted },

  // call modal
  callBg: {
    flex: 1, backgroundColor: '#1c1e2f',
    justifyContent: 'center', alignItems: 'center',
  },
  callAvatar: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 4, borderColor: Colors.primary, marginBottom: 20,
  },
  callName: { fontSize: 28, fontWeight: '700', color: '#fff' },
  callStatus: { fontSize: 16, color: Colors.primary, marginTop: 8, marginBottom: 50 },
  callBtns: { flexDirection: 'row', gap: 24 },
  callBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
});
