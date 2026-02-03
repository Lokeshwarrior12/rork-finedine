import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '@/lib/api/client';
import { subscribeToOrder } from '@/lib/websocket';
import { useTheme } from '@/contexts/ThemeContext';
import { useOrderSubscription } from '@/hooks/useOrderSubscription';
import { ArrowLeft, Package, Clock } from 'lucide-react-native';
import { Order } from '@/types';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId;
  const [trackedStatus, setTrackedStatus] = useState<string>('pending');

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => apiFetch('/api/v1/orders'),
  });

  useOrderSubscription({
    onUpdate: (payload) => {
      console.log('[Orders] Real-time update:', payload);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  useEffect(() => {
    if (orderId) {
      const unsubscribe = subscribeToOrder(orderId, setTrackedStatus);
      return () => unsubscribe();
    }
  }, [orderId]);

  const { mutate: createOrder, isPending } = useMutation({
    mutationFn: (items: { menu_item_id: string; qty: number }[]) =>
      apiFetch('/api/v1/orders', 'POST', { items }),
    onSuccess: (data) => {
      console.log('Order created:', data);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleCreateSampleOrder = () => {
    createOrder([{ menu_item_id: '1', qty: 2 }]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'preparing': return colors.warning;
      case 'pending': return colors.textMuted;
      default: return colors.primary;
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: colors.text }]}>Order #{item.id.slice(0, 8)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={[styles.orderTotal, { color: colors.textSecondary }]}>
        ${item.total?.toFixed(2) || '0.00'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Your Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {orderId && (
        <View style={[styles.trackingCard, { backgroundColor: colors.primaryLight }]}>
          <Clock size={20} color={colors.primary} />
          <Text style={[styles.trackingText, { color: colors.primary }]}>
            Tracking Order: {trackedStatus}
          </Text>
        </View>
      )}

      <Pressable
        style={[styles.createButton, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
        onPress={handleCreateSampleOrder}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Place Sample Order</Text>
        )}
      </Pressable>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders || []}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No orders yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

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
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  trackingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  createButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  orderTotal: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
