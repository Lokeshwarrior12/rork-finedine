// app/(restaurant)/dashboard.tsx
// Restaurant Owner Dashboard with Real-time Stats and Order Management

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bell,
  Package,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, realtime } from '@/lib/supabase';

import { api, Order } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/* ──────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────── */

const { width } = Dimensions.get('window');

const Colors = {
  primary: '#F97316',
  success: '#4CAF50',
  error: '#FF3B30',
  warning: '#FF9800',
  info: '#2196F3',
  text: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  background: '#fff',
  surface: '#f9f9f9',
  border: '#f0f0f0',
};

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return Colors.warning;
    case 'confirmed':
    case 'preparing':
      return Colors.info;
    case 'ready':
      return '#9C27B0';
    case 'delivered':
      return Colors.success;
    case 'cancelled':
      return Colors.error;
    default:
      return Colors.textMuted;
  }
}

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const restaurantId = user?.restaurantId;

  /* ────────────────────────────────────────────────────────
     Authentication Check
  ──────────────────────────────────────────────────────── */

  if (!user || user.role !== 'restaurant_owner') {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Access Denied</Text>
        <Text style={styles.errorMessage}>
          You need a restaurant owner account to access this page.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!restaurantId) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>No Restaurant Found</Text>
        <Text style={styles.errorMessage}>
          Your account is not linked to a restaurant.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ────────────────────────────────────────────────────────
     Data Fetching
  ──────────────────────────────────────────────────────── */

  // Fetch restaurant details
  const { data: restaurantData } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.getRestaurant(restaurantId),
    enabled: !!restaurantId,
  });

  // Fetch restaurant orders
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['restaurant-orders', restaurantId],
    queryFn: () => api.getRestaurantOrders(restaurantId),
    enabled: !!restaurantId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch restaurant analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['restaurant-analytics', restaurantId, 'today'],
    queryFn: () => api.getRestaurantAnalytics(restaurantId, 'today'),
    enabled: !!restaurantId,
  });

  const restaurant = restaurantData?.data;
  const orders = ordersData?.data || [];
  const analytics = analyticsData?.data;

  /* ────────────────────────────────────────────────────────
     Real-time Order Subscriptions
  ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!restaurantId) return;

    console.log('📡 Subscribing to new restaurant orders:', restaurantId);

    // Subscribe to new orders
    const unsubscribe = realtime.subscribeToRestaurantOrders(
      restaurantId,
      (payload) => {
        console.log('🔔 New order received!', payload);

        // Show alert
        Alert.alert('New Order', 'You have a new order!', [
          {
            text: 'View',
            onPress: () => refetchOrders(),
          },
          { text: 'OK' },
        ]);

        // Refetch orders
        queryClient.invalidateQueries({ queryKey: ['restaurant-orders'] });
        queryClient.invalidateQueries({ queryKey: ['restaurant-analytics'] });
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from restaurant orders');
      unsubscribe();
    };
  }, [restaurantId, queryClient]);

  /* ────────────────────────────────────────────────────────
     Calculate Stats
  ──────────────────────────────────────────────────────── */

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const preparingOrders = orders.filter((o) => o.status === 'preparing').length;
  const readyOrders = orders.filter((o) => o.status === 'ready').length;
  const todayRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    {
      label: "Today's Revenue",
      value: `$${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: Colors.success,
      bgColor: Colors.success + '20',
    },
    {
      label: "Today's Orders",
      value: orders.length,
      icon: ShoppingBag,
      color: Colors.primary,
      bgColor: Colors.primary + '20',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders,
      icon: Package,
      color: Colors.warning,
      bgColor: Colors.warning + '20',
    },
    {
      label: 'Avg. Rating',
      value: restaurant?.rating?.toFixed(1) || '0.0',
      icon: TrendingUp,
      color: '#FFB800',
      bgColor: '#FFB80020',
    },
  ];

  const actionItems = [
    {
      icon: Package,
      title: 'Pending Orders',
      value: pendingOrders,
      color: Colors.warning,
      route: '/(restaurant)/orders?filter=pending',
    },
    {
      icon: Clock,
      title: 'Preparing',
      value: preparingOrders,
      color: Colors.info,
      route: '/(restaurant)/orders?filter=preparing',
    },
    {
      icon: CheckCircle,
      title: 'Ready for Pickup',
      value: readyOrders,
      color: Colors.success,
      route: '/(restaurant)/orders?filter=ready',
    },
  ];

  /* ────────────────────────────────────────────────────────
     Render
  ──────────────────────────────────────────────────────── */

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetchOrders}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Good {getTimeOfDay()}</Text>
            <Text style={styles.userName}>
              {restaurant?.name || user?.name || 'Restaurant Owner'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Bell size={22} color={Colors.text} />
            {pendingOrders > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {pendingOrders}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View
                style={[styles.statIcon, { backgroundColor: stat.bgColor }]}
              >
                <stat.icon size={18} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Order Action Items */}
        {(pendingOrders > 0 || preparingOrders > 0 || readyOrders > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Status</Text>
            {actionItems.map(
              (item, index) =>
                item.value > 0 && (
                  <TouchableOpacity
                    key={index}
                    style={styles.orderActionCard}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={styles.actionLeft}>
                      <View
                        style={[
                          styles.orderActionIcon,
                          { backgroundColor: item.color + '20' },
                        ]}
                      >
                        <item.icon size={24} color={item.color} />
                      </View>
                      <View>
                        <Text style={styles.orderActionTitle}>
                          {item.title}
                        </Text>
                        <Text style={styles.orderActionSubtitle}>
                          {item.value} {item.value === 1 ? 'order' : 'orders'}
                        </Text>
                      </View>
                    </View>
                    <ArrowRight size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                )
            )}
          </View>
        )}

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity
              onPress={() => router.push('/(restaurant)/orders' as any)}
            >
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {ordersLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginVertical: 20 }}
            />
          ) : orders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Package size={48} color={Colors.textMuted} />
              <Text style={styles.emptyOrdersText}>No orders yet today</Text>
            </View>
          ) : (
            orders.slice(0, 5).map((order: Order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  router.push(`/(customer)/order/${order.id}` as any)
                }
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>
                    #{order.id.slice(0, 8)}
                  </Text>
                  <View
                    style={[
                      styles.orderStatus,
                      { backgroundColor: getStatusColor(order.status) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.orderStatusText,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderItems} numberOfLines={1}>
                  {order.items
                    .map((i) => `${i.quantity}x ${i.name}`)
                    .join(', ')}
                </Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTime}>
                    {new Date(order.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={styles.orderTotal}>
                    ${order.total.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/(restaurant)/menu-management' as any)}
            >
              <Text style={styles.quickLinkText}>Menu Management</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/(restaurant)/inventory' as any)}
            >
              <Text style={styles.quickLinkText}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/(restaurant)/analytics' as any)}
            >
              <Text style={styles.quickLinkText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickLink}
              onPress={() => router.push('/(restaurant)/settings' as any)}
            >
              <Text style={styles.quickLinkText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────
   Styles
────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  orderActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  orderActionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyOrders: {
    alignItems: 'center',
    padding: 32,
  },
  emptyOrdersText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderItems: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLink: {
    flex: 1,
    minWidth: (width - 56) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
