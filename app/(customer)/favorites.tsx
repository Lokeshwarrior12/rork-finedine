import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Star, MapPin, Clock, ChevronRight } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { api } from '@/lib/api';

interface Restaurant {
  id: string;
  name: string;
  images: string[];
  cuisineType: string;
  cuisineTypes?: string[];
  rating: number;
  reviewCount: number;
  totalReviews?: number;
  waitingTime: string;
  address: string;
  city: string;
  categories: string[];
  priceRange: number;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* ---------------- FETCH FAVORITES FROM REAL API ---------------- */
  const {
    data: favoritesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return api.getFavorites();
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  // Add type casting:
const favoriteRestaurants = (favoritesData?.data || []) as Restaurant[];
// Replace Colors.textMuted → Colors.textSecondary
  const favoriteRestaurants = favoritesData?.data || [];

  /* ---------------- REMOVE FAVORITE MUTATION ---------------- */
  const removeFavoriteMutation = useMutation({
    mutationFn: (restaurantId: string) => api.removeFavorite(restaurantId),
    onMutate: async (restaurantId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
      const previousFavorites = queryClient.getQueryData(['favorites', user?.id]);

      queryClient.setQueryData(['favorites', user?.id], (old: any) => ({
        ...old,
        data: old?.data?.filter((r: Restaurant) => r.id !== restaurantId) || [],
      }));

      return { previousFavorites };
    },
    onError: (err, restaurantId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
      }
      Alert.alert('Error', 'Failed to remove favorite');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
    },
  });

  /* ---------------- HANDLERS ---------------- */
  const handleRemoveFavorite = async (id: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    removeFavoriteMutation.mutate(id);
  };

  const navigateToRestaurant = (id: string) => {
    router.push(`/(customer)/restaurant/${id}` as any);
  };

  /* ---------------- LOADING STATE ---------------- */
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </View>
    );
  }

  /* ---------------- ERROR STATE ---------------- */
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.subtitle}>Error loading favorites</Text>
        </View>
        <View style={styles.errorContainer}>
          <Heart size={48} color={Colors.error} />
          <Text style={styles.errorText}>Failed to load favorites</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>{favoriteRestaurants.length} saved restaurants</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        {favoriteRestaurants.length > 0 ? (
          favoriteRestaurants.map((restaurant: Restaurant) => (
            <Pressable
              key={restaurant.id}
              style={styles.restaurantCard}
              onPress={() => navigateToRestaurant(restaurant.id)}
            >
              <Image
                source={{ uri: restaurant.images[0] }}
                style={styles.restaurantImage}
                contentFit="cover"
              />
              <View style={styles.restaurantContent}>
                <View style={styles.restaurantHeader}>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Pressable style={styles.favoriteButton} onPress={() => handleRemoveFavorite(restaurant.id)}>
                    <Heart size={20} color={Colors.error} fill={Colors.error} />
                  </Pressable>
                </View>

                <Text style={styles.cuisineType}>
                  {restaurant.cuisineType || restaurant.cuisineTypes?.[0] || 'Cuisine'}
                </Text>

                <View style={styles.restaurantMeta}>
                  <View style={styles.ratingBadge}>
                    <Star size={14} color={Colors.rating} fill={Colors.rating} />
                    <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    <Text style={styles.reviewCount}>
                      ({restaurant.reviewCount || restaurant.totalReviews || 0})
                    </Text>
                  </View>
                  <View style={styles.metaDot} />
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{restaurant.waitingTime || '30-40 min'}</Text>
                </View>

                <View style={styles.locationRow}>
                  <MapPin size={14} color={Colors.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {restaurant.address}, {restaurant.city}
                  </Text>
                </View>

                {restaurant.categories && restaurant.categories.length > 0 && (
                  <View style={styles.categoryTags}>
                    {restaurant.categories.slice(0, 2).map((category, index) => (
                      <View key={index} style={styles.categoryTag}>
                        <Text style={styles.categoryTagText}>{category}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <ChevronRight size={20} color={Colors.textLight} style={styles.chevron} />
            </Pressable>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Heart size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptyText}>
              Tap the heart icon on any restaurant to add it to your favorites
            </Text>
            <Pressable
              style={styles.exploreButton}
              onPress={() => router.push('/(customer)/home' as Href)}
            >
              <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  restaurantCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  restaurantImage: {
    width: '100%',
    height: 140,
  },
  restaurantContent: {
    padding: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  cuisineType: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 10,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textLight,
    marginHorizontal: 10,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  categoryTags: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chevron: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  exploreButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});
