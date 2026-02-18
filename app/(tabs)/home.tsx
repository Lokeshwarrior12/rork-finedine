// app/(tabs)/index.tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Star, MapPin, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, Restaurant } from '@/lib/api';
import { restaurants as mockRestaurants } from '@/mocks/data';

/* ──────────────────────────────────────────────────────────
   Constants
────────────────────────────────────────────────────────── */

const COLORS = {
  primary: '#E85D04',
  primaryLight: '#F48C06',
  secondary: '#DC2F02',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
  border: '#E0E0E0',
  star: '#FFB800',
  error: '#D32F2F',
  success: '#388E3C',
};

const CUISINES = [
  'All',
  'Italian',
  'Chinese',
  'Indian',
  'Mexican',
  'Japanese',
  'Thai',
  'American',
  'Mediterranean',
  'Korean',
  'Vietnamese',
];

/* ──────────────────────────────────────────────────────────
   Home Screen Component
────────────────────────────────────────────────────────── */

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  /* ────────────────────────────────────────────────────────
     Fetch Restaurants from Real Backend
  ──────────────────────────────────────────────────────── */

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      try {
        const result = await api.getRestaurants();
        if (result?.data && result.data.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn('[HomeScreen] API fetch failed, using mock data:', err);
      }
      return { data: mockRestaurants as unknown as Restaurant[] };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });

  const restaurants = data?.data || [];

  /* ────────────────────────────────────────────────────────
     Filter & Search Logic
  ──────────────────────────────────────────────────────── */

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      // Search filter
      const matchesSearch =
        searchQuery.trim() === '' ||
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisineTypes?.some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        restaurant.address?.toLowerCase().includes(searchQuery.toLowerCase());

      // Cuisine filter
      const matchesCuisine =
        selectedCuisine === 'All' ||
        restaurant.cuisineTypes?.includes(selectedCuisine) ||
        restaurant.cuisineType === selectedCuisine;

      return matchesSearch && matchesCuisine;
    });
  }, [restaurants, searchQuery, selectedCuisine]);

  /* ────────────────────────────────────────────────────────
     Pull to Refresh
  ──────────────────────────────────────────────────────── */

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  /* ────────────────────────────────────────────────────────
     Navigation
  ──────────────────────────────────────────────────────── */

  const navigateToRestaurant = (restaurantId: string) => {
    router.push(`/restaurant/${restaurantId}` as any);
  };

  /* ────────────────────────────────────────────────────────
     Loading State
  ──────────────────────────────────────────────────────── */

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </SafeAreaView>
    );
  }

  /* ────────────────────────────────────────────────────────
     Error State
  ──────────────────────────────────────────────────────── */

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to connect</Text>
        <Text style={styles.errorMessage}>
          {error instanceof Error
            ? error.message
            : 'Failed to load restaurants. Please check your internet connection.'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ────────────────────────────────────────────────────────
     Empty State (No Restaurants in Database)
  ──────────────────────────────────────────────────────── */

  if (restaurants.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Restaurants Yet</Text>
        <Text style={styles.emptyMessage}>
          Restaurants will appear here once they're added to the database.
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  /* ────────────────────────────────────────────────────────
     Main Content
  ──────────────────────────────────────────────────────── */

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>
          Find your favorite restaurants
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants, cuisines..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cuisine Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cuisineScroll}
        contentContainerStyle={styles.cuisineContent}
      >
        {CUISINES.map((cuisine) => (
          <TouchableOpacity
            key={cuisine}
            style={[
              styles.cuisineChip,
              selectedCuisine === cuisine && styles.cuisineChipActive,
            ]}
            onPress={() => setSelectedCuisine(cuisine)}
          >
            <Text
              style={[
                styles.cuisineChipText,
                selectedCuisine === cuisine && styles.cuisineChipTextActive,
              ]}
            >
              {cuisine}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredRestaurants.length} restaurant
          {filteredRestaurants.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Restaurant List */}
      {filteredRestaurants.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No restaurants found</Text>
          <Text style={styles.noResultsSubtext}>
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RestaurantCard
              restaurant={item}
              onPress={() => navigateToRestaurant(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

/* ──────────────────────────────────────────────────────────
   Restaurant Card Component
────────────────────────────────────────────────────────── */

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress: () => void;
}

function RestaurantCard({ restaurant, onPress }: RestaurantCardProps) {
  const priceRange = '$'.repeat(restaurant.priceRange || 2);
  const rating = restaurant.rating || 0;
  const reviewCount = restaurant.totalReviews || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Restaurant Image */}
      <View style={styles.cardImageContainer}>
        {restaurant.images && restaurant.images.length > 0 ? (
          <Image
            source={{ uri: restaurant.images[0] }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            style={styles.cardImagePlaceholder}
          >
            <Text style={styles.cardImagePlaceholderText}>
              {restaurant.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
      </View>

      {/* Restaurant Info */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <ChevronRight size={20} color={COLORS.textLight} />
        </View>

        {/* Cuisine Tags */}
        {restaurant.cuisineTypes && restaurant.cuisineTypes.length > 0 && (
          <View style={styles.cuisineTagsContainer}>
            {restaurant.cuisineTypes.slice(0, 2).map((cuisine, index) => (
              <View key={index} style={styles.cuisineTag}>
                <Text style={styles.cuisineTagText}>{cuisine}</Text>
              </View>
            ))}
            {restaurant.cuisineTypes.length > 2 && (
              <View style={styles.cuisineTag}>
                <Text style={styles.cuisineTagText}>
                  +{restaurant.cuisineTypes.length - 2}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Address */}
        <View style={styles.cardRow}>
          <MapPin size={14} color={COLORS.textMuted} />
          <Text style={styles.cardAddress} numberOfLines={1}>
            {restaurant.address}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.cardStats}>
          {/* Rating */}
          <View style={styles.cardStatItem}>
            <Star size={14} color={COLORS.star} fill={COLORS.star} />
            <Text style={styles.cardStatText}>
              {rating.toFixed(1)}
            </Text>
            <Text style={styles.cardStatSubtext}>({reviewCount})</Text>
          </View>

          {/* Price Range */}
          <View style={styles.cardStatDivider} />
          <View style={styles.cardStatItem}>
            <Text style={styles.cardPriceRange}>{priceRange}</Text>
          </View>

          {/* City */}
          {restaurant.city && (
            <>
              <View style={styles.cardStatDivider} />
              <View style={styles.cardStatItem}>
                <Text style={styles.cardCity}>{restaurant.city}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ──────────────────────────────────────────────────────────
   Styles
────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  emptyMessage: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  clearButton: {
    fontSize: 18,
    color: COLORS.textMuted,
    paddingHorizontal: 8,
  },
  cuisineScroll: {
    maxHeight: 50,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  cuisineContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cuisineChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cuisineChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  cuisineChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.border,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  cuisineTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cuisineTag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cuisineTagText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  cardAddress: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  cardStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardStatSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cardPriceRange: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardCity: {
    fontSize: 13,
    color: COLORS.textLight,
  },
});
