// src/screens/HomeScreen.js — Facebook-style full-featured Home Feed
// Features: Stories, CreatePost, Friend Suggestions, Birthday Banner, Marketplace Preview,
// Watch Preview, Groups, Events, Sponsored Ads, Reactions (6), Share Modal, Save/Bookmark,
// Report/Hide/Unfollow Post Menu, Poll Widget, Comment Reactions, Follow/Unfollow,
// Memories Card, Trending Topics, Top Nav Tabs (Home/Friends/Watch/Marketplace/Menu),
// Friends Tab with requests & suggestions, Watch Tab, Marketplace Tab with categories,
// Menu Tab with grid, Messenger badge, Live badge, Shared post preview, Feeling/Activity,
// Dark mode ready theme vars, FlatList performance opts, Pull to refresh, Offline banner

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, FlatList, StyleSheet, RefreshControl, Text, ActivityIndicator,
  Image, TouchableOpacity, Platform, Animated, ScrollView, TextInput,
  Modal, Pressable, Alert, Dimensions, StatusBar,
} from 'react-native';
import {
  collection, query, orderBy, onSnapshot, limit, doc, updateDoc,
  deleteDoc, addDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { setCache, getCache, CACHE_KEYS } from '../utils/cache';
import { Colors, getAvatar, getDisplayName, timeAgo } from '../utils/theme';
import StoriesBar from '../components/StoriesBar';
import CreatePost from '../components/CreatePost';
import OfflineBanner from '../components/OfflineBanner';
import { FontAwesome6 } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS & MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const REACTIONS = [
  { key: 'like',  emoji: '👍', label: 'Like',  color: '#1877F2' },
  { key: 'love',  emoji: '❤️', label: 'Love',  color: '#F33E58' },
  { key: 'haha',  emoji: '😆', label: 'Haha',  color: '#F7B125' },
  { key: 'wow',   emoji: '😮', label: 'Wow',   color: '#F7B125' },
  { key: 'sad',   emoji: '😢', label: 'Sad',   color: '#F7B125' },
  { key: 'angry', emoji: '😠', label: 'Angry', color: '#E9710F' },
];

const MOCK_BIRTHDAYS = [
  { name: 'Rahim Vai',   avatar: 'https://ui-avatars.com/api/?name=Rahim&background=1877F2&color=fff' },
  { name: 'Sumaiya Apa', avatar: 'https://ui-avatars.com/api/?name=Sumaiya&background=E91E8C&color=fff' },
];

const MOCK_FRIEND_SUGGESTIONS = [
  { uid: 'fs1', displayName: 'Arif Hossain',  mutuals: 12, avatar: 'https://ui-avatars.com/api/?name=Arif&background=42b72a&color=fff' },
  { uid: 'fs2', displayName: 'Nadia Begum',   mutuals: 5,  avatar: 'https://ui-avatars.com/api/?name=Nadia&background=FF5722&color=fff' },
  { uid: 'fs3', displayName: 'Tanvir Ahmed',  mutuals: 8,  avatar: 'https://ui-avatars.com/api/?name=Tanvir&background=9C27B0&color=fff' },
  { uid: 'fs4', displayName: 'Sadia Islam',   mutuals: 3,  avatar: 'https://ui-avatars.com/api/?name=Sadia&background=FF9800&color=fff' },
  { uid: 'fs5', displayName: 'Karim Uddin',   mutuals: 15, avatar: 'https://ui-avatars.com/api/?name=Karim&background=2196F3&color=fff' },
];

const MOCK_MARKETPLACE = [
  { id: 'm1', title: 'iPhone 14 Pro',  price: '৳ 85,000', image: 'https://picsum.photos/seed/phone1/200/200',  location: 'Dhaka' },
  { id: 'm2', title: 'Gaming Chair',   price: '৳ 12,500', image: 'https://picsum.photos/seed/chair1/200/200', location: 'Gazipur' },
  { id: 'm3', title: 'Study Table',    price: '৳ 4,800',  image: 'https://picsum.photos/seed/table1/200/200', location: 'Mirpur' },
  { id: 'm4', title: 'Bicycle',        price: '৳ 7,200',  image: 'https://picsum.photos/seed/bike1/200/200',  location: 'Uttara' },
];

const MOCK_WATCH_VIDEOS = [
  { id: 'w1', title: 'Best Goals 2025', thumb: 'https://picsum.photos/seed/vid1/300/180', views: '1.2M views', duration: '8:24' },
  { id: 'w2', title: 'Cooking Tips',    thumb: 'https://picsum.photos/seed/vid2/300/180', views: '456K views', duration: '5:10' },
  { id: 'w3', title: 'Travel Vlog BD',  thumb: 'https://picsum.photos/seed/vid3/300/180', views: '890K views', duration: '12:33' },
];

const MOCK_GROUPS = [
  { id: 'g1', name: 'Bangladesh Developers', members: '45K members', activity: '120 posts today', image: 'https://ui-avatars.com/api/?name=BD+Dev&background=1877F2&color=fff' },
  { id: 'g2', name: 'Dhaka Foodies',         members: '89K members', activity: '340 posts today', image: 'https://ui-avatars.com/api/?name=DF&background=F44336&color=fff' },
  { id: 'g3', name: 'Study Together BD',     members: '22K members', activity: '67 posts today',  image: 'https://ui-avatars.com/api/?name=ST&background=4CAF50&color=fff' },
];

const MOCK_EVENTS = [
  { id: 'e1', name: 'Eid Reunion 2025',      date: 'Jun 15 · 7:00 PM', location: 'Bashundhara City', image: 'https://picsum.photos/seed/event1/300/150', going: 234 },
  { id: 'e2', name: 'Tech Conference Dhaka', date: 'Jul 2 · 10:00 AM', location: 'BICC, Dhaka',      image: 'https://picsum.photos/seed/event2/300/150', going: 1203 },
];

const MOCK_MEMORIES = [
  { year: 2023, image: 'https://picsum.photos/seed/mem1/300/200', caption: '3 years ago today' },
];

const SPONSORED_ADS = [
  {
    id: 'ad1', brand: 'RasBook Ads',
    brandAvatar: 'https://ui-avatars.com/api/?name=RB&background=1877F2&color=fff',
    text: 'Grow your business with RasBook Ads! Reach millions in Bangladesh.',
    image: 'https://picsum.photos/seed/ad101/600/300', cta: 'Learn More', tag: 'Sponsored',
  },
  {
    id: 'ad2', brand: 'BanglaShop',
    brandAvatar: 'https://ui-avatars.com/api/?name=BS&background=FF5722&color=fff',
    text: '🛍️ Flash Sale! Up to 70% off on electronics. Limited stock!',
    image: 'https://picsum.photos/seed/ad102/600/300', cta: 'Shop Now', tag: 'Sponsored',
  },
];

const TRENDING_TOPICS = [
  { id: 't1', topic: '#EidMubarak',         posts: '234K posts' },
  { id: 't2', topic: '#BangladeshCricket',  posts: '89K posts'  },
  { id: 't3', topic: '#DhakaDevs',          posts: '12K posts'  },
  { id: 't4', topic: '#RamajanKareem',      posts: '567K posts' },
  { id: 't5', topic: '#DhakaTraffic',       posts: '45K posts'  },
];

const NAV_TABS = [
  { key: 'home',        icon: 'house',      label: 'Home' },
  { key: 'friends',     icon: 'user-group', label: 'Friends' },
  { key: 'watch',       icon: 'play',       label: 'Watch' },
  { key: 'marketplace', icon: 'store',      label: 'Market' },
  { key: 'menu',        icon: 'bars',       label: 'Menu' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HOME HEADER
// ─────────────────────────────────────────────────────────────────────────────

function HomeHeader({ user, unreadCount, onSearchPress, onMessengerPress, onNotifPress }) {
  return (
    <View style={hh.header}>
      <Text style={hh.logo}>
        <Text style={{ color: Colors.primary }}>Ras</Text>
        <Text style={{ color: Colors.green }}>Book</Text>
      </Text>
      <View style={hh.icons}>
        <TouchableOpacity style={hh.iconBtn} onPress={onSearchPress}>
          <FontAwesome6 name="magnifying-glass" size={18} color="#050505" />
        </TouchableOpacity>
        <TouchableOpacity style={hh.iconBtn} onPress={onMessengerPress}>
          <FontAwesome6 name="facebook-messenger" size={18} color="#050505" />
          {unreadCount > 0 && (
            <View style={hh.badge}>
              <Text style={hh.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={hh.iconBtn} onPress={onNotifPress}>
          <FontAwesome6 name="bell" size={18} color="#050505" />
        </TouchableOpacity>
        <Image source={{ uri: getAvatar(user) }} style={hh.avatar} />
      </View>
    </View>
  );
}

const hh = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 3,
  },
  logo: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: Colors.danger, borderRadius: 8, minWidth: 16,
    height: 16, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  avatar: { width: 34, height: 34, borderRadius: 17, marginLeft: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// TOP NAV TABS
// ─────────────────────────────────────────────────────────────────────────────

function TopNavTabs({ activeTab, onTabChange }) {
  return (
    <View style={nt.container}>
      {NAV_TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={nt.tab}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name={tab.icon}
              size={22}
              color={active ? Colors.primary : Colors.textMuted}
              solid={active}
            />
            {active && <View style={nt.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const nt = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, position: 'relative',
  },
  indicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: Colors.primary, borderRadius: 2,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// BIRTHDAY BANNER
// ─────────────────────────────────────────────────────────────────────────────

function BirthdayBanner({ birthdays }) {
  if (!birthdays || birthdays.length === 0) return null;
  return (
    <View style={bb.container}>
      <View style={bb.left}>
        <Text style={bb.icon}>🎂</Text>
        <View style={{ flex: 1 }}>
          <Text style={bb.title}>
            <Text style={{ fontWeight: 'bold' }}>{birthdays[0].name}</Text>
            {birthdays.length > 1 ? ` and ${birthdays.length - 1} other${birthdays.length > 2 ? 's' : ''}` : ''}
          </Text>
          <Text style={bb.sub}>{birthdays.length === 1 ? 'has a birthday today' : 'have birthdays today'}</Text>
        </View>
      </View>
      <TouchableOpacity style={bb.btn}>
        <Text style={bb.btnText}>Say 🎉</Text>
      </TouchableOpacity>
    </View>
  );
}

const bb = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  icon: { fontSize: 34 },
  title: { fontSize: 14, color: Colors.black },
  sub: { fontSize: 12, color: Colors.textMuted },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MEMORIES CARD
// ─────────────────────────────────────────────────────────────────────────────

function MemoriesCard({ memory }) {
  if (!memory) return null;
  return (
    <View style={mc.container}>
      <View style={mc.header}>
        <FontAwesome6 name="clock-rotate-left" size={18} color={Colors.primary} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={mc.title}>Memory</Text>
          <Text style={mc.sub}>{memory.caption}</Text>
        </View>
        <TouchableOpacity><FontAwesome6 name="xmark" size={18} color={Colors.textMuted} /></TouchableOpacity>
      </View>
      <Image source={{ uri: memory.image }} style={mc.image} resizeMode="cover" />
      <View style={mc.footer}>
        <TouchableOpacity style={mc.shareBtn}>
          <FontAwesome6 name="share" size={14} color={Colors.primary} />
          <Text style={mc.shareTxt}>Share Memory</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const mc = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  title: { fontWeight: '700', fontSize: 15, color: Colors.black },
  sub: { fontSize: 12, color: Colors.textMuted },
  image: { width: '100%', height: 220 },
  footer: { padding: 12, alignItems: 'flex-end' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.bgGray, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  shareTxt: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
});

// ─────────────────────────────────────────────────────────────────────────────
// FRIEND SUGGESTIONS WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function FriendSuggestions({ suggestions }) {
  const [added, setAdded] = useState({});
  const [removed, setRemoved] = useState({});

  const handleAdd = (uid) => setAdded((p) => ({ ...p, [uid]: true }));
  const handleRemove = (uid) => setRemoved((p) => ({ ...p, [uid]: true }));
  const visible = suggestions.filter((s) => !removed[s.uid]);
  if (visible.length === 0) return null;

  return (
    <View style={fsg.container}>
      <View style={fsg.header}>
        <Text style={fsg.title}>People You May Know</Text>
        <TouchableOpacity><Text style={fsg.seeAll}>See All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fsg.scroll}>
        {visible.map((person) => (
          <View key={person.uid} style={fsg.card}>
            <TouchableOpacity onPress={() => handleRemove(person.uid)} style={fsg.closeBtn}>
              <FontAwesome6 name="xmark" size={12} color={Colors.textMuted} />
            </TouchableOpacity>
            <Image source={{ uri: person.avatar }} style={fsg.avatar} />
            <Text style={fsg.name} numberOfLines={1}>{person.displayName}</Text>
            <Text style={fsg.mutuals}>{person.mutuals} mutual friends</Text>
            {added[person.uid] ? (
              <View style={fsg.addedBtn}><Text style={fsg.addedText}>✓ Added</Text></View>
            ) : (
              <TouchableOpacity style={fsg.addBtn} onPress={() => handleAdd(person.uid)}>
                <FontAwesome6 name="user-plus" size={12} color="#fff" />
                <Text style={fsg.addText}>Add Friend</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const fsg = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.black },
  seeAll: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  scroll: { paddingHorizontal: 12, gap: 10 },
  card: { width: 160, backgroundColor: Colors.bgGray, borderRadius: 12, overflow: 'hidden', position: 'relative', paddingBottom: 12, borderWidth: 1, borderColor: Colors.border },
  closeBtn: { position: 'absolute', top: 8, right: 8, zIndex: 5, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: '100%', height: 130, resizeMode: 'cover' },
  name: { fontWeight: '700', fontSize: 14, color: Colors.black, marginHorizontal: 10, marginTop: 8 },
  mutuals: { fontSize: 11, color: Colors.textMuted, marginHorizontal: 10, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, marginHorizontal: 10, marginTop: 8, borderRadius: 6, paddingVertical: 8 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addedBtn: { backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border, marginHorizontal: 10, marginTop: 8, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  addedText: { color: Colors.textMuted, fontWeight: '600', fontSize: 13 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

function MarketplacePreview({ items }) {
  return (
    <View style={mpv.container}>
      <View style={mpv.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FontAwesome6 name="store" size={18} color={Colors.primary} />
          <Text style={mpv.title}>Marketplace</Text>
        </View>
        <TouchableOpacity><Text style={mpv.seeAll}>See More</Text></TouchableOpacity>
      </View>
      <View style={mpv.grid}>
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={mpv.item} activeOpacity={0.8}>
            <Image source={{ uri: item.image }} style={mpv.itemImg} />
            <Text style={mpv.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={mpv.itemPrice}>{item.price}</Text>
            <Text style={mpv.itemLoc}>{item.location}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const mpv = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.black },
  seeAll: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, gap: 8 },
  item: { width: (SCREEN_W - 32) / 2, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border },
  itemImg: { width: '100%', height: 130, resizeMode: 'cover' },
  itemTitle: { fontWeight: '700', fontSize: 13, color: Colors.black, margin: 8, marginBottom: 2 },
  itemPrice: { color: Colors.black, fontWeight: '800', fontSize: 14, marginHorizontal: 8 },
  itemLoc: { color: Colors.textMuted, fontSize: 11, marginHorizontal: 8, marginBottom: 8 },
});

// ─────────────────────────────────────────────────────────────────────────────
// WATCH PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

function WatchPreview({ videos }) {
  return (
    <View style={wpr.container}>
      <View style={wpr.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FontAwesome6 name="play-circle" size={18} color={Colors.primary} />
          <Text style={wpr.title}>Watch</Text>
        </View>
        <TouchableOpacity><Text style={wpr.seeAll}>See More</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={wpr.scroll}>
        {videos.map((v) => (
          <TouchableOpacity key={v.id} style={wpr.card} activeOpacity={0.8}>
            <View style={wpr.thumbWrap}>
              <Image source={{ uri: v.thumb }} style={wpr.thumb} />
              <View style={wpr.playOverlay}>
                <FontAwesome6 name="play" size={20} color="#fff" solid />
              </View>
              <View style={wpr.durationBadge}>
                <Text style={wpr.durationText}>{v.duration}</Text>
              </View>
            </View>
            <Text style={wpr.videoTitle} numberOfLines={2}>{v.title}</Text>
            <Text style={wpr.views}>{v.views}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const wpr = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.black },
  seeAll: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  scroll: { paddingHorizontal: 12, gap: 10 },
  card: { width: 200, marginRight: 4 },
  thumbWrap: { borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb: { width: 200, height: 120, resizeMode: 'cover' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  videoTitle: { fontWeight: '600', fontSize: 13, color: Colors.black, marginTop: 6 },
  views: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// GROUPS WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function GroupsWidget({ groups }) {
  return (
    <View style={grp.container}>
      <View style={grp.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FontAwesome6 name="people-group" size={18} color={Colors.primary} />
          <Text style={grp.title}>Groups</Text>
        </View>
        <TouchableOpacity><Text style={grp.seeAll}>Discover</Text></TouchableOpacity>
      </View>
      {groups.map((g) => (
        <TouchableOpacity key={g.id} style={grp.row} activeOpacity={0.8}>
          <Image source={{ uri: g.image }} style={grp.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={grp.name}>{g.name}</Text>
            <Text style={grp.meta}>{g.members} · {g.activity}</Text>
          </View>
          <TouchableOpacity style={grp.joinBtn}><Text style={grp.joinText}>Join</Text></TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const grp = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.black },
  seeAll: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 10 },
  name: { fontWeight: '700', fontSize: 14, color: Colors.black },
  meta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  joinBtn: { backgroundColor: Colors.bgGray, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  joinText: { fontWeight: '700', fontSize: 13, color: Colors.black },
});

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function EventsWidget({ events }) {
  const [going, setGoing] = useState({});

  return (
    <View style={evw.container}>
      <View style={evw.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <FontAwesome6 name="calendar-days" size={18} color={Colors.primary} />
          <Text style={evw.title}>Upcoming Events</Text>
        </View>
        <TouchableOpacity><Text style={evw.seeAll}>See All</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={evw.scroll}>
        {events.map((ev) => (
          <View key={ev.id} style={evw.card}>
            <Image source={{ uri: ev.image }} style={evw.image} />
            <View style={evw.info}>
              <Text style={evw.evName} numberOfLines={1}>{ev.name}</Text>
              <Text style={evw.evDate}>{ev.date}</Text>
              <Text style={evw.evLoc}>{ev.location}</Text>
              <Text style={evw.evGoing}>{ev.going + (going[ev.id] ? 1 : 0)} going</Text>
              <View style={evw.btnRow}>
                <TouchableOpacity
                  style={[evw.goingBtn, going[ev.id] && evw.goingActive]}
                  onPress={() => setGoing((p) => ({ ...p, [ev.id]: !p[ev.id] }))}
                >
                  <Text style={[evw.goingText, going[ev.id] && { color: '#fff' }]}>
                    {going[ev.id] ? '✓ Going' : 'Going'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={evw.interestedBtn}>
                  <Text style={evw.interestedText}>Interested</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const evw = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.black },
  seeAll: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  scroll: { paddingHorizontal: 12, gap: 10 },
  card: { width: 240, borderRadius: 12, overflow: 'hidden', backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border },
  image: { width: '100%', height: 120, resizeMode: 'cover' },
  info: { padding: 10 },
  evName: { fontWeight: '700', fontSize: 14, color: Colors.black },
  evDate: { color: Colors.primary, fontWeight: '600', fontSize: 12, marginTop: 2 },
  evLoc: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  evGoing: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  goingBtn: { flex: 1, borderRadius: 6, paddingVertical: 7, alignItems: 'center', backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border },
  goingActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  goingText: { fontWeight: '700', fontSize: 12, color: Colors.black },
  interestedBtn: { flex: 1, borderRadius: 6, paddingVertical: 7, alignItems: 'center', backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border },
  interestedText: { fontWeight: '700', fontSize: 12, color: Colors.black },
});

// ─────────────────────────────────────────────────────────────────────────────
// TRENDING TOPICS
// ─────────────────────────────────────────────────────────────────────────────

function TrendingTopics({ topics }) {
  return (
    <View style={trnd.container}>
      <View style={trnd.header}>
        <FontAwesome6 name="fire" size={16} color="#FF5722" />
        <Text style={trnd.title}>Trending Topics</Text>
      </View>
      {topics.map((t, i) => (
        <TouchableOpacity key={t.id} style={trnd.row} activeOpacity={0.7}>
          <Text style={trnd.rank}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={trnd.topic}>{t.topic}</Text>
            <Text style={trnd.posts}>{t.posts}</Text>
          </View>
          <FontAwesome6 name="chevron-right" size={12} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const trnd = StyleSheet.create({
  container: { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '800', color: Colors.black },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  rank: { width: 24, fontSize: 14, fontWeight: '800', color: Colors.textMuted, textAlign: 'center' },
  topic: { fontWeight: '700', fontSize: 14, color: Colors.primary },
  posts: { color: Colors.textMuted, fontSize: 12, marginTop: 1 },
});

// ─────────────────────────────────────────────────────────────────────────────
// SPONSORED AD CARD
// ─────────────────────────────────────────────────────────────────────────────

function SponsoredAdCard({ ad }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <View style={sac.card}>
      <View style={sac.header}>
        <Image source={{ uri: ad.brandAvatar }} style={sac.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={sac.brand}>{ad.brand}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={sac.sponsored}>{ad.tag}</Text>
            <FontAwesome6 name="earth-americas" size={10} color={Colors.textMuted} />
          </View>
        </View>
        <TouchableOpacity onPress={() => setHidden(true)}>
          <FontAwesome6 name="ellipsis" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>
      <Text style={sac.text}>{ad.text}</Text>
      <Image source={{ uri: ad.image }} style={sac.image} resizeMode="cover" />
      <View style={sac.footer}>
        <Text style={sac.adUrl}>rasbook.com</Text>
        <TouchableOpacity style={sac.ctaBtn}>
          <Text style={sac.ctaText}>{ad.cta}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sac = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  brand: { fontWeight: '700', fontSize: 14, color: Colors.black },
  sponsored: { fontSize: 11, color: Colors.textMuted },
  text: { paddingHorizontal: 14, paddingBottom: 10, fontSize: 14, color: Colors.black },
  image: { width: '100%', height: 220 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  adUrl: { color: Colors.textMuted, fontSize: 12 },
  ctaBtn: { backgroundColor: Colors.bgGray, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  ctaText: { fontWeight: '700', fontSize: 13, color: Colors.black },
});

// ─────────────────────────────────────────────────────────────────────────────
// REACTIONS POPUP
// ─────────────────────────────────────────────────────────────────────────────

function ReactionsPopup({ visible, onSelect, onClose, anchor }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 7 }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={rxp.overlay} onPress={onClose}>
        <Animated.View style={[rxp.popup, { transform: [{ scale: scaleAnim }] }]}>
          {REACTIONS.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={rxp.reactionBtn}
              onPress={() => { onSelect(r); onClose(); }}
            >
              <Text style={rxp.emoji}>{r.emoji}</Text>
              <Text style={rxp.label}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const rxp = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', paddingBottom: 120 },
  popup: {
    alignSelf: 'flex-start', marginLeft: 16,
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 30, padding: 8, gap: 4,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
  },
  reactionBtn: { alignItems: 'center', padding: 4 },
  emoji: { fontSize: 28 },
  label: { fontSize: 9, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// POST MENU MODAL
// ─────────────────────────────────────────────────────────────────────────────

function PostMenuModal({ visible, isOwner, onClose, onEdit, onDelete, onSave, onReport, onHide, onUnfollow, isSaved }) {
  const ownerActions = [
    { icon: 'pen-to-square', label: 'Edit Post',   action: onEdit,   color: Colors.black },
    { icon: 'trash',         label: 'Delete Post', action: onDelete, color: Colors.danger },
    { icon: 'bookmark',      label: isSaved ? 'Unsave' : 'Save Post', action: onSave, color: Colors.black },
  ];
  const guestActions = [
    { icon: 'bookmark',   label: isSaved ? 'Unsave Post' : 'Save Post', action: onSave,    color: Colors.black },
    { icon: 'eye-slash',  label: 'Hide Post',    action: onHide,     color: Colors.black },
    { icon: 'user-xmark', label: 'Unfollow',     action: onUnfollow, color: Colors.black },
    { icon: 'flag',       label: 'Report Post',  action: onReport,   color: Colors.danger },
  ];
  const actions = isOwner ? ownerActions : guestActions;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pmm.overlay} onPress={onClose}>
        <View style={pmm.sheet}>
          <View style={pmm.handle} />
          {actions.map((a) => (
            <TouchableOpacity key={a.label} style={pmm.row} onPress={() => { a.action && a.action(); onClose(); }}>
              <View style={pmm.iconWrap}>
                <FontAwesome6 name={a.icon} size={18} color={a.color} />
              </View>
              <Text style={[pmm.label, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[pmm.row, { borderBottomWidth: 0, justifyContent: 'center' }]} onPress={onClose}>
            <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const pmm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30, paddingTop: 8 },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, gap: 16, borderBottomWidth: 1, borderColor: Colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARE MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ShareModal({ visible, post, currentUser, onClose }) {
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!post) return;
    setSharing(true);
    try {
      await addDoc(collection(db, 'posts'), {
        userId: currentUser.uid,
        userName: getDisplayName(currentUser),
        userAvatar: getAvatar(currentUser),
        text: caption.trim(),
        sharedPostId: post.id,
        sharedPostData: {
          userName: post.userName, text: post.text,
          mediaUrl: post.mediaUrl, mediaType: post.mediaType,
          userAvatar: post.userAvatar,
        },
        likes: [], comments: [],
        createdAt: serverTimestamp(),
      });
      Alert.alert('✅ Shared!', 'Post shared to your timeline.');
    } catch {
      Alert.alert('Error', 'Could not share. Try again.');
    } finally {
      setSharing(false);
      onClose();
      setCaption('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={shrm.overlay} onPress={onClose}>
        <Pressable style={shrm.sheet} onPress={() => {}}>
          <View style={shrm.headerRow}>
            <Text style={shrm.title}>Share Post</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome6 name="xmark" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={shrm.authorRow}>
            <Image source={{ uri: getAvatar(currentUser) }} style={shrm.avatar} />
            <View>
              <Text style={shrm.authorName}>{getDisplayName(currentUser)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <FontAwesome6 name="earth-americas" size={11} color={Colors.textMuted} />
                <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '600' }}>Public</Text>
              </View>
            </View>
          </View>
          <TextInput
            style={shrm.input}
            placeholder="Say something about this..."
            placeholderTextColor="#aaa"
            value={caption}
            onChangeText={setCaption}
            multiline
          />
          {post && (
            <View style={shrm.preview}>
              <Text style={shrm.previewAuthor}>{post.userName}</Text>
              <Text style={shrm.previewText} numberOfLines={2}>{post.text}</Text>
            </View>
          )}
          <TouchableOpacity style={shrm.shareBtn} onPress={handleShare} disabled={sharing}>
            {sharing ? <ActivityIndicator color="#fff" /> : <Text style={shrm.shareText}>Share Now</Text>}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const shrm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.black },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  authorName: { fontWeight: '700', fontSize: 14, color: Colors.black },
  input: { fontSize: 15, color: '#000', minHeight: 60, marginBottom: 12 },
  preview: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, marginBottom: 16, backgroundColor: Colors.bgGray },
  previewAuthor: { fontWeight: '700', fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  previewText: { fontSize: 14, color: Colors.black },
  shareBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  shareText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

// ─────────────────────────────────────────────────────────────────────────────
// POLL WIDGET
// ─────────────────────────────────────────────────────────────────────────────

function PollWidget({ poll, postId }) {
  const [voted, setVoted] = useState(null);
  const [votes, setVotes] = useState(poll.votes || {});
  const total = Object.values(votes).reduce((a, b) => a + b, 0);

  const handleVote = (option) => {
    if (voted) return;
    setVoted(option);
    const newVotes = { ...votes, [option]: (votes[option] || 0) + 1 };
    setVotes(newVotes);
    updateDoc(doc(db, 'posts', postId), { [`poll.votes.${option}`]: (votes[option] || 0) + 1 }).catch(() => {});
  };

  return (
    <View style={plw.container}>
      <Text style={plw.question}>{poll.question}</Text>
      {(poll.options || []).map((opt) => {
        const count = votes[opt] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isVoted = voted === opt;
        return (
          <TouchableOpacity key={opt} style={[plw.option, isVoted && plw.optionVoted]} onPress={() => handleVote(opt)} disabled={!!voted}>
            {voted && <View style={[plw.bar, { width: `${pct}%` }]} />}
            <Text style={[plw.optText, isVoted && { color: Colors.primary, fontWeight: '700' }]}>{opt}</Text>
            {voted && <Text style={plw.pct}>{pct}%</Text>}
          </TouchableOpacity>
        );
      })}
      <Text style={plw.totalVotes}>{total} votes · {poll.duration || '6 days left'}</Text>
    </View>
  );
}

const plw = StyleSheet.create({
  container: { marginHorizontal: 14, marginBottom: 10 },
  question: { fontWeight: '700', fontSize: 15, color: Colors.black, marginBottom: 10 },
  option: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, overflow: 'hidden', position: 'relative' },
  optionVoted: { borderColor: Colors.primary },
  bar: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#e7f3ff', borderRadius: 8 },
  optText: { fontSize: 14, color: Colors.black, zIndex: 1 },
  pct: { position: 'absolute', right: 14, top: 0, bottom: 0, textAlignVertical: 'center', fontSize: 13, fontWeight: '700', color: Colors.textMuted },
  totalVotes: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT INLINE REACTIONS
// ─────────────────────────────────────────────────────────────────────────────

function CommentReactions({ commentId }) {
  const [reacted, setReacted] = useState(null);
  const quickReactions = ['👍', '❤️', '😆'];
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginLeft: 42, marginBottom: 4 }}>
      {quickReactions.map((emoji) => (
        <TouchableOpacity
          key={emoji}
          onPress={() => setReacted(reacted === emoji ? null : emoji)}
          style={{ backgroundColor: reacted === emoji ? '#e7f0fd' : 'transparent', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 }}
        >
          <Text style={{ fontSize: 14 }}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST CARD — Full Facebook-style
// ─────────────────────────────────────────────────────────────────────────────

function PostCard({ post, currentUser, savedPosts, onToggleSave }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [showReactions, setShowReactions] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [expandText, setExpandText] = useState(false);
  const likeTimerRef = useRef(null);

  const postRef = doc(db, 'posts', post.id);
  const isSaved = savedPosts?.includes(post.id);
  const isOwner = post.userId === currentUser?.uid;
  const isLiked = (post.likes || []).includes(currentUser?.uid) || !!userReaction;
  const likeLabel = userReaction ? userReaction.label : 'Like';
  const likeColor = userReaction ? userReaction.color : Colors.textMuted;
  const likeEmoji = userReaction ? userReaction.emoji : '👍';
  const totalLikes = (post.likes || []).length;
  const totalComments = (post.comments || []).length;

  const sendNotif = async (type) => {
    if (!post.userId || post.userId === currentUser?.uid) return;
    await addDoc(collection(db, 'notifications'), {
      toUserId: post.userId,
      fromUserName: getDisplayName(currentUser),
      fromUserAvatar: getAvatar(currentUser),
      type, postId: post.id,
      createdAt: serverTimestamp(), isRead: false,
    }).catch(() => {});
  };

  const handleLikePress = () => {
    if (likeTimerRef.current) {
      clearTimeout(likeTimerRef.current);
      likeTimerRef.current = null;
      setShowReactions(true);
      return;
    }
    likeTimerRef.current = setTimeout(() => {
      likeTimerRef.current = null;
      const alreadyLiked = (post.likes || []).includes(currentUser?.uid);
      if (alreadyLiked) {
        updateDoc(postRef, { likes: arrayRemove(currentUser.uid) }).catch(() => {});
        setUserReaction(null);
      } else {
        updateDoc(postRef, { likes: arrayUnion(currentUser.uid) }).catch(() => {});
        sendNotif('like');
        setUserReaction(REACTIONS[0]);
      }
    }, 220);
  };

  const handleReactionSelect = async (reaction) => {
    setUserReaction(reaction);
    await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) }).catch(() => {});
    sendNotif('like');
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
    }).catch(() => {});
    setCommentText('');
    sendNotif('comment');
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert('Delete', 'Delete this comment?', [
      { text: 'Cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const snap = await getDoc(postRef).catch(() => null);
          if (snap?.exists()) {
            await updateDoc(postRef, {
              comments: snap.data().comments.filter((c) => c.commentId !== commentId),
            }).catch(() => {});
          }
        },
      },
    ]);
  };

  const handleDelete = () =>
    Alert.alert('Delete Post', 'This cannot be undone.', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDoc(postRef).catch(() => {}) },
    ]);

  const handleEdit = () => { setEditText(post.text || ''); setEditModal(true); };
  const saveEdit = async () => {
    if (editText.trim()) await updateDoc(postRef, { text: editText.trim() }).catch(() => {});
    setEditModal(false);
  };

  if (hidden) return null;

  return (
    <View style={pcd.card}>
      {/* Edit Modal */}
      <Modal visible={editModal} transparent animationType="fade">
        <Pressable style={pcd.mOverlay} onPress={() => setEditModal(false)}>
          <Pressable style={pcd.mBox} onPress={() => {}}>
            <Text style={pcd.mTitle}>Edit Post</Text>
            <TextInput style={pcd.mInput} value={editText} onChangeText={setEditText} multiline autoFocus placeholder="Edit your post..." placeholderTextColor="#999" />
            <View style={pcd.mActions}>
              <TouchableOpacity onPress={() => setEditModal(false)} style={{ padding: 10 }}><Text style={{ color: Colors.textMuted }}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={pcd.mSave}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text></TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Post Menu */}
      <PostMenuModal
        visible={showMenu}
        isOwner={isOwner}
        onClose={() => setShowMenu(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={() => onToggleSave && onToggleSave(post.id)}
        onReport={() => Alert.alert('Report', 'Thank you! We will review this post.')}
        onHide={() => setHidden(true)}
        onUnfollow={() => { setIsFollowing(false); Alert.alert('Unfollowed', `You unfollowed ${post.userName}`); }}
        isSaved={isSaved}
      />

      {/* Share Modal */}
      <ShareModal visible={showShareModal} post={post} currentUser={currentUser} onClose={() => setShowShareModal(false)} />

      {/* Reactions */}
      <ReactionsPopup visible={showReactions} onSelect={handleReactionSelect} onClose={() => setShowReactions(false)} />

      {/* Header */}
      <View style={pcd.header}>
        <Image source={{ uri: post.userAvatar || getAvatar({ displayName: post.userName }) }} style={pcd.avatar} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={pcd.author}>{post.userName}</Text>
            {post.isLive && (
              <View style={pcd.liveBadge}><Text style={pcd.liveText}>● LIVE</Text></View>
            )}
            {post.isVerified && (
              <FontAwesome6 name="circle-check" size={14} color={Colors.primary} solid />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={pcd.time}>{timeAgo(post.createdAt)}</Text>
            <Text style={{ color: Colors.textMuted }}>·</Text>
            <FontAwesome6 name="earth-americas" size={10} color={Colors.textMuted} />
            {post.feeling && <Text style={pcd.feeling}> — {post.feeling}</Text>}
          </View>
        </View>
        {!isOwner && (
          <TouchableOpacity
            style={[pcd.followBtn, isFollowing && pcd.followingBtn]}
            onPress={() => setIsFollowing((f) => !f)}
          >
            <Text style={[pcd.followText, isFollowing && { color: Colors.textMuted }]}>
              {isFollowing ? 'Following' : '+ Follow'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setShowMenu(true)} style={{ padding: 6 }}>
          <FontAwesome6 name="ellipsis" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Text content */}
      {!!post.text && (
        <View style={{ paddingHorizontal: 15, paddingBottom: 10 }}>
          <Text
            style={pcd.postText}
            numberOfLines={expandText ? undefined : 4}
          >
            {post.text}
          </Text>
          {post.text.length > 200 && !expandText && (
            <TouchableOpacity onPress={() => setExpandText(true)}>
              <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14, marginTop: 2 }}>See more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Shared post preview */}
      {post.sharedPostData && (
        <View style={pcd.sharedCard}>
          <Text style={pcd.sharedAuthor}>{post.sharedPostData.userName}</Text>
          {!!post.sharedPostData.text && <Text style={pcd.sharedText} numberOfLines={3}>{post.sharedPostData.text}</Text>}
          {post.sharedPostData.mediaUrl && post.sharedPostData.mediaType === 'image' && (
            <Image source={{ uri: post.sharedPostData.mediaUrl }} style={pcd.sharedMedia} resizeMode="cover" />
          )}
        </View>
      )}

      {/* Poll */}
      {post.poll && <PollWidget poll={post.poll} postId={post.id} />}

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && !post.sharedPostData && (
        <Image source={{ uri: post.mediaUrl }} style={pcd.media} resizeMode="cover" />
      )}
      {post.mediaUrl && post.mediaType === 'video' && !post.sharedPostData && (
        <View style={pcd.videoWrap}>
          <TouchableOpacity style={pcd.videoPlayBtn} activeOpacity={0.8}>
            <FontAwesome6 name="play-circle" size={52} color="rgba(255,255,255,0.9)" solid />
          </TouchableOpacity>
        </View>
      )}

      {/* Stats row */}
      {(totalLikes > 0 || totalComments > 0 || (post.shareCount || 0) > 0) && (
        <View style={pcd.stats}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {totalLikes > 0 && <Text style={pcd.reactEmoji}>👍{userReaction && userReaction.key !== 'like' ? userReaction.emoji : ''}</Text>}
            {totalLikes > 0 && <Text style={pcd.statText}>{totalLikes}</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {totalComments > 0 && <Text style={pcd.statText}>{totalComments} Comments</Text>}
            {(post.shareCount || 0) > 0 && <Text style={pcd.statText}>{post.shareCount} Shares</Text>}
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={pcd.footer}>
        <TouchableOpacity
          style={pcd.actionBtn}
          onPress={handleLikePress}
          onLongPress={() => setShowReactions(true)}
          delayLongPress={400}
        >
          <Text style={[{ fontSize: 16 }, { color: likeColor }]}>{likeEmoji}</Text>
          <Text style={[pcd.actionText, { color: likeColor }]}>{likeLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={pcd.actionBtn} onPress={() => setShowComments((v) => !v)}>
          <FontAwesome6 name="comment" size={16} color={Colors.textMuted} />
          <Text style={pcd.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={pcd.actionBtn} onPress={() => setShowShareModal(true)}>
          <FontAwesome6 name="share" size={16} color={Colors.textMuted} />
          <Text style={pcd.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={pcd.actionBtn} onPress={() => onToggleSave && onToggleSave(post.id)}>
          <FontAwesome6 name="bookmark" size={16} color={isSaved ? Colors.primary : Colors.textMuted} solid={isSaved} />
        </TouchableOpacity>
      </View>

      {/* Comments */}
      {showComments && (
        <View style={pcd.commentsSection}>
          {(post.comments || []).map((c) => {
            const canDel = c.userId === currentUser?.uid || post.userId === currentUser?.uid;
            return (
              <View key={c.commentId}>
                <View style={pcd.commentItem}>
                  <Image source={{ uri: c.userAvatar }} style={pcd.commentAvatar} />
                  <View style={pcd.bubble}>
                    <Text style={pcd.commentAuthor}>{c.userName}</Text>
                    <Text style={pcd.commentText}>{c.text}</Text>
                  </View>
                  {canDel && (
                    <TouchableOpacity onPress={() => handleDeleteComment(c.commentId)}>
                      <FontAwesome6 name="trash" size={12} color={Colors.danger} />
                    </TouchableOpacity>
                  )}
                </View>
                <CommentReactions commentId={c.commentId} />
                <Text style={pcd.commentTime}>{timeAgo(c.timestamp)}</Text>
              </View>
            );
          })}
          <View style={pcd.addComment}>
            <Image source={{ uri: getAvatar(currentUser) }} style={pcd.commentAvatar} />
            <TextInput
              style={pcd.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              onSubmitEditing={handleComment}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleComment}>
              <FontAwesome6 name="paper-plane" size={18} color={Colors.primary} solid />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const pcd = StyleSheet.create({
  card: { backgroundColor: Colors.white, marginBottom: 8 },
  mOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  mBox: { backgroundColor: Colors.white, borderRadius: 12, padding: 20, width: '85%' },
  mTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: Colors.black },
  mInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 12, fontSize: 15, minHeight: 80, color: '#000', textAlignVertical: 'top' },
  mActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  mSave: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },

  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  author: { fontWeight: '800', fontSize: 15, color: Colors.black },
  liveBadge: { backgroundColor: '#E41E3F', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  time: { fontSize: 12, color: Colors.textMuted },
  feeling: { fontSize: 12, color: Colors.textMuted },
  followBtn: { backgroundColor: '#e7f3ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  followingBtn: { backgroundColor: Colors.bgGray },
  followText: { color: Colors.primary, fontWeight: '700', fontSize: 12 },

  postText: { fontSize: 15, lineHeight: 22, color: Colors.black },

  sharedCard: { marginHorizontal: 14, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginBottom: 10 },
  sharedAuthor: { fontWeight: '700', fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  sharedText: { fontSize: 14, color: Colors.black, marginBottom: 6 },
  sharedMedia: { width: '100%', height: 160, borderRadius: 6 },

  media: { width: '100%', height: 300 },
  videoWrap: { height: 280, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  videoPlayBtn: { alignItems: 'center', justifyContent: 'center' },

  stats: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reactEmoji: { fontSize: 16 },
  statText: { color: Colors.textMuted, fontSize: 13 },

  footer: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 4 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },

  commentsSection: { paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 6 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  bubble: { backgroundColor: Colors.bgGray, borderRadius: 18, padding: 10, maxWidth: '76%' },
  commentAuthor: { fontWeight: '700', fontSize: 12, color: Colors.black, marginBottom: 2 },
  commentText: { fontSize: 14, color: Colors.black },
  commentTime: { marginLeft: 42, fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  addComment: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  commentInput: { flex: 1, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#000' },
});

// ─────────────────────────────────────────────────────────────────────────────
// FRIENDS TAB
// ─────────────────────────────────────────────────────────────────────────────

function FriendsTab() {
  const [suggestions, setSuggestions] = useState(MOCK_FRIEND_SUGGESTIONS);
  const [added, setAdded] = useState({});
  const [declined, setDeclined] = useState({});

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgGray }} showsVerticalScrollIndicator={false}>
      {/* Friend Requests */}
      <View style={ftab.section}>
        <Text style={ftab.sectionTitle}>Friend Requests</Text>
        <View style={ftab.emptyWrap}>
          <Text style={{ fontSize: 44 }}>👥</Text>
          <Text style={ftab.emptyText}>No friend requests right now</Text>
        </View>
      </View>

      {/* Suggestions */}
      <View style={ftab.section}>
        <Text style={ftab.sectionTitle}>People You May Know</Text>
        {suggestions.filter((s) => !declined[s.uid]).map((person) => (
          <View key={person.uid} style={ftab.personRow}>
            <Image source={{ uri: person.avatar }} style={ftab.bigAvatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={ftab.personName}>{person.displayName}</Text>
              <Text style={ftab.personMutuals}>{person.mutuals} mutual friends</Text>
              {added[person.uid] ? (
                <Text style={{ color: Colors.green, fontWeight: '600', marginTop: 8, fontSize: 13 }}>✓ Friend Request Sent</Text>
              ) : (
                <View style={ftab.btnRow}>
                  <TouchableOpacity style={ftab.addBtn} onPress={() => setAdded((p) => ({ ...p, [person.uid]: true }))}>
                    <Text style={ftab.addText}>Add Friend</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={ftab.removeBtn} onPress={() => setDeclined((p) => ({ ...p, [person.uid]: true }))}>
                    <Text style={ftab.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const ftab = StyleSheet.create({
  section: { backgroundColor: '#fff', marginBottom: 8, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.black, marginBottom: 14 },
  emptyWrap: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
  personRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  bigAvatar: { width: 90, height: 90, borderRadius: 10 },
  personName: { fontWeight: '700', fontSize: 15, color: Colors.black },
  personMutuals: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  addBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  removeBtn: { flex: 1, backgroundColor: Colors.bgGray, borderRadius: 6, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  removeText: { color: Colors.black, fontWeight: '700', fontSize: 13 },
});

// ─────────────────────────────────────────────────────────────────────────────
// WATCH TAB
// ─────────────────────────────────────────────────────────────────────────────

const ALL_WATCH_VIDEOS = [
  ...MOCK_WATCH_VIDEOS,
  { id: 'w4', title: 'Music Festival Dhaka 2025', thumb: 'https://picsum.photos/seed/vid4/300/180', views: '2.1M views', duration: '45:00' },
  { id: 'w5', title: 'DIY Home Decor Ideas',      thumb: 'https://picsum.photos/seed/vid5/300/180', views: '120K views', duration: '18:22' },
  { id: 'w6', title: 'Cricket Highlights BD',     thumb: 'https://picsum.photos/seed/vid6/300/180', views: '3.4M views', duration: '22:10' },
];

function WatchTab() {
  const [searchTxt, setSearchTxt] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgGray }} showsVerticalScrollIndicator={false}>
      <View style={wtab.header}>
        <Text style={wtab.title}>Watch</Text>
        <View style={wtab.searchRow}>
          <FontAwesome6 name="magnifying-glass" size={14} color={Colors.textMuted} />
          <TextInput style={wtab.search} placeholder="Search videos..." placeholderTextColor="#999" value={searchTxt} onChangeText={setSearchTxt} />
        </View>
      </View>
      <View style={wtab.section}>
        <Text style={wtab.sectionTitle}>🔥 Trending</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {ALL_WATCH_VIDEOS.slice(0, 3).map((v) => (
            <TouchableOpacity key={v.id} style={wtab.card}>
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: v.thumb }} style={wtab.thumb} />
                <View style={wtab.playBtn}><FontAwesome6 name="play" size={16} color="#fff" solid /></View>
                <View style={wtab.dur}><Text style={wtab.durText}>{v.duration}</Text></View>
              </View>
              <Text style={wtab.vTitle} numberOfLines={2}>{v.title}</Text>
              <Text style={wtab.views}>{v.views}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={wtab.section}>
        <Text style={wtab.sectionTitle}>📺 For You</Text>
        {ALL_WATCH_VIDEOS.map((v) => (
          <TouchableOpacity key={v.id + 'list'} style={wtab.listRow}>
            <View style={{ position: 'relative' }}>
              <Image source={{ uri: v.thumb }} style={wtab.listThumb} />
              <View style={wtab.listDur}><Text style={wtab.durText}>{v.duration}</Text></View>
            </View>
            <View style={{ flex: 1, paddingLeft: 10 }}>
              <Text style={wtab.vTitle} numberOfLines={2}>{v.title}</Text>
              <Text style={wtab.views}>{v.views}</Text>
              <TouchableOpacity style={{ marginTop: 4 }}>
                <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '600' }}>Save Video</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const wtab = StyleSheet.create({
  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.black, marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  search: { flex: 1, fontSize: 14, color: '#000' },
  section: { backgroundColor: '#fff', marginBottom: 8, paddingVertical: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.black, paddingHorizontal: 16, marginBottom: 12 },
  card: { width: 200 },
  thumb: { width: 200, height: 120, borderRadius: 10, resizeMode: 'cover' },
  playBtn: { position: 'absolute', top: '50%', left: '50%', marginLeft: -16, marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  dur: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  durText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  vTitle: { fontWeight: '600', fontSize: 13, color: Colors.black, marginTop: 6 },
  views: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  listRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderColor: Colors.border },
  listThumb: { width: 140, height: 90, borderRadius: 8, resizeMode: 'cover' },
  listDur: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MARKETPLACE TAB
// ─────────────────────────────────────────────────────────────────────────────

const ALL_MARKETPLACE_ITEMS = [
  ...MOCK_MARKETPLACE,
  { id: 'm5', title: 'Washing Machine', price: '৳ 18,000', image: 'https://picsum.photos/seed/item5/200/200', location: 'Dhanmondi' },
  { id: 'm6', title: 'Laptop Bag',      price: '৳ 1,200',  image: 'https://picsum.photos/seed/item6/200/200', location: 'Tejgaon' },
  { id: 'm7', title: 'Camera DSLR',     price: '৳ 45,000', image: 'https://picsum.photos/seed/item7/200/200', location: 'Gulshan' },
  { id: 'm8', title: 'Sofa Set',        price: '৳ 22,000', image: 'https://picsum.photos/seed/item8/200/200', location: 'Bashundhara' },
];

const MKT_CATEGORIES = ['All', 'Electronics', 'Furniture', 'Vehicles', 'Fashion', 'Books'];

function MarketplaceTab() {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgGray }} showsVerticalScrollIndicator={false}>
      <View style={mktab.headerSection}>
        <Text style={mktab.title}>Marketplace</Text>
        <View style={mktab.searchRow}>
          <FontAwesome6 name="magnifying-glass" size={14} color={Colors.textMuted} />
          <TextInput style={mktab.search} placeholder="Search Marketplace" placeholderTextColor="#999" value={search} onChangeText={setSearch} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {MKT_CATEGORIES.map((c) => (
            <TouchableOpacity key={c} style={[mktab.catBtn, cat === c && mktab.catActive]} onPress={() => setCat(c)}>
              <Text style={[mktab.catText, cat === c && { color: Colors.primary, fontWeight: '700' }]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={mktab.section}>
        <Text style={mktab.sectionTitle}>Today's Picks</Text>
        <View style={mktab.grid}>
          {ALL_MARKETPLACE_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={mktab.item} activeOpacity={0.85}>
              <Image source={{ uri: item.image }} style={mktab.itemImg} />
              <TouchableOpacity style={mktab.saveIcon}><FontAwesome6 name="bookmark" size={14} color={Colors.textMuted} /></TouchableOpacity>
              <View style={{ padding: 8 }}>
                <Text style={mktab.itemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={mktab.itemPrice}>{item.price}</Text>
                <Text style={mktab.itemLoc}>{item.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const mktab = StyleSheet.create({
  headerSection: { backgroundColor: '#fff', padding: 16, marginBottom: 8, borderBottomWidth: 1, borderColor: Colors.border },
  title: { fontSize: 22, fontWeight: '900', color: Colors.black, marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bgGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10 },
  search: { flex: 1, fontSize: 14, color: '#000' },
  catBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border },
  catActive: { backgroundColor: '#e7f3ff', borderColor: Colors.primary },
  catText: { fontSize: 13, color: Colors.black },
  section: { backgroundColor: '#fff', marginBottom: 8, padding: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.black, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { width: (SCREEN_W - 42) / 2, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.bgGray, borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  itemImg: { width: '100%', height: 130, resizeMode: 'cover' },
  saveIcon: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontWeight: '700', fontSize: 13, color: Colors.black },
  itemPrice: { color: Colors.black, fontWeight: '800', fontSize: 14, marginTop: 2 },
  itemLoc: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// MENU TAB
// ─────────────────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { icon: 'user',              label: 'Profile',       color: '#1877F2' },
  { icon: 'bookmark',          label: 'Saved',         color: '#E9710F' },
  { icon: 'clock-rotate-left', label: 'Memories',      color: '#00BCD4' },
  { icon: 'calendar-days',     label: 'Events',        color: '#F44336' },
  { icon: 'people-group',      label: 'Groups',        color: '#9C27B0' },
  { icon: 'store',             label: 'Marketplace',   color: '#FF5722' },
  { icon: 'play-circle',       label: 'Watch',         color: '#E91E8C' },
  { icon: 'gamepad',           label: 'Gaming',        color: '#4CAF50' },
  { icon: 'graduation-cap',    label: 'Education',     color: '#3F51B5' },
  { icon: 'hand-holding-heart',label: 'Fundraisers',   color: '#FF9800' },
  { icon: 'flag',              label: 'Pages',         color: '#009688' },
  { icon: 'gear',              label: 'Settings',      color: Colors.textMuted },
  { icon: 'circle-question',   label: 'Help',          color: Colors.textMuted },
  { icon: 'moon',              label: 'Dark Mode',     color: Colors.black },
];

function MenuTab({ currentUser }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bgGray }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={mtab.userCard}>
        <Image source={{ uri: getAvatar(currentUser) }} style={mtab.userAvatar} />
        <View>
          <Text style={mtab.userName}>{getDisplayName(currentUser)}</Text>
          <Text style={mtab.viewProfile}>See your profile</Text>
        </View>
      </TouchableOpacity>
      <View style={mtab.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity key={item.label} style={mtab.item} activeOpacity={0.8}>
            <View style={[mtab.iconWrap, { backgroundColor: item.color + '22' }]}>
              <FontAwesome6 name={item.icon} size={22} color={item.color} solid />
            </View>
            <Text style={mtab.itemLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={mtab.footer}>
        <Text style={mtab.footerText}>Privacy · Terms · Advertising · Cookies · More</Text>
        <Text style={mtab.footerText}>RasBook © 2025</Text>
      </View>
    </ScrollView>
  );
}

const mtab = StyleSheet.create({
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', marginBottom: 8, gap: 12, borderBottomWidth: 1, borderColor: Colors.border },
  userAvatar: { width: 56, height: 56, borderRadius: 28 },
  userName: { fontWeight: '800', fontSize: 17, color: Colors.black },
  viewProfile: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 4, backgroundColor: '#fff', marginBottom: 8 },
  item: { width: (SCREEN_W - 28) / 3, alignItems: 'center', padding: 12, gap: 8 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 12, fontWeight: '600', color: Colors.black, textAlign: 'center' },
  footer: { padding: 20, alignItems: 'center', gap: 4 },
  footerText: { color: Colors.textMuted, fontSize: 11, textAlign: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isOnline = useNetworkStatus();
  const [activeTab, setActiveTab] = useState('home');
  const [savedPosts, setSavedPosts] = useState([]);

  useEffect(() => {
    const loadCached = async () => {
      const cached = await getCache(CACHE_KEYS.POSTS);
      if (cached) { setPosts(cached); setLoading(false); }
    };
    loadCached();

    if (!isOnline) { setLoading(false); return; }

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(25));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(data);
      setCache(CACHE_KEYS.POSTS, data);
      setLoading(false);
      setRefreshing(false);
    }, () => { setLoading(false); setRefreshing(false); });
    return unsub;
  }, [isOnline]);

  const onRefresh = useCallback(() => setRefreshing(true), []);
  const handleToggleSave = useCallback((postId) => {
    setSavedPosts((prev) => prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]);
  }, []);

  // Build interleaved feed
  const feedItems = useMemo(() => {
    const items = [];
    posts.forEach((post, idx) => {
      items.push({ type: 'post', data: post, id: post.id });
      if (idx === 0)  items.push({ type: 'friend_suggestions', id: 'w_friends' });
      if (idx === 2)  items.push({ type: 'birthday',    id: 'w_bday' });
      if (idx === 3)  items.push({ type: 'marketplace', id: 'w_mkt' });
      if (idx === 5)  items.push({ type: 'ad', data: SPONSORED_ADS[0], id: 'ad_0' });
      if (idx === 6)  items.push({ type: 'watch',  id: 'w_watch' });
      if (idx === 8)  items.push({ type: 'groups', id: 'w_groups' });
      if (idx === 9)  items.push({ type: 'events', id: 'w_events' });
      if (idx === 11) items.push({ type: 'ad', data: SPONSORED_ADS[1], id: 'ad_1' });
      if (idx === 12) items.push({ type: 'trending', id: 'w_trending' });
      if (idx === 14) items.push({ type: 'memory',   id: 'w_memory' });
    });
    if (posts.length === 0) {
      items.push({ type: 'friend_suggestions', id: 'w_friends' });
      items.push({ type: 'marketplace', id: 'w_mkt' });
      items.push({ type: 'watch', id: 'w_watch' });
      items.push({ type: 'events', id: 'w_events' });
      items.push({ type: 'groups', id: 'w_groups' });
      items.push({ type: 'trending', id: 'w_trending' });
    }
    return items;
  }, [posts]);

  const renderFeedItem = useCallback(({ item }) => {
    switch (item.type) {
      case 'post':             return <PostCard post={item.data} currentUser={user} savedPosts={savedPosts} onToggleSave={handleToggleSave} />;
      case 'friend_suggestions': return <FriendSuggestions suggestions={MOCK_FRIEND_SUGGESTIONS} />;
      case 'birthday':         return <BirthdayBanner birthdays={MOCK_BIRTHDAYS} />;
      case 'marketplace':      return <MarketplacePreview items={MOCK_MARKETPLACE} />;
      case 'watch':            return <WatchPreview videos={MOCK_WATCH_VIDEOS} />;
      case 'groups':           return <GroupsWidget groups={MOCK_GROUPS} />;
      case 'events':           return <EventsWidget events={MOCK_EVENTS} />;
      case 'trending':         return <TrendingTopics topics={TRENDING_TOPICS} />;
      case 'ad':               return <SponsoredAdCard ad={item.data} />;
      case 'memory':           return <MemoriesCard memory={MOCK_MEMORIES[0]} />;
      default:                 return null;
    }
  }, [user, savedPosts, handleToggleSave]);

  const ListHeader = useMemo(() => (
    <>
      <StoriesBar currentUser={user} />
      <CreatePost currentUser={user} />
    </>
  ), [user]);

  if (loading) {
    return (
      <View style={sc.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':     return <FriendsTab />;
      case 'watch':       return <WatchTab />;
      case 'marketplace': return <MarketplaceTab />;
      case 'menu':        return <MenuTab currentUser={user} />;
      default:
        return (
          <FlatList
            data={feedItems}
            keyExtractor={(item) => item.id}
            renderItem={renderFeedItem}
            ListHeaderComponent={ListHeader}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={sc.emptyWrap}>
                <Text style={{ fontSize: 52 }}>📰</Text>
                <Text style={sc.empty}>No posts yet. Be the first to share!</Text>
              </View>
            }
            removeClippedSubviews={Platform.OS !== 'web'}
            maxToRenderPerBatch={8}
            windowSize={10}
            initialNumToRender={6}
          />
        );
    }
  };

  return (
    <View style={sc.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <HomeHeader
        user={user}
        unreadCount={3}
        onSearchPress={() => {}}
        onMessengerPress={() => navigation?.navigate('Messenger')}
        onNotifPress={() => navigation?.navigate('Notifications')}
      />
      <TopNavTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <OfflineBanner />
      {renderTabContent()}
    </View>
  );
}

const sc = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgGray },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  empty: { textAlign: 'center', color: Colors.textMuted, fontSize: 16 },
});