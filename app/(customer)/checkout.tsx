// app/(customer)/checkout.tsx
// Checkout & Order Placement Screen

import React, { useState } from 'react';
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

import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface CartItem {
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { restaurantId, cartData } = useLocalSearchParams<{
    restaurantId: string;
    cartData: string;
  }>();

  const cart: CartItem[] = cartData ? JSON.parse(cartData) : [];

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  // Fetch restaurant details
  const { data: restaurantData } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.getRestaurant(restaurantId!),
    enabled: !!restaurantId,
  });

  // Fetch user profile for default address
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getUserProfile(),
    enabled: !!user,
    onSuccess: (data) => {
      if (data.data.address && !deliveryAddress) {
        setDeliveryAddress(data.data.address);
      }
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => api.createOrder(orderData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
      Alert.alert(
        'Order Failed',
        error.message || 'Failed to place order. Please try again.'
      );
    },
  });

  const restaurant = restaurantData?.data;

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const deliveryFee = 5.0;
  const total = subtotal + tax + deliveryFee;

  const handlePlaceOrder = () => {
    if (!deliveryAddress.trim()) {
      Alert.alert('Missing Address', 'Please enter a delivery address.');
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty.');
      return;
    }

    // Prepare order data
    const orderData = {
      restaurantId: restaurantId!,
      items: cart.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
      })),
      deliveryAddress: deliveryAddress.trim(),
      notes: notes.trim(),
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Restaurant Info */}
        {restaurant && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ordering From</Text>
            <View style={styles.restaurantCard}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantAddress}>{restaurant.address}</Text>
              <View style={styles.estimatedTime}>
                <Clock size={14} color="#666" />
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
            <MapPin size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter delivery address"
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
              <CreditCard size={20} color="#666" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
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
    color: '#333',
    marginBottom: 12,
  },
  restaurantCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  restaurantAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  estimatedTimeText: {
    fontSize: 13,
    color: '#666',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemQuantity: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderItemQuantityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    minHeight: 40,
  },
  notesInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    minHeight: 80,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
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
    color: '#333',
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
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
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
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
