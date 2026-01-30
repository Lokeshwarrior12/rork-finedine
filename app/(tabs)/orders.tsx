import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { orderAPI } from '@/lib/api/client';
import { wsClient } from '@/lib/websocket';
import { auth } from '@/lib/supabase';

interface OrderItem {
  id: string;
  order_number?: string;
  status: string;
  total: number;
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    setupRealtimeUpdates();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderAPI.getAll() as { data?: OrderItem[] } | OrderItem[];
      const data = Array.isArray(response) ? response : (response?.data || []);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = async () => {
    const user = await auth.getUser();
    if (!user) return;

    // Connect WebSocket
    wsClient.connect(user.id, 'client-' + Date.now());

    wsClient.on('order_update', (payload: { order_id: string; status: string }) => {
      console.log('Order updated:', payload);
      
      setOrders(prev => prev.map(order => 
        order.id === payload.order_id 
          ? { ...order, status: payload.status }
          : order
      ));
    });

    // Cleanup on unmount
    return () => {
      wsClient.disconnect();
    };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.orderNumber}>{item.order_number || `Order #${item.id.slice(0, 8)}`}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            <Text style={styles.total}>Total: ${item.total?.toFixed(2) || '0.00'}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No orders found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  orderCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  total: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
