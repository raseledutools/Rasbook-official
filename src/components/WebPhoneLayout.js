// src/components/WebPhoneLayout.js
// Web এ সব screen কে phone-এর মতো centered দেখায় (max-width 390px)
import React from 'react';
import { View, Platform, Dimensions, StyleSheet } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const IS_WEB_WIDE = Platform.OS === 'web' && SCREEN_W > 500;

export default function WebPhoneLayout({ children, style }) {
  if (!IS_WEB_WIDE) {
    // Mobile / narrow web — full screen
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  // Wide web — phone frame centered
  return (
    <View style={s.outerBg}>
      <View style={s.phoneFrame}>
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outerBg: {
    flex: 1,
    backgroundColor: '#e4e6eb',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingBottom: 24,
  },
  phoneFrame: {
    width: 390,
    maxWidth: 390,
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
    // Web-specific box shadow
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      maxHeight: 'calc(100vh - 48px)',
    } : {}),
  },
});
