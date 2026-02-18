import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  XCircle,
  Package,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOrders } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

type OrderFilter = 'all' | 'active' | 'completed' | 'cancelled';

interface OrderData {
  id: string;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
  total: number;
  [key: string]: unknown;
}

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [filter, setFilter] = useState<OrderFilter>('all');

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useOrders();

  const orders = (ordersData || []) as OrderData[];

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active')
      return ['pending', 'accepted', 'preparing', 'ready'].includes(order.status);
    if (filter === 'completed') return order.status === 'completed';
    if (filter === 'cancelled') return order.status === 'cancelled' || order.status === 'rejected';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'accepted':
      case 'preparing':
        return '#2196F3';
      case 'ready':
        return '#9C27B0';
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
      case 'rejected':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'cancelled':
      case 'rejected':
        return XCircle;
      default:
        return Package;
    }
  };

  const renderOrderCard = ({ item }: { item: OrderData }) => {
    const StatusIcon = getStatusIcon(item.status);
    const statusColor = getStatusColor(item.status);
    const itemsList = Array.isArray(item.items) ? item.items : [];

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/(customer)/order/${item.id}` as any)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusIcon, { backgroundColor: statusColor + '20' }]}>
              <StatusIcon size={20} color={statusColor} />
            </View>
            <View>
              <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
              <Text style={styles.orderDate}>
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#ccc" />
        </View>

        <View style={styles.orderBody}>
          <Text style={styles.orderItems} numberOfLines={2}>
            {itemsList.map((i) => `${i.quantity}x ${i.name}`).join(', ') || 'No items'}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          <Text style={styles.orderTotal}>${(item.total ?? 0).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Please Login</Text>
        <Text style={styles.emptyMessage}>Login to view your orders</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login' as any)}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed', 'cancelled'] as OrderFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === f && styles.filterTabTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to Load Orders</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Something went wrong'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptyMessage}>
            {filter === 'all'
              ? 'Start ordering from your favorite restaurants'
              : `No ${filter} orders found`}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/' as any)}
            >
              <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderId: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderBody: {
    marginBottom: 12,
  },
  orderItems: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },
});
