import { View, Text, Button } from 'react-native';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { subscribeToOrder } from '@/lib/websocket'; // From earlier plan

export default function OrdersScreen({ route }) {
  const orderId = route.params?.orderId; // For tracking specific order
  const [status, setStatus] = useState('pending');

  const { mutate: createOrder } = useMutation({
    mutationFn: (items) => apiFetch('/orders', 'POST', { items }),
    onSuccess: (data) => console.log('Order created:', data),
  });

  useEffect(() => {
    if (orderId) {
      subscribeToOrder(orderId, setStatus); // Real-time update
    }
  }, [orderId]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24 }}>Your Orders</Text>
      <Button title="Place Sample Order" onPress={() => createOrder([{ menu_item_id: '1', qty: 2 }])} />
      {orderId && <Text>Status: {status}</Text>}
    </View>
  );
}
