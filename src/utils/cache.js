// src/utils/cache.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const setCache = async (key, data) => {
  try {
    const entry = { data, ts: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
};

export const getCache = async (key, maxAge = CACHE_TTL) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > maxAge) return null; // expired
    return data;
  } catch (e) {
    return null;
  }
};

export const clearCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {}
};

export const CACHE_KEYS = {
  POSTS: 'cache_posts',
  STORIES: 'cache_stories',
  FRIENDS: 'cache_friends',
  REELS: 'cache_reels',
  NOTIFICATIONS: 'cache_notifications',
};
