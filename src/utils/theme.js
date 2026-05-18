// src/utils/theme.js

export const Colors = {
  primary: '#1877F2',
  green: '#42b72a',
  white: '#ffffff',
  black: '#050505',
  bgGray: '#F0F2F5',
  textMuted: '#65676B',
  border: '#ced0d4',
  hoverBg: '#f2f2f2',
  danger: '#dc3545',

  // Dark mode
  dark: {
    bg: '#18191a',
    card: '#242526',
    text: '#e4e6eb',
    muted: '#b0b3b8',
    border: '#3e4042',
    hover: '#3a3b3c',
  },
};

export const getAvatar = (user) =>
  user?.photoURL ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.displayName || 'User'
  )}&background=1877F2&color=fff`;

export const getDisplayName = (user) =>
  user?.displayName || user?.email?.split('@')[0] || 'User';

export const timeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};
