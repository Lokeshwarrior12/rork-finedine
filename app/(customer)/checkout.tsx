// app/(customer)/checkout.tsx
// Checkout & Order Placement Screen with Real Backend Integration

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Clock,
  Check,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, CreateOrderRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/* ──────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────── */

const Colors = {
  primary: '#F97316',
  success: '#4CAF50',
  error: '#FF3B30',
  text: '#333',
  textSecondary: '#666',
  background: '#fff',
  surface: '#f9f9f9',
  border: '#f0f0f0',
};

/* ──────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */

interface CartItem {
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { restaurantId, cartData } = useLocalSearchParams<{
    restaurantId: string;
    cartData: string;
  }>();

  // Parse cart data
  const cart: CartItem[] = cartData ? JSON.parse(cartData) : [];

  // Local state
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  /* ────────────────────────────────────────────────────────
     Authentication Check
  ──────────────────────────────────────────────────────── */

  useEffect(() => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to place an order',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
          {
            text: 'Login',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    }
  }, [user]);

  /* ────────────────────────────────────────────────────────
     Data Fetching
  ──────────────────────────────────────────────────────── */

  // Fetch restaurant details
  const { data: restaurantData, isLoading: restaurantLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.getRestaurant(restaurantId!),
    enabled: !!restaurantId,
  });

  // Fetch user profile for default address
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getUserProfile(),
    enabled: !!user,
  });

  // Pre-fill address from profile
  useEffect(() => {
    if (profileData?.data?.address && !deliveryAddress) {
      setDeliveryAddress(profileData.data.address);
    }
  }, [profileData]);

  /* ────────────────────────────────────────────────────────
     Order Creation Mutation
  ──────────────────────────────────────────────────────── */

  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderRequest) => api.createOrder(orderData),
    onSuccess: (response) => {
      console.log('✅ Order created:', response.data.id);
      
      // Invalidate orders cache
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });

      // Navigate to order tracking
      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully.',
        [
          {
            text: 'View Order',
            onPress: () => router.replace(`/(customer)/order/${response.data.id}`),
          },
        ]
      );
    },
    onError: (error: any) => {
      console.error('❌ Order creation failed:', error);
      Alert.alert(
        'Order Failed',
        error.message || 'Failed to place order. Please try again.'
      );
    },
  });

  const restaurant = restaurantData?.data;

  /* ────────────────────────────────────────────────────────
     Order Calculations
  ──────────────────────────────────────────────────────── */

  const subtotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const deliveryFee = 5.0;
  const total = subtotal + tax + deliveryFee;

  /* ────────────────────────────────────────────────────────
     Order Submission
  ──────────────────────────────────────────────────────── */

  const handlePlaceOrder = () => {
    // Validation
    if (!deliveryAddress.trim()) {
      Alert.alert('Missing Address', 'Please enter a delivery address.');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    if (!restaurantId) {
      Alert.alert('Error', 'Restaurant information is missing.');
      return;
    }

    // Prepare order data
    const orderData: CreateOrderRequest = {
      restaurantId: restaurantId,
      items: cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
      })),
      deliveryAddress: deliveryAddress.trim(),
      notes: notes.trim() || undefined,
    };

    console.log('📦 Placing order:', orderData);

    // Submit order
    createOrderMutation.mutate(orderData);
  };

  /* ────────────────────────────────────────────────────────
     Loading State
  ──────────────────────────────────────────────────────── */

  if (restaurantLoading || profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Info */}
        {restaurant && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ordering From</Text>
            <View style={styles.restaurantCard}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
              <View style={styles.estimatedTime}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.estimatedTimeText}>30-45 min</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.orderItemQuantity}>
                <Text style={styles.orderItemQuantityText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
              <Text style={styles.orderItemPrice}>
                ${(item.menuItem.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter delivery address"
              placeholderTextColor="#999"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Order Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any special instructions for the restaurant..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('card')}
          >
            <View style={styles.paymentOptionLeft}>
              <CreditCard size={20} color={Colors.textSecondary} />
              <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
            </View>
            {paymentMethod === 'card' && (
              <Check size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cash' && styles.paymentOptionActive,
            ]}
            onPress={() => setPaymentMethod('cash')}
          >
            <View style={styles.paymentOptionLeft}>
              <Text style={styles.cashIcon}>💵</Text>
              <Text style={styles.paymentOptionText}>Cash on Delivery</Text>
            </View>
            {paymentMethod === 'cash' && (
              <Check size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax (10%)</Text>
            <Text style={styles.billValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>Total</Text>
            <Text style={styles.billTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            createOrderMutation.isPending && styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order</Text>
              <Text style={styles.placeOrderTotal}>${total.toFixed(2)}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estimatedTimeText: {
    fontSize: 13,
    color: Colors.textSecondary,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    minHeight: 40,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#fff5f0',
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  cashIcon: {
    fontSize: 20,
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
    backgroundColor: Colors.border,
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  placeOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  placeOrderButtonDisabled: {
    opacity: 0.6,
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  placeOrderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
