// src/components/WebPhoneLayout.js
// Facebook-style responsive web layout
import React from 'react';
import { View, Platform, Dimensions, StyleSheet } from 'react-native';

const SCREEN_W = Dimensions.get('window').width;
const IS_WEB = Platform.OS === 'web';
const IS_WEB_WIDE = IS_WEB && SCREEN_W > 768; // tablet/desktop breakpoint

export default function WebPhoneLayout({ children, style }) {
  // Mobile or narrow web — full screen (no change)
  if (!IS_WEB_WIDE) {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  // Wide web — Facebook-style: sidebar + main content
  return (
    <View style={s.outerBg}>
      {/* Left sidebar — fixed width like Facebook */}
      <View style={s.sidebar}>
        <SidebarContent />
      </View>

      {/* Main content area — centered, max-width like Facebook feed */}
      <View style={s.mainArea}>
        <View style={s.contentWrap}>
          {children}
        </View>
      </View>

      {/* Right column — optional widgets */}
      <View style={s.rightCol} />
    </View>
  );
}

// Sidebar placeholder — navigation items দেখাবে
function SidebarContent() {
  return (
    <View style={s.sidebarInner}>
      {/* App logo area */}
      <View style={s.logoArea}>
        <View style={s.logoCircle} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outerBg: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f2f5', // Facebook-এর exact background color
  },
  // Left sidebar — 280px (Facebook-এর মতো)
  sidebar: {
    width: 280,
    minWidth: 280,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e4e6eb',
    ...(Platform.OS === 'web' ? {
      position: 'sticky',
      top: 0,
      height: '100vh',
      overflowY: 'auto',
    } : {}),
  },
  sidebarInner: {
    flex: 1,
    padding: 8,
  },
  logoArea: {
    padding: 16,
    marginBottom: 8,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1877f2',
  },
  // Center main content
  mainArea: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? {
      overflowY: 'auto',
      height: '100vh',
    } : {}),
  },
  contentWrap: {
    width: '100%',
    maxWidth: 680, // Facebook feed width
    flex: 1,
    ...(Platform.OS === 'web' ? {
      minHeight: '100vh',
    } : {}),
  },
  // Right column — 360px (Facebook-এর মতো)
  rightCol: {
    width: 360,
    minWidth: 360,
    backgroundColor: '#f0f2f5',
    ...(Platform.OS === 'web' ? {
      position: 'sticky',
      top: 0,
      height: '100vh',
    } : {}),
  },
});
