import { useRestaurants } from '@/hooks/useApi';
import { Restaurant } from '@/types';
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
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { 
    data: restaurants, 
    isLoading, 
    error,
    refetch 
  } = useRestaurants();

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error ? error.message : 'Failed to load restaurants'}
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

  const restaurantList = restaurants || [];

  if (restaurantList.length === 0) {
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
        data={restaurantList}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }: { item: Restaurant }) => (
          <TouchableOpacity
            style={styles.restaurantCard}
            onPress={() => router.push(`/restaurant/${item.id}` as any)}
          >
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{item.name}</Text>
              
              {item.cuisineType && (
                <View style={styles.cuisineContainer}>
                  <View style={styles.cuisineTag}>
                    <Text style={styles.cuisineText}>{item.cuisineType}</Text>
                  </View>
                </View>
              )}
              
              <Text style={styles.restaurantAddress}>{item.address}</Text>
              
              <View style={styles.statsRow}>
                <Text style={styles.rating}>⭐ {(item.rating ?? 0).toFixed(1)}</Text>
                <Text style={styles.reviews}>
                  ({item.reviewCount ?? 0} reviews)
                </Text>
                {item.city && (
                  <Text style={styles.cityText}>{item.city}</Text>
                )}
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
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
    color: Colors.error,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
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
    fontWeight: 'bold' as const,
    color: '#333',
  },
  cuisineContainer: {
    flexDirection: 'row' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FF9500',
  },
  reviews: {
    fontSize: 14,
    color: '#999',
  },
  cityText: {
    marginLeft: 'auto' as const,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
});
