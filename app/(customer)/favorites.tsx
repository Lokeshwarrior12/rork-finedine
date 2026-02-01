import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Heart,
  Star,
  MapPin,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { restaurants } from '@/mocks/data';

export default function FavoritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, toggleFavorite } = useAuth();

  const favoriteRestaurants = restaurants.filter(r => user?.favorites.includes(r.id));

  const handleRemoveFavorite = async (id: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(id);
  };

  const navigateToRestaurant = (id: string) => {
    router.push(`/restaurant/${id}` as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>
          {favoriteRestaurants.length} saved restaurants
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {favoriteRestaurants.length > 0 ? (
          favoriteRestaurants.map((restaurant) => (
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
                  <Pressable
                    style={styles.favoriteButton}
                    onPress={() => handleRemoveFavorite(restaurant.id)}
                  >
                    <Heart size={20} color={Colors.error} fill={Colors.error} />
                  </Pressable>
                </View>

                <Text style={styles.cuisineType}>{restaurant.cuisineType} Cuisine</Text>

                <View style={styles.restaurantMeta}>
                  <View style={styles.ratingBadge}>
                    <Star size={14} color={Colors.rating} fill={Colors.rating} />
                    <Text style={styles.ratingText}>{restaurant.rating}</Text>
                    <Text style={styles.reviewCount}>({restaurant.reviewCount})</Text>
                  </View>
                  <View style={styles.metaDot} />
                  <Clock size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{restaurant.waitingTime}</Text>
                </View>

                <View style={styles.locationRow}>
                  <MapPin size={14} color={Colors.textSecondary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {restaurant.address}, {restaurant.city}
                  </Text>
                </View>

                <View style={styles.categoryTags}>
                  {restaurant.categories.slice(0, 2).map((category, index) => (
                    <View key={index} style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{category}</Text>
                    </View>
                  ))}
                </View>
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
              onPress={() => router.push('/(customer)/deals' as any)}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '500' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '500' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
