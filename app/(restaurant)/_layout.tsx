// app/(restaurant)/_layout.tsx
// Restaurant Owner Tab Layout - Production Version with Real Backend Integration

import { Tabs } from 'expo-router';
import { LayoutDashboard, Tag, BarChart3, Settings } from 'lucide-react-native';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

export default function RestaurantLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();

  // CRITICAL: Verify user is restaurant owner
  // Redirect if not authenticated or not restaurant owner role
  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role !== 'restaurant_owner') {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          height: Platform.OS === 'ios' ? 88 : 68,
          elevation: 0,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.1)' } as any
            : {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: `${colors.primary}15` }]}>
              <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: 'Offers',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: `${colors.primary}15` }]}>
              <Tag size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: `${colors.primary}15` }]}>
              <BarChart3 size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: `${colors.primary}15` }]}>
              <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      {/* Hidden screens (accessible via navigation but not in tab bar) */}
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="food-waste" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="book-call" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
