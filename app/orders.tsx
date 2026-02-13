import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Package, Clock, CheckCircle, Truck } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useOrderSubscription } from '@/hooks/useOrderSubscription';

type Order = {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'refunded' | 'failed';
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* ------------------ FETCH ORDERS FROM REAL API ------------------ */
  const { 
    data: ordersData, 
    isLoading, 
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return api.getUserOrders(user.id);
    },
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });

  const orders = ordersData?.data || [];

  /* ------------------ REAL-TIME ORDER UPDATES ------------------ */
  useOrderSubscription({
    onUpdate: (payload) => {
      console.log('[Orders] Real-time update:', payload);
      // Invalidate and refetch orders when any order is updated
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });

  /* ------------------ HELPERS ------------------ */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={20} color={colors.success} />;
      case 'ready':
        return <Truck size={20} color={colors.primary} />;
      case 'preparing':
        return <Package size={20} color={colors.warning} />;
      default:
        return <Clock size={20} color={colors.textMuted} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return colors.success;
      case 'ready':
        return colors.primary;
      case 'preparing':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Confirmation';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Being Prepared';
      case 'ready':
        return 'Ready for Pickup';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getItemsSummary = (items: Order['items']) => {
    if (items.length === 0) return 'No items';
    if (items.length === 1) return items[0].name;
    return `${items[0].name} +${items.length - 1} more`;
  };

  /* ------------------ RENDER ORDER CARD ------------------ */
  const renderOrder = ({ item }: { item: Order }) => (
    <Pressable
      style={[
        styles.orderCard,
        { 
          backgroundColor: colors.surface, 
          borderColor: colors.border,
        },
      ]}
      onPress={() => router.push(`/(customer)/order/${item.id}` as any)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          {getStatusIcon(item.status)}
          <View style={styles.orderHeaderText}>
            <Text style={[styles.orderId, { color: colors.text }]}>
              Order #{item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <Text style={[styles.orderItems, { color: colors.textSecondary }]}>
          {getItemsSummary(item.items)}
        </Text>
        
        <View style={styles.orderFooter}>
          <Text style={[styles.orderTotal, { color: colors.text }]}>
            ${item.total.toFixed(2)}
          </Text>
          
          <Text style={[styles.orderItemCount, { color: colors.textMuted }]}>
            {item.items.reduce((sum, i) => sum + i.quantity, 0)} items
          </Text>
        </View>
      </View>
    </Pressable>
  );

  /* ------------------ LOADING STATE ------------------ */
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Your Orders</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading your orders...
          </Text>
        </View>
      </View>
    );
  }

  /* ------------------ ERROR STATE ------------------ */
  if (error) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Your Orders</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.errorContainer}>
          <Package size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            Failed to load orders
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ------------------ MAIN UI ------------------ */
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>
          Your Orders
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={64} color={colors.textMuted} />
            <Text
              style={[styles.emptyTitle, { color: colors.text }]}
            >
              No orders yet
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.textMuted }]}
            >
              Start ordering from your favorite restaurants
            </Text>
            <Pressable
              style={[styles.browseButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(customer)/home' as any)}
            >
              <Text style={styles.browseButtonText}>Browse Restaurants</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

/* ------------------ STYLES ------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  orderHeaderText: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderBody: {
    gap: 8,
  },
  orderItems: {
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  orderItemCount: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
