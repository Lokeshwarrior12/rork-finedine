// app/(tabs)/index.tsx
import { api, Restaurant } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => api.getRestaurants(),
    staleTime: 5 * 60 * 1000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>⚠️ Connection Error</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Failed to load restaurants'}
        </Text>
        <Text style={styles.errorHint}>
          Make sure your backend is running at localhost:8080
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => refetch()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const restaurants = data?.data || [];

  if (restaurants.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>No Restaurants Found</Text>
        <Text style={styles.emptyMessage}>
          Add some restaurants to the database!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Discover Restaurants</Text>
      
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.restaurantCard}
            onPress={() => router.push(`/restaurant/${item.id}` as any)}
          >
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{item.name}</Text>
              
              {item.cuisineTypes && item.cuisineTypes.length > 0 && (
                <View style={styles.cuisineContainer}>
                  {item.cuisineTypes.slice(0, 2).map((cuisine, index) => (
                    <View key={index} style={styles.cuisineTag}>
                      <Text style={styles.cuisineText}>{cuisine}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              <Text style={styles.restaurantAddress}>{item.address}</Text>
              
              <View style={styles.statsRow}>
                <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
                <Text style={styles.reviews}>
                  ({item.totalReviews} reviews)
                </Text>
                <View style={styles.priceRange}>
                  <Text style={styles.priceText}>
                    {'$'.repeat(item.priceRange)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  errorHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantInfo: {
    gap: 8,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cuisineContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  cuisineTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cuisineText: {
    fontSize: 12,
    color: '#666',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  reviews: {
    fontSize: 14,
    color: '#999',
  },
  priceRange: {
    marginLeft: 'auto',
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
