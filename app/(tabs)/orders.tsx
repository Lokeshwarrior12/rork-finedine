import { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { orderAPI } from '@/lib/api/client';
import { wsClient } from '@/lib/websocket';
import { auth } from '@/lib/supabase';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
    setupRealtimeUpdates();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderAPI.getAll();
      setOrders(response.data);
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

    // Listen for order updates
    wsClient.on('order_update', (payload: any) => {
      console.log('Order updated:', payload);
      
      // Update specific order in list
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
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.order_number}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Total: ${item.total}</Text>
          </View>
        )}
      />
    </View>
  );
}
