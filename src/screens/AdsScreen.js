// src/screens/AdsScreen.js — Company Ads Browse
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Image, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import {
  collection, query, orderBy, onSnapshot, limit,
  doc, updateDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Colors, getAvatar, timeAgo } from '../utils/theme';
import OfflineBanner from '../components/OfflineBanner';
import { FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CATEGORIES = ['All', 'New Launch', 'Updated', 'Offer', 'Pre-Order', 'Electronics', 'Fashion', 'Food', 'Tech'];

const BADGE_COLORS = {
  'New Launch': { bg: '#EAF3DE', text: '#3B6D11' },
  'Updated':    { bg: '#E6F1FB', text: '#185FA5' },
  'Offer':      { bg: '#FAEEDA', text: '#854F0B' },
  'Pre-Order':  { bg: '#EEEDFE', text: '#534AB7' },
};

function AdCard({ ad, currentUser, onPress }) {
  const isWishlisted = (ad.wishlist || []).includes(currentUser.uid);
  const adRef = doc(db, 'companyAds', ad.id);

  const toggleWishlist = async () => {
    await updateDoc(adRef, {
      wishlist: isWishlisted
        ? arrayRemove(currentUser.uid)
        : arrayUnion(currentUser.uid),
    }).catch(() => {});
  };

  const badgeColor = BADGE_COLORS[ad.badge] || { bg: '#F0F2F5', text: '#65676B' };

  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(ad)} activeOpacity={0.92}>
      {/* Ad Image */}
      {ad.imageUrl ? (
        {ad.imageUrl ? <Image source={{ uri: ad.imageUrl }} style={s.adImage} resizeMode="cover" /> : <View style={[s.adImage, {backgroundColor: '#f0f2f5', alignItems:'center', justifyContent:'center'}]} />}
      ) : (
        <View style={[s.adImagePlaceholder, { backgroundColor: ad.placeholderColor || '#E6F1FB' }]}>
          <Text style={{ fontSize: 48 }}>{ad.emoji || '📦'}</Text>
        </View>
      )}

      {/* Badge */}
      {ad.badge && (
        <View style={[s.badge, { backgroundColor: badgeColor.bg }]}>
          <Text style={[s.badgeText, { color: badgeColor.text }]}>{ad.badge}</Text>
        </View>
      )}

      <View style={s.cardBody}>
        {/* Company Info */}
        <View style={s.companyRow}>
          <Image
            source={{ uri: ad.companyLogo || getAvatar({ displayName: ad.companyName }) }}
            style={s.companyLogo}
          />
          <Text style={s.companyName}>{ad.companyName}</Text>
          {ad.verified && (
            <FontAwesome6 name="circle-check" size={13} color={Colors.primary} solid />
          )}
        </View>

        <Text style={s.adTitle} numberOfLines={2}>{ad.title}</Text>
        <Text style={s.adDesc} numberOfLines={2}>{ad.description}</Text>

        <View style={s.cardFooter}>
          <Text style={s.price}>৳{Number(ad.price || 0).toLocaleString()}</Text>
          <View style={s.footerRight}>
            <TouchableOpacity style={s.wishlistBtn} onPress={toggleWishlist}>
              <FontAwesome6
                name="bookmark"
                size={15}
                color={isWishlisted ? Colors.primary : Colors.textMuted}
                solid={isWishlisted}
              />
            </TouchableOpacity>
            <TouchableOpacity style={s.orderBtn}>
              <Text style={s.orderBtnText}>
                {ad.badge === 'Pre-Order' ? 'Pre-Order' : 'Order Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function AdsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'companyAds'), orderBy('createdAt', 'desc'), limit(30));
    const unsub = onSnapshot(q, (snap) => {
      setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  const filtered = ads.filter((ad) => {
    const matchCat = activeCategory === 'All' || ad.badge === activeCategory || ad.category === activeCategory;
    const matchSearch = !search || ad.title?.toLowerCase().includes(search.toLowerCase()) || ad.companyName?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleAdPress = (ad) => {
    navigation.navigate('AdDetail', { ad });
  };

  return (
    <View style={s.container}>
      <OfflineBanner />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>
            <Text style={{ color: Colors.primary }}>Ras</Text>
            <Text style={{ color: Colors.green }}>Book</Text>
            <Text style={{ color: '#050505', fontSize: 16, fontWeight: '600' }}> Ads</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={s.postAdBtn}
          onPress={() => navigation.navigate('PostAd')}
        >
          <FontAwesome6 name="plus" size={13} color="#fff" />
          <Text style={s.postAdText}>Post Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <FontAwesome6 name="magnifying-glass" size={15} color={Colors.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Search products or companies..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.catChip, activeCategory === item && s.catChipActive]}
            onPress={() => setActiveCategory(item)}
          >
            <Text style={[s.catText, activeCategory === item && s.catTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Ads List */}
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AdCard ad={item} currentUser={user} onPress={handleAdPress} />
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 48 }}>📢</Text>
              <Text style={s.emptyText}>No ads found.</Text>
              <Text style={s.emptySubText}>Companies will post their products here.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgGray },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  postAdBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  postAdText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', marginHorizontal: 14, marginVertical: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#000' },

  catList: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  catTextActive: { color: '#fff' },

  listContent: { padding: 14, paddingTop: 4, gap: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  adImage: { width: '100%', height: 180 },
  adImagePlaceholder: {
    width: '100%', height: 160,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  cardBody: { padding: 14 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  companyLogo: { width: 24, height: 24, borderRadius: 6 },
  companyName: { fontSize: 12, color: Colors.textMuted, fontWeight: '500', flex: 1 },

  adTitle: { fontSize: 16, fontWeight: '800', color: '#050505', marginBottom: 4 },
  adDesc: { fontSize: 13, color: Colors.textMuted, lineHeight: 18, marginBottom: 12 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 18, fontWeight: '800', color: '#050505' },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wishlistBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center',
  },
  orderBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 20,
  },
  orderBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#050505' },
  emptySubText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
