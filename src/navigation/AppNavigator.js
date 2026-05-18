// src/navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import MessengerScreen from '../screens/MessengerScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../utils/theme';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => (
  <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
    <FontAwesome6
      name={name}
      size={22}
      color={focused ? Colors.primary : Colors.textMuted}
      solid={focused}
    />
  </View>
);

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: Colors.border,
          height: 56,
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
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="magnifying-glass" focused={focused} /> }}
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
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: '#e7f3ff',
  },
});
