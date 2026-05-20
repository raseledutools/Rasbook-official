// metro.config.js
// react-native-webrtc-এর জন্য প্রয়োজনীয় config

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-webrtc এর binary files handle করার জন্য
config.resolver.assetExts.push('dylib', 'so', 'node');

module.exports = config;
