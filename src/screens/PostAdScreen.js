// src/screens/PostAdScreen.js — Post a New Company Ad
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadToCloudinary } from '../services/cloudinary';
import { useAuth } from '../hooks/useAuth';
import { Colors, getDisplayName } from '../utils/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BADGE_OPTIONS = ['New Launch', 'Updated', 'Offer', 'Pre-Order'];
const CATEGORY_OPTIONS = ['Electronics', 'Fashion', 'Food', 'Tech', 'Health', 'Home', 'Auto', 'Other'];

const EMOJI_MAP = {
  Electronics: '💻', Fashion: '👗', Food: '🍔', Tech: '📱',
  Health: '💊', Home: '🏠', Auto: '🚗', Other: '📦',
};
const COLOR_MAP = {
  Electronics: '#E6F1FB', Fashion: '#FBEAF0', Food: '#EAF3DE', Tech: '#FAEEDA',
  Health: '#E1F5EE', Home: '#EEEDFE', Auto: '#FAECE7', Other: '#F0F2F5',
};

export default function PostAdScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [badge, setBadge] = useState('New Launch');
  const [category, setCategory] = useState('Electronics');
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Changelog entries
  const [changelogs, setChangelogs] = useState([{ version: '', note: '', date: '' }]);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission', 'Gallery access needed.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const addChangelogEntry = () => {
    setChangelogs([...changelogs, { version: '', note: '', date: '' }]);
  };

  const updateChangelog = (index, field, value) => {
    const updated = [...changelogs];
    updated[index][field] = value;
    setChangelogs(updated);
  };

  const removeChangelog = (index) => {
    setChangelogs(changelogs.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Product title is required');
    if (!companyName.trim()) return Alert.alert('Error', 'Company name is required');
    if (!price) return Alert.alert('Error', 'Price is required');

    setLoading(true);
    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadToCloudinary(imageUri, 'image');
      }

      const validChangelogs = changelogs.filter((c) => c.version.trim() && c.note.trim());

      await addDoc(collection(db, 'companyAds'), {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        companyName: companyName.trim(),
        companyId: user.uid,
        badge,
        category,
        imageUrl,
        emoji: EMOJI_MAP[category] || '📦',
        placeholderColor: COLOR_MAP[category] || '#E6F1FB',
        changelog: validChangelogs,
        verified: false,
        wishlist: [],
        orderCount: 0,
        postedBy: user.uid,
        postedByName: getDisplayName(user),
        createdAt: serverTimestamp(),
      });

      Alert.alert('Posted! 🎉', 'Your ad has been published successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to post ad. Please try again.\n' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <FontAwesome6 name="arrow-left" size={16} color="#050505" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post New Ad</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Image Upload */}
        <TouchableOpacity style={s.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="cover" />
          ) : (
            <View style={s.imagePlaceholder}>
              <FontAwesome6 name="image" size={32} color={Colors.textMuted} />
              <Text style={s.imagePickerText}>Tap to upload product image</Text>
              <Text style={s.imagePickerSub}>Recommended: 16:9 ratio</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Basic Info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Product Info</Text>

          <Text style={s.label}>Product Title *</Text>
          <TextInput
            style={s.input}
            placeholder="e.g. UltraBook Pro X1 — 2025 Edition"
            placeholderTextColor="#aaa"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={s.label}>Company Name *</Text>
          <TextInput
            style={s.input}
            placeholder="Your company name"
            placeholderTextColor="#aaa"
            value={companyName}
            onChangeText={setCompanyName}
          />

          <Text style={s.label}>Description</Text>
          <TextInput
            style={[s.input, s.textarea]}
            placeholder="Describe your product, features, specifications..."
            placeholderTextColor="#aaa"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Price (৳) *</Text>
              <TextInput
                style={s.input}
                placeholder="0"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Old Price (৳)</Text>
              <TextInput
                style={s.input}
                placeholder="Optional"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={oldPrice}
                onChangeText={setOldPrice}
              />
            </View>
          </View>
        </View>

        {/* Badge */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ad Type</Text>
          <View style={s.chipRow}>
            {BADGE_OPTIONS.map((b) => (
              <TouchableOpacity
                key={b}
                style={[s.chip, badge === b && s.chipActive]}
                onPress={() => setBadge(b)}
              >
                <Text style={[s.chipText, badge === b && s.chipTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Category</Text>
          <View style={s.chipRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.chip, category === c && s.chipActive]}
                onPress={() => setCategory(c)}
              >
                <Text style={[s.chipText, category === c && s.chipTextActive]}>
                  {EMOJI_MAP[c]} {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Changelog */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Product Changelog</Text>
            <TouchableOpacity style={s.addBtn} onPress={addChangelogEntry}>
              <FontAwesome6 name="plus" size={12} color={Colors.primary} />
              <Text style={s.addBtnText}>Add Version</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.sectionSub}>Add version history so customers see what changed.</Text>

          {changelogs.map((log, idx) => (
            <View key={idx} style={s.changelogEntry}>
              <View style={s.clHeader}>
                <Text style={s.clLabel}>Version {idx + 1}</Text>
                {changelogs.length > 1 && (
                  <TouchableOpacity onPress={() => removeChangelog(idx)}>
                    <FontAwesome6 name="trash" size={13} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. v2025.1"
                    placeholderTextColor="#aaa"
                    value={log.version}
                    onChangeText={(v) => updateChangelog(idx, 'version', v)}
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={s.input}
                    placeholder="e.g. Jan 2025"
                    placeholderTextColor="#aaa"
                    value={log.date}
                    onChangeText={(v) => updateChangelog(idx, 'date', v)}
                  />
                </View>
              </View>
              <TextInput
                style={[s.input, { marginTop: -6 }]}
                placeholder="What changed in this version?"
                placeholderTextColor="#aaa"
                value={log.note}
                onChangeText={(v) => updateChangelog(idx, 'note', v)}
              />
            </View>
          ))}
        </View>

        {/* Post Button */}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <TouchableOpacity style={s.postBtn} onPress={handlePost}>
            <FontAwesome6 name="paper-plane" size={16} color="#fff" />
            <Text style={s.postBtnText}>Publish Ad</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgGray },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingTop: 50, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderColor: Colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgGray, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#050505' },

  scroll: { padding: 14, gap: 14 },

  imagePicker: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  previewImage: { width: '100%', height: 200 },
  imagePlaceholder: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 8 },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  imagePickerSub: { fontSize: 12, color: Colors.border },

  section: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#050505', marginBottom: 14 },
  sectionSub: { fontSize: 12, color: Colors.textMuted, marginTop: -10, marginBottom: 14 },

  label: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#000',
    backgroundColor: '#fafafa', marginBottom: 14,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: '#fafafa',
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  changelogEntry: {
    borderTopWidth: 1, borderColor: Colors.border,
    paddingTop: 14, marginTop: 10,
  },
  clHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  clLabel: { fontSize: 13, fontWeight: '700', color: '#050505' },

  postBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  postBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
