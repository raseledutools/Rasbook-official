// src/screens/AdDetailScreen.js — Product Detail + Changelog + Order + Notify Me
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Alert, Modal, TextInput, Share, Platform,
} from 'react-native';
import {
  doc, updateDoc, arrayUnion, arrayRemove, addDoc,
  collection, serverTimestamp,
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

export default function AdDetailScreen({ route }) {
  const { ad } = route.params;
  const { user } = useAuth();
  const navigation = useNavigation();

  const [notifyModal, setNotifyModal] = useState(false);
  const [orderModal, setOrderModal] = useState(false);
  const [notifyPhone, setNotifyPhone] = useState('');
  const [orderQty, setOrderQty] = useState('1');
  const [orderAddress, setOrderAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isWishlisted = (ad.wishlist || []).includes(user.uid);
  const adRef = doc(db, 'companyAds', ad.id);
  const badgeColor = BADGE_COLORS[ad.badge] || { bg: '#F0F2F5', text: '#65676B' };

  const toggleWishlist = async () => {
    await updateDoc(adRef, {
      wishlist: isWishlisted ? arrayRemove(user.uid) : arrayUnion(user.uid),
    }).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${ad.title} — ৳${Number(ad.price).toLocaleString()}\n\nCheck it on RasBook!` });
    } catch (e) {}
  };

  const handleOrder = async () => {
    if (!orderAddress.trim()) return Alert.alert('Error', 'Please enter delivery address');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        adId: ad.id,
        adTitle: ad.title,
        companyName: ad.companyName,
        companyId: ad.companyId,
        price: ad.price,
        quantity: parseInt(orderQty) || 1,
        totalPrice: (ad.price || 0) * (parseInt(orderQty) || 1),
        deliveryAddress: orderAddress.trim(),
        buyerUid: user.uid,
        buyerName: user.displayName || user.email,
        buyerPhone: user.phoneNumber || '',
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      await updateDoc(adRef, { orderCount: (ad.orderCount || 0) + 1 }).catch(() => {});
      setOrderModal(false);
      Alert.alert('Order Placed! 🎉', `Your order for "${ad.title}" has been placed.\nThe company will contact you soon.`);
    } catch (e) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotify = async () => {
    if (!notifyPhone.trim()) return Alert.alert('Error', 'Please enter your phone number');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'waitlist'), {
        adId: ad.id,
        adTitle: ad.title,
        companyId: ad.companyId,
        companyName: ad.companyName,
        userUid: user.uid,
        userName: user.displayName || user.email,
        phone: notifyPhone.trim(),
        createdAt: serverTimestamp(),
      });
      setNotifyModal(false);
      Alert.alert('Added to Waitlist! 🔔', `We'll notify you when "${ad.title}" is available.`);
    } catch (e) {
      Alert.alert('Error', 'Failed. Please try again.');
    } finally {
      setSubmitting(false);
      setNotifyPhone('');
    }
  };

  const isPreOrder = ad.badge === 'Pre-Order';

  return (
    <View style={s.container}>
      {/* Custom Back Header */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left" size={16} color="#050505" />
        </TouchableOpacity>
        <Text style={s.topBarTitle} numberOfLines={1}>{ad.title}</Text>
        <TouchableOpacity style={s.backBtn} onPress={handleShare}>
          <FontAwesome6 name="share-nodes" size={16} color="#050505" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={s.heroImage} resizeMode="cover" />
        ) : (
          <View style={[s.heroPlaceholder, { backgroundColor: ad.placeholderColor || '#E6F1FB' }]}>
            <Text style={{ fontSize: 80 }}>{ad.emoji || '📦'}</Text>
          </View>
        )}

        {/* Main Info */}
        <View style={s.mainCard}>
          {/* Badges Row */}
          <View style={s.badgesRow}>
            {ad.badge && (
              <View style={[s.badge, { backgroundColor: badgeColor.bg }]}>
                <Text style={[s.badgeText, { color: badgeColor.text }]}>{ad.badge}</Text>
              </View>
            )}
            {ad.inStock !== false && (
              <View style={[s.badge, { backgroundColor: '#EAF3DE' }]}>
                <FontAwesome6 name="circle-check" size={10} color="#3B6D11" solid />
                <Text style={[s.badgeText, { color: '#3B6D11', marginLeft: 4 }]}>In Stock</Text>
              </View>
            )}
          </View>

          <Text style={s.title}>{ad.title}</Text>

          {/* Company */}
          <View style={s.companyRow}>
            <Image
              source={{ uri: ad.companyLogo || getAvatar({ displayName: ad.companyName }) }}
              style={s.companyLogo}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.companyName}>{ad.companyName}</Text>
              {ad.verified && (
                <Text style={s.verifiedText}>
                  <FontAwesome6 name="circle-check" size={11} color={Colors.primary} solid /> Verified Company
                </Text>
              )}
            </View>
            <Text style={s.timeAgo}>{timeAgo(ad.createdAt)}</Text>
          </View>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>৳{Number(ad.price || 0).toLocaleString()}</Text>
            {ad.oldPrice && (
              <Text style={s.oldPrice}>৳{Number(ad.oldPrice).toLocaleString()}</Text>
            )}
            {ad.oldPrice && (
              <View style={[s.badge, { backgroundColor: '#FAEEDA' }]}>
                <Text style={[s.badgeText, { color: '#854F0B' }]}>
                  {Math.round(((ad.oldPrice - ad.price) / ad.oldPrice) * 100)}% off
                </Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <FontAwesome6 name="cart-shopping" size={13} color={Colors.textMuted} />
              <Text style={s.statText}>{ad.orderCount || 0} orders</Text>
            </View>
            <View style={s.statItem}>
              <FontAwesome6 name="bookmark" size={13} color={Colors.textMuted} />
              <Text style={s.statText}>{(ad.wishlist || []).length} saved</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={s.actionRow}>
            <TouchableOpacity
              style={s.btnPrimary}
              onPress={() => isPreOrder ? setNotifyModal(true) : setOrderModal(true)}
            >
              <FontAwesome6
                name={isPreOrder ? 'bell' : 'cart-shopping'}
                size={15} color="#fff"
              />
              <Text style={s.btnPrimaryText}>
                {isPreOrder ? 'Join Waitlist' : 'Order Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btnIcon} onPress={toggleWishlist}>
              <FontAwesome6
                name="bookmark"
                size={18}
                color={isWishlisted ? Colors.primary : Colors.textMuted}
                solid={isWishlisted}
              />
            </TouchableOpacity>

            <TouchableOpacity style={s.btnIcon} onPress={handleShare}>
              <FontAwesome6 name="share-nodes" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        {ad.description && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>About this product</Text>
            <Text style={s.description}>{ad.description}</Text>
          </View>
        )}

        {/* Changelog */}
        {ad.changelog && ad.changelog.length > 0 && (
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>
              <FontAwesome6 name="clock-rotate-left" size={14} color="#050505" /> Product Changelog
            </Text>
            <View style={s.changelogList}>
              {ad.changelog.map((log, idx) => (
                <View key={idx} style={s.changelogItem}>
                  <View style={[s.clDot, idx === 0 && s.clDotActive]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.clVersion}>{log.version}</Text>
                    <Text style={s.clNote}>{log.note}</Text>
                  </View>
                  <Text style={s.clDate}>{log.date}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── ORDER MODAL ── */}
      <Modal visible={orderModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Place Order</Text>
              <TouchableOpacity onPress={() => setOrderModal(false)}>
                <FontAwesome6 name="xmark" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalProduct} numberOfLines={1}>{ad.title}</Text>
            <Text style={s.modalPrice}>৳{Number(ad.price || 0).toLocaleString()} each</Text>

            <Text style={s.inputLabel}>Quantity</Text>
            <View style={s.qtyRow}>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => setOrderQty(String(Math.max(1, parseInt(orderQty || 1) - 1)))}
              >
                <FontAwesome6 name="minus" size={14} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={s.qtyText}>{orderQty}</Text>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => setOrderQty(String(parseInt(orderQty || 1) + 1))}
              >
                <FontAwesome6 name="plus" size={14} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={s.inputLabel}>Delivery Address</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Your full delivery address"
              placeholderTextColor="#aaa"
              value={orderAddress}
              onChangeText={setOrderAddress}
              multiline
              numberOfLines={3}
            />

            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>
                ৳{((ad.price || 0) * (parseInt(orderQty) || 1)).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={[s.btnPrimary, { marginTop: 8 }]}
              onPress={handleOrder}
              disabled={submitting}
            >
              <FontAwesome6 name="check" size={14} color="#fff" />
              <Text style={s.btnPrimaryText}>{submitting ? 'Placing Order...' : 'Confirm Order'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── NOTIFY / WAITLIST MODAL ── */}
      <Modal visible={notifyModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>🔔 Join Waitlist</Text>
              <TouchableOpacity onPress={() => setNotifyModal(false)}>
                <FontAwesome6 name="xmark" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSubText}>
              "{ad.title}" এখনো launch হয়নি। আপনার info দিন — launch হলেই জানাবো।
            </Text>

            <Text style={s.inputLabel}>Phone Number</Text>
            <TextInput
              style={s.modalInput}
              placeholder="01XXXXXXXXX"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              value={notifyPhone}
              onChangeText={setNotifyPhone}
            />

            <TouchableOpacity
              style={[s.btnPrimary, { marginTop: 8 }]}
              onPress={handleNotify}
              disabled={submitting}
            >
              <FontAwesome6 name="bell" size={14} color="#fff" />
              <Text style={s.btnPrimaryText}>{submitting ? 'Joining...' : 'Join Waitlist'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgGray },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 50, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: Colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center',
  },
  topBarTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#050505', marginHorizontal: 12 },

  heroImage: { width: '100%', height: 240 },
  heroPlaceholder: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },

  mainCard: {
    backgroundColor: '#fff', margin: 14, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },

  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  title: { fontSize: 20, fontWeight: '900', color: '#050505', marginBottom: 12, lineHeight: 26 },

  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderColor: Colors.border },
  companyLogo: { width: 40, height: 40, borderRadius: 10 },
  companyName: { fontSize: 14, fontWeight: '700', color: '#050505' },
  verifiedText: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  timeAgo: { fontSize: 12, color: Colors.textMuted },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  price: { fontSize: 26, fontWeight: '900', color: '#050505' },
  oldPrice: { fontSize: 16, color: Colors.textMuted, textDecorationLine: 'line-through' },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 13, color: Colors.textMuted },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnIcon: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center',
  },

  sectionCard: {
    backgroundColor: '#fff', marginHorizontal: 14, marginBottom: 14,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#050505', marginBottom: 12 },
  description: { fontSize: 14, color: '#444', lineHeight: 22 },

  changelogList: { gap: 14 },
  changelogItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  clDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.border, marginTop: 4, flexShrink: 0,
  },
  clDotActive: { backgroundColor: Colors.primary },
  clVersion: { fontSize: 13, fontWeight: '700', color: '#050505' },
  clNote: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  clDate: { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#050505' },
  modalProduct: { fontSize: 14, fontWeight: '600', color: '#050505', marginBottom: 2 },
  modalPrice: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  modalSubText: { fontSize: 14, color: Colors.textMuted, lineHeight: 20, marginBottom: 16 },

  inputLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  modalInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#000',
    backgroundColor: '#fafafa', marginBottom: 14,
  },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  qtyBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyText: { fontSize: 20, fontWeight: '800', color: '#050505', minWidth: 30, textAlign: 'center' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderColor: Colors.border },
  totalLabel: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
});
