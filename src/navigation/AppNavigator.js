// src/navigation/AppNavigator.js — Updated: Ads tab + Stack navigator for detail screens
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MessengerScreen from '../screens/MessengerScreen';
import ReelsScreen from '../screens/ReelsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdsScreen from '../screens/AdsScreen';
import AdDetailScreen from '../screens/AdDetailScreen';
import PostAdScreen from '../screens/PostAdScreen';
import CompanyDashboardScreen from '../screens/CompanyDashboardScreen';
import { Colors } from '../utils/theme';
import WebPhoneLayout from '../components/WebPhoneLayout';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ICON_EMOJI = {
  'house': '🏠', 'facebook-messenger': '💬', 'bullhorn': '📣',
  'film': '🎬', 'bell': '🔔', 'circle-user': '👤',
};

const TabIcon = ({ name, focused }) => {
  try {
    return (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <FontAwesome6
          name={name}
          size={22}
          color={focused ? Colors.primary : Colors.textMuted}
          solid={focused}
        />
      </View>
    );
  } catch (e) {
    return (
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Text style={{ fontSize: 20 }}>{ICON_EMOJI[name] || '●'}</Text>
      </View>
    );
  }
};

// Ads Stack — wraps Ads browse + Detail + Post + Dashboard
function AdsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdsBrowse" component={AdsScreen} />
      <Stack.Screen name="AdDetail" component={AdDetailScreen} />
      <Stack.Screen name="PostAd" component={PostAdScreen} />
      <Stack.Screen name="CompanyDashboard" component={CompanyDashboardScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <WebPhoneLayout>
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.border,
          height: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="house" focused={focused} /> }}
      />
      <Tab.Screen
        name="Messenger"
        component={MessengerScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="facebook-messenger" focused={focused} /> }}
      />
      <Tab.Screen
        name="Ads"
        component={AdsStack}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="bullhorn" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reels"
        component={ReelsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="film" focused={focused} /> }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="bell" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="circle-user" focused={focused} /> }}
      />
    </Tab.Navigator>
    </WebPhoneLayout>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 46, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: '#e7f3ff',
  },
});
