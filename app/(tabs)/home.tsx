import { api, Restaurant } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => api.getRestaurants(),
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading restaurants</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data?.data || []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
          <Text>{item.address}</Text>
          <Text>Rating: {item.rating} ⭐</Text>
        </View>
      )}
    />
  );
}
