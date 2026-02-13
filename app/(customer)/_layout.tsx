// app/(customer)/_layout.tsx
// Customer Tab Navigation Layout with Real Backend Integration

import { Tabs } from 'expo-router';
import { Home, Search, Ticket, User, Gift } from 'lucide-react-native';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function CustomerLayout() {
  const { colors } = useTheme();

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
      {/* Home Tab - Restaurant Browse */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Explore Tab - Search & Discover */}
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Search size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Coupons Tab */}
      <Tabs.Screen
        name="coupons"
        options={{
          title: 'Coupons',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ticket size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Rewards Tab */}
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Gift size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Hidden Screens - Not shown in tab bar */}
      <Tabs.Screen
        name="more"
        options={{
          href: null, // Hide from tab bar
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="referral"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="test"
        options={{
          href: null,
        }}
      />

      {/* Restaurant Detail - Nested Route */}
      <Tabs.Screen
        name="restaurant/[id]"
        options={{
          href: null,
        }}
      />

      {/* Checkout Screen - Nested Route */}
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
        }}
      />

      {/* Order Tracking - Nested Route */}
      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

/* -----------------------------------------------------
   STYLES
----------------------------------------------------- */

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* -----------------------------------------------------
   CUSTOMER TAB STRUCTURE:
   
   VISIBLE TABS (5):
   1. Home - Browse restaurants (app/(customer)/home.tsx)
   2. Explore - Search & discover (app/(customer)/deals.tsx)
   3. Coupons - View & redeem coupons (app/(customer)/coupons.tsx)
   4. Rewards - Loyalty program (app/(customer)/rewards.tsx)
   5. Profile - User settings (app/(customer)/profile.tsx)
   
   HIDDEN SCREENS (accessed via navigation):
   - More - Additional features
   - Notifications - Push notifications
   - Bookings - Table reservations
   - Favorites - Saved restaurants
   - Referral - Referral program
   - Test - Development testing
   - Restaurant Detail - View menu & place order
   - Checkout - Complete order
   - Order Tracking - Live order status
   
   NAVIGATION FLOW:
   Home → Restaurant Detail → Checkout → Order Tracking
   Profile → Favorites → Restaurant Detail
   Profile → Bookings → Booking Details
   
   BACKEND CONNECTIONS:
   - Each tab screen fetches data from real API
   - Uses React Query for caching and state management
   - All mutations invalidate relevant query caches
   - Real-time updates via Supabase Realtime
----------------------------------------------------- */
