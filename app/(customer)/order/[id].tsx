// app/(customer)/order/[id].tsx
// Order Tracking & Details Screen with Real-time Supabase Updates

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  Truck,
  Home,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, realtime } from '@/lib/supabase';

import { api, Order } from '@/lib/api';

/* ──────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────── */

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

const ORDER_STATUSES = [
  { key: 'pending', label: 'Order Placed', icon: CheckCircle },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready', label: 'Ready', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  /* ────────────────────────────────────────────────────────
     Data Fetching
  ──────────────────────────────────────────────────────── */

  const {
    data: orderData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id!),
    enabled: !!id,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  const order = orderData?.data;

  /* ────────────────────────────────────────────────────────
     Real-time Subscription
  ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!id) return;

    console.log('📡 Subscribing to order updates:', id);

    // Subscribe to order updates using Supabase Realtime
    const unsubscribe = realtime.subscribeToRow(
      'orders',
      id,
      (payload) => {
        console.log('🔔 Order updated in real-time:', payload);
        
        // Invalidate and refetch the order
        queryClient.invalidateQueries({ queryKey: ['order', id] });
      }
    );

    return () => {
      console.log('🔌 Unsubscribing from order updates');
      unsubscribe();
    };
  }, [id, queryClient]);

  /* ────────────────────────────────────────────────────────
     Helpers
  ──────────────────────────────────────────────────────── */

  const getStatusIndex = (status: string) => {
    return ORDER_STATUSES.findIndex((s) => s.key === status);
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled';

  /* ────────────────────────────────────────────────────────
     Loading State
  ──────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  /* ────────────────────────────────────────────────────────
     Error State
  ──────────────────────────────────────────────────────── */

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Package size={64} color={Colors.error} />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error 
            ? error.message 
            : 'Unable to load order details. Please try again.'}
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ────────────────────────────────────────────────────────
     Render
  ──────────────────────────────────────────────────────── */

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.backButtonIcon} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.slice(0, 8)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={false} 
            onRefresh={() => refetch()} 
            tintColor={Colors.primary}
          />
        }
      >
        {/* Order Status */}
        <View style={styles.section}>
          {isCancelled ? (
            <View style={styles.cancelledBanner}>
              <Text style={styles.cancelledText}>Order Cancelled</Text>
            </View>
          ) : (
            <>
              <Text style={styles.statusTitle}>
                {ORDER_STATUSES[currentStatusIndex]?.label || order.status}
              </Text>
              <Text style={styles.statusSubtitle}>
                {currentStatusIndex === ORDER_STATUSES.length - 1
                  ? 'Your order has been delivered!'
                  : 'We\'ll notify you when there\'s an update'}
              </Text>

              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                {ORDER_STATUSES.map((status, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const Icon = status.icon;

                  return (
                    <View key={status.key} style={styles.progressStep}>
                      {/* Connection Line */}
                      {index > 0 && (
                        <View
                          style={[
                            styles.progressLine,
                            isCompleted && styles.progressLineActive,
                          ]}
                        />
                      )}
                      
                      {/* Status Icon */}
                      <View
                        style={[
                          styles.progressIcon,
                          isCompleted && styles.progressIconActive,
                        ]}
                      >
                        <Icon
                          size={20}
                          color={isCompleted ? '#fff' : '#ccc'}
                        />
                      </View>
                      
                      {/* Status Label */}
                      <Text
                        style={[
                          styles.progressLabel,
                          isCompleted && styles.progressLabelActive,
                        ]}
                      >
                        {status.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MapPin size={18} color={Colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Delivery Address</Text>
                <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Clock size={18} color={Colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Order Time</Text>
                <Text style={styles.infoValue}>
                  {new Date(order.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {order.notes && (
              <View style={styles.infoRow}>
                <Package size={18} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Special Instructions</Text>
                  <Text style={styles.infoValue}>{order.notes}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.orderItemQuantity}>
                <Text style={styles.orderItemQuantityText}>
                  {item.quantity}x
                </Text>
              </View>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <Text style={styles.orderItemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>${order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax</Text>
              <Text style={styles.billValue}>${order.tax.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>${order.deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotalLabel}>Total</Text>
              <Text style={styles.billTotalValue}>${order.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment Status */}
          <View style={styles.paymentStatus}>
            <Text style={styles.paymentStatusLabel}>Payment Status:</Text>
            <View
              style={[
                styles.paymentStatusBadge,
                order.paymentStatus === 'paid' && styles.paymentStatusBadgePaid,
              ]}
            >
              <Text
                style={[
                  styles.paymentStatusText,
                  order.paymentStatus === 'paid' && styles.paymentStatusTextPaid,
                ]}
              >
                {(order.paymentStatus ?? 'pending').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>Need help with your order?</Text>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  cancelledBanner: {
    backgroundColor: '#FFE5E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelledText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  progressLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.border,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  progressIconActive: {
    backgroundColor: Colors.primary,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  progressLabelActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderItemQuantity: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderItemQuantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  billCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  billValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentStatusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFE5E5',
  },
  paymentStatusBadgePaid: {
    backgroundColor: '#E8F5E9',
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
  },
  paymentStatusTextPaid: {
    color: Colors.success,
  },
  helpSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  helpButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
