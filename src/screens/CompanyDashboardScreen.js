// src/screens/CompanyDashboardScreen.js — Company Ad Management Dashboard
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Image, ScrollView,
} from 'react-native';
import {
  collection, query, where, onSnapshot, orderBy,
  doc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import { Colors, getAvatar, timeAgo } from '../utils/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BADGE_COLORS = {
  'New Launch': { bg: '#EAF3DE', text: '#3B6D11' },
  'Updated':    { bg: '#E6F1FB', text: '#185FA5' },
  'Offer':      { bg: '#FAEEDA', text: '#854F0B' },
  'Pre-Order':  { bg: '#EEEDFE', text: '#534AB7' },
};

function StatCard({ icon, label, value, color }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '20' }]}>
        <FontAwesome6 name={icon} size={18} color={color} solid />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function CompanyDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [myAds, setMyAds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ads'); // 'ads' | 'orders' | 'waitlist'

  useEffect(() => {
    // My Ads
    const adsQ = query(
      collection(db, 'companyAds'),
      where('companyId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubAds = onSnapshot(adsQ, (snap) => {
      setMyAds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // Orders for my company
    const ordersQ = query(
      collection(db, 'orders'),
      where('companyId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Waitlist for my products
    const waitlistQ = query(
      collection(db, 'waitlist'),
      where('companyId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubWaitlist = onSnapshot(waitlistQ, (snap) => {
      setWaitlist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAds(); unsubOrders(); unsubWaitlist(); };
  }, []);

  const handleDeleteAd = (ad) => {
    Alert.alert('Delete Ad', `Delete "${ad.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'companyAds', ad.id)).catch(() => {});
        },
      },
    ]);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  const renderAd = ({ item: ad }) => {
    const badgeColor = BADGE_COLORS[ad.badge] || { bg: '#F0F2F5', text: '#65676B' };
    return (
      <View style={s.adItem}>
        <View style={[s.adThumb, { backgroundColor: ad.placeholderColor || '#E6F1FB' }]}>
          <Text style={{ fontSize: 22 }}>{ad.emoji || '📦'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.adTitle} numberOfLines={1}>{ad.title}</Text>
          <View style={s.adMeta}>
            <Text style={s.adPrice}>৳{Number(ad.price || 0).toLocaleString()}</Text>
            <Text style={s.adDot}>·</Text>
            <View style={[s.miniBadge, { backgroundColor: badgeColor.bg }]}>
              <Text style={[s.miniBadgeText, { color: badgeColor.text }]}>{ad.badge}</Text>
            </View>
          </View>
          <Text style={s.adStats}>
            {ad.orderCount || 0} orders · {(ad.wishlist || []).length} saved · {timeAgo(ad.createdAt)}
          </Text>
        </View>
        <View style={s.adActions}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.navigate('AdDetail', { ad })}
          >
            <FontAwesome6 name="eye" size={14} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => handleDeleteAd(ad)}
          >
            <FontAwesome6 name="trash" size={14} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOrder = ({ item: order }) => (
    <View style={s.orderItem}>
      <View style={s.orderTop}>
        <Text style={s.orderTitle} numberOfLines={1}>{order.adTitle}</Text>
        <View style={[s.statusBadge, order.status === 'pending' ? s.statusPending : s.statusDone]}>
          <Text style={[s.statusText, order.status === 'pending' ? { color: '#854F0B' } : { color: '#3B6D11' }]}>
            {order.status === 'pending' ? 'Pending' : 'Done'}
          </Text>
        </View>
      </View>
      <Text style={s.orderBuyer}>
        <FontAwesome6 name="user" size={11} color={Colors.textMuted} /> {order.buyerName}
      </Text>
      <Text style={s.orderAddress} numberOfLines={1}>
        <FontAwesome6 name="location-dot" size={11} color={Colors.textMuted} /> {order.deliveryAddress}
      </Text>
      <View style={s.orderFooter}>
        <Text style={s.orderTotal}>৳{Number(order.totalPrice || 0).toLocaleString()} × {order.quantity}</Text>
        <Text style={s.orderTime}>{timeAgo(order.createdAt)}</Text>
      </View>
    </View>
  );

  const renderWaitlistItem = ({ item: entry }) => (
    <View style={s.waitlistItem}>
      <View style={s.waitlistIcon}>
        <FontAwesome6 name="bell" size={16} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.waitlistName}>{entry.userName}</Text>
        <Text style={s.waitlistProduct} numberOfLines={1}>{entry.adTitle}</Text>
        <Text style={s.waitlistPhone}>{entry.phone}</Text>
      </View>
      <Text style={s.waitlistTime}>{timeAgo(entry.createdAt)}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Dashboard</Text>
          <Text style={s.headerSub}>Your company ads & orders</Text>
        </View>
        <TouchableOpacity
          style={s.postBtn}
          onPress={() => navigation.navigate('PostAd')}
        >
          <FontAwesome6 name="plus" size={13} color="#fff" />
          <Text style={s.postBtnText}>New Ad</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={s.statsRow}>
        <StatCard icon="speakerphone" label="My Ads" value={myAds.length} color="#185FA5" />
        <StatCard icon="cart-shopping" label="Orders" value={orders.length} color="#3B6D11" />
        <StatCard icon="bell" label="Waitlist" value={waitlist.length} color="#854F0B" />
        <StatCard icon="bangladeshi-taka-sign" label="Revenue" value={`${(totalRevenue / 1000).toFixed(0)}K`} color="#993C1D" />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {['ads', 'orders', 'waitlist'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[s.tab, activeTab === tab && s.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'ads' ? `My Ads (${myAds.length})` : tab === 'orders' ? `Orders (${orders.length})` : `Waitlist (${waitlist.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'ads' && (
        <FlatList
          data={myAds}
          keyExtractor={(i) => i.id}
          renderItem={renderAd}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 40 }}>📢</Text>
              <Text style={s.emptyText}>No ads posted yet</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('PostAd')}>
                <Text style={s.emptyBtnText}>Post Your First Ad</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          keyExtractor={(i) => i.id}
          renderItem={renderOrder}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 40 }}>🛒</Text>
              <Text style={s.emptyText}>No orders yet</Text>
            </View>
          }
        />
      )}

      {activeTab === 'waitlist' && (
        <FlatList
          data={waitlist}
          keyExtractor={(i) => i.id}
          renderItem={renderWaitlistItem}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 40 }}>🔔</Text>
              <Text style={s.emptyText}>No waitlist entries yet</Text>
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
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#050505' },
  headerSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  postBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: Colors.border,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#050505' },
  statLabel: { fontSize: 11, color: Colors.textMuted, textAlign: 'center' },

  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },

  listContent: { padding: 14, gap: 10 },

  // Ad item
  adItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  adThumb: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  adTitle: { fontSize: 14, fontWeight: '700', color: '#050505', marginBottom: 4 },
  adMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  adPrice: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  adDot: { color: Colors.textMuted, fontSize: 12 },
  miniBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20 },
  miniBadgeText: { fontSize: 10, fontWeight: '700' },
  adStats: { fontSize: 11, color: Colors.textMuted },
  adActions: { gap: 8 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center',
  },

  // Order item
  orderItem: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  orderTitle: { fontSize: 14, fontWeight: '700', color: '#050505', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginLeft: 8 },
  statusPending: { backgroundColor: '#FAEEDA' },
  statusDone: { backgroundColor: '#EAF3DE' },
  statusText: { fontSize: 11, fontWeight: '700' },
  orderBuyer: { fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  orderAddress: { fontSize: 12, color: Colors.textMuted, marginBottom: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  orderTotal: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  orderTime: { fontSize: 12, color: Colors.textMuted },

  // Waitlist item
  waitlistItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  waitlistIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#E6F1FB', alignItems: 'center', justifyContent: 'center',
  },
  waitlistName: { fontSize: 14, fontWeight: '700', color: '#050505' },
  waitlistProduct: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  waitlistPhone: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  waitlistTime: { fontSize: 11, color: Colors.textMuted },

  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  emptyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
