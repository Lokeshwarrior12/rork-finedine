import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export default function DiscoveryScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => apiFetch('/restaurants'),
  });

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Discover Restaurants</Text>
      <FlatList
        data={data?.data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 8 }}>
            <Text style={{ fontSize: 18 }}>{item.name}</Text>
            <Text>{item.address}</Text>
          </View>
        )}
      />
    </View>
  );
}
