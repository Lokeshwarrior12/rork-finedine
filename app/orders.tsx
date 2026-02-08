import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Package } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { useOrders } from '@/hooks/useApi';
import { useOrderSubscription } from '@/hooks/useOrderSubscription';
import { api } from '@/lib/api';

type OrderItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  /* ------------------ ORDERS LIST ------------------ */
  const { data: orders, isLoading } = useOrders();

  useOrderSubscription({
    onUpdate: (payload) => {
      console.log('[Orders] Real-time update:', payload);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  /* ------------------ SAMPLE CART ------------------ */
  const [cart] = useState<OrderItem[]>([
    { menuItemId: '123', name: 'Pizza', quantity: 1, price: 12.99 },
  ]);

  /* ------------------ CREATE ORDER ------------------ */
  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => api.createOrder(orderData),
    onSuccess: (response) => {
      Alert.alert('Success', 'Order placed successfully!');
      console.log('Order ID:', response.data.id);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Something went wrong');
    },
  });

  const handleCreateOrder = () => {
    createOrderMutation.mutate({
      restaurantId: 'rest-123',
      items: cart,
      subtotal: cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      total: cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      orderType: 'pickup',
      notes: 'Extra napkins please',
    });
  };

  /* ------------------ HELPERS ------------------ */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'preparing':
        return colors.warning;
      case 'pending':
        return colors.textMuted;
      default:
        return colors.primary;
    }
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View
      style={[
        styles.orderCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: colors.text }]}>
          Order #{(item.id || '').slice(0, 8)}
        </Text>

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
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={[styles.orderTotal, { color: colors.textSecondary }]}>
        ${(item.total ?? 0).toFixed(2)}
      </Text>
    </View>
  );

  /* ------------------ UI ------------------ */
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

      {/* Create Order Button */}
      <Pressable
        style={[
          styles.createButton,
          {
            backgroundColor: colors.primary,
            opacity: createOrderMutation.isPending ? 0.7 : 1,
          },
        ]}
        onPress={handleCreateOrder}
        disabled={createOrderMutation.isPending}
      >
        {createOrderMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Place Order</Text>
        )}
      </Pressable>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={(orders as any[]) || []}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={colors.textMuted} />
              <Text
                style={[styles.emptyText, { color: colors.textMuted }]}
              >
                No orders yet
              </Text>
            </View>
          }
        />
      )}
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
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
