import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Heart,
  Star,
  MapPin,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useFavoriteRestaurants } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { Restaurant } from '@/types';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, toggleFavorite } = useAuth();

  const favoriteIds = user?.favorites || [];

  const {
    data: favorites,
    isLoading,
    error,
    refetch,
  } = useFavoriteRestaurants(favoriteIds);

  const restaurantList = favorites || [];

  const handleRemoveFavorite = (restaurantId: string) => {
    toggleFavorite(restaurantId);
  };

  const renderFavoriteCard = ({ item }: { item: Restaurant }) => {
    return (
      <TouchableOpacity
        style={styles.favoriteCard}
        onPress={() => router.push(`/restaurant/${item.id}` as any)}
      >
        <View style={styles.imageContainer}>
          {item.images && item.images.length > 0 ? (
            <Image source={{ uri: item.images[0] }} style={styles.restaurantImage} />
          ) : (
            <LinearGradient
              colors={['#E85D04', '#DC2F02']}
              style={styles.imagePlaceholder}
            />
          )}
          
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveFavorite(item.id);
            }}
          >
            <Heart size={20} color={Colors.primary} fill={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.name}
          </Text>

          {item.cuisineType && (
            <View style={styles.cuisineContainer}>
              <View style={styles.cuisineTag}>
                <Text style={styles.cuisineText}>{item.cuisineType}</Text>
              </View>
            </View>
          )}

          <View style={styles.addressRow}>
            <MapPin size={14} color="#666" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={14} color="#FFB800" fill="#FFB800" />
              <Text style={styles.statText}>{(item.rating ?? 0).toFixed(1)}</Text>
              <Text style={styles.statSubtext}>({item.reviewCount ?? 0})</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Heart size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Please Login</Text>
        <Text style={styles.emptyMessage}>
          Login to view your favorite restaurants
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <Text style={styles.headerSubtitle}>
          {restaurantList.length} {restaurantList.length === 1 ? 'restaurant' : 'restaurants'}
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to Load Favorites</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Something went wrong'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : restaurantList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Heart size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Favorites Yet</Text>
          <Text style={styles.emptyMessage}>
            Start adding restaurants to your favorites
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/' as any)}
          >
            <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={restaurantList}
          keyExtractor={(item) => item.id}
          renderItem={renderFavoriteCard}
          numColumns={2}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between' as const,
  },
  favoriteCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative' as const,
    width: '100%',
    height: 120,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  cardContent: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 6,
  },
  cuisineContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
    marginBottom: 6,
  },
  cuisineTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cuisineText: {
    fontSize: 10,
    color: '#666',
  },
  addressRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 3,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#333',
  },
  statSubtext: {
    fontSize: 11,
    color: '#999',
  },
});
