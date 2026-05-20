// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web build-এ native-only packages exclude করো
// react-native-callkeep, react-native-webrtc, react-native-voip-push-notification
// এগুলো web-এ কাজ করে না, তাই web build-এ stub দিয়ে replace করো
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const nativeOnlyModules = [
      'react-native-callkeep',
      'react-native-webrtc',
      'react-native-voip-push-notification',
      '@react-native-firebase/messaging',
      '@react-native-firebase/app',
    ];
    if (nativeOnlyModules.some(m => moduleName === m || moduleName.startsWith(m + '/'))) {
      // Web-এ empty stub return করো
      return { type: 'empty' };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

// react-native-webrtc binary files
config.resolver.assetExts.push('dylib', 'so', 'node');

module.exports = config;
