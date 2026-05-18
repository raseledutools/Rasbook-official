// src/utils/cache.js
import { Platform } from 'react-native';

const CACHE_TTL = 10 * 60 * 1000;

const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.getItem(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.setItem(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    const AS = (await import('@react-native-async-storage/async-storage')).default;
    return AS.removeItem(key);
  },
};

export const setCache = async (key, data) => {
  try {
    await storage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) { console.warn('Cache write failed:', e); }
};

export const getCache = async (key, maxAge = CACHE_TTL) => {
  try {
    const raw = await storage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > maxAge) return null;
    return data;
  } catch { return null; }
};

export const clearCache = async (key) => {
  try { await storage.removeItem(key); } catch {}
};

export const CACHE_KEYS = {
  POSTS: 'cache_posts',
  STORIES: 'cache_stories',
  FRIENDS: 'cache_friends',
  REELS: 'cache_reels',
  NOTIFICATIONS: 'cache_notifications',
};
