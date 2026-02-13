// app/(customer)/restaurant/[id].tsx

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Heart,
  Phone,
  Plus,
  Minus,
  ShoppingCart,
  Mail,
} from 'lucide-react-native';

import { api, MenuItem as MenuItemType } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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

/* ──────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────── */

interface CartItem {
  menuItem: MenuItemType;
  quantity: number;
}

/* ──────────────────────────────────────────────────────────
   Restaurant Detail Screen
────────────────────────────────────────────────────────── */

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, toggleFavorite } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  /* ────────────────────────────────────────────────────────
     Fetch Restaurant Data
  ──────────────────────────────────────────────────────── */

  const {
    data: restaurantData,
    isLoading: restaurantLoading,
    error: restaurantError,
  } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => api.getRestaurant(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const restaurant = restaurantData?.data;

  /* ────────────────────────────────────────────────────────
     Fetch Menu Items
  ──────────────────────────────────────────────────────── */

  const {
    data: menuData,
    isLoading: menuLoading,
  } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => api.getRestaurantMenu(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  const menuItems = menuData?.data || [];

  /* ────────────────────────────────────────────────────────
     Fetch User Favorites
  ──────────────────────────────────────────────────────── */

  const {
    data: favoritesData,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.getFavorites(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const favorites = favoritesData?.data || [];
  const isFavorite = favorites.some((fav) => fav.restaurantId === id);

  /* ────────────────────────────────────────────────────────
     Menu Categories
  ──────────────────────────────────────────────────────── */

  const categories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return ['All', ...Array.from(cats)];
  }, [menuItems]);

  /* ────────────────────────────────────────────────────────
     Filtered Menu Items
  ──────────────────────────────────────────────────────── */

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return menuItems;
    return menuItems.filter((item) => item.category === selectedCategory);
  }, [menuItems, selectedCategory]);

  /* ────────────────────────────────────────────────────────
     Cart Functions
  ──────────────────────────────────────────────────────── */

  const addToCart = (menuItem: MenuItemType) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
      return prev.filter((item) => item.menuItem.id !== menuItemId);
    });
  };

  const getItemQuantity = (menuItemId: string) => {
    return cart.find((item) => item.menuItem.id === menuItemId)?.quantity || 0;
  };

  /* ────────────────────────────────────────────────────────
     Cart Totals
  ──────────────────────────────────────────────────────── */

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.menuItem.price * item.quantity,
      0
    );
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  /* ────────────────────────────────────────────────────────
     Favorite Toggle
  ──────────────────────────────────────────────────────── */

  const handleToggleFavorite = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add favorites', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login' as any) },
      ]);
      return;
    }

    if (id) {
      try {
        await toggleFavorite(id);
      } catch (error) {
        Alert.alert('Error', 'Failed to update favorites');
      }
    }
  };

  /* ────────────────────────────────────────────────────────
     Navigate to Checkout
  ──────────────────────────────────────────────────────── */

  const navigateToCheckout = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to place an order', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login' as any) },
      ]);
      return;
    }

    router.push({
      pathname: '/(customer)/checkout' as any,
      params: {
        restaurantId: id,
        cartData: JSON.stringify(cart),
      },
    });
  };

  /* ────────────────────────────────────────────────────────
     Loading State
  ──────────────────────────────────────────────────────── */

  if (restaurantLoading || menuLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  /* ────────────────────────────────────────────────────────
     Error State
  ──────────────────────────────────────────────────────── */

  if (restaurantError || !restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Restaurant Not Found</Text>
        <Text style={styles.errorMessage}>
          {restaurantError instanceof Error
            ? restaurantError.message
            : 'Unable to load restaurant details'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ────────────────────────────────────────────────────────
     Render
  ──────────────────────────────────────────────────────── */

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + (cartItemCount > 0 ? 100 : 20) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={styles.headerImage}>
          {restaurant.images && restaurant.images.length > 0 ? (
            <Image source={{ uri: restaurant.images[0] }} style={styles.image} />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.imagePlaceholder}
            >
              <Text style={styles.imagePlaceholderText}>
                {restaurant.name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={[styles.headerButton, { top: insets.top + 10, left: 16 }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          {/* Favorite Button */}
          <TouchableOpacity
            style={[styles.headerButton, { top: insets.top + 10, right: 16 }]}
            onPress={handleToggleFavorite}
          >
            <Heart
              size={24}
              color={isFavorite ? COLORS.primary : '#fff'}
              fill={isFavorite ? COLORS.primary : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={16} color={COLORS.star} fill={COLORS.star} />
              <Text style={styles.statText}>
                {(restaurant.rating ?? 0).toFixed(1)}
              </Text>
              <Text style={styles.statSubtext}>
                ({restaurant.totalReviews ?? 0})
              </Text>
            </View>

            <View style={styles.statDivider} />

            {restaurant.cuisineTypes && restaurant.cuisineTypes.length > 0 && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statText}>
                    {restaurant.cuisineTypes[0]}
                  </Text>
                </View>
                <View style={styles.statDivider} />
              </>
            )}

            <View style={styles.statItem}>
              <Clock size={16} color={COLORS.textLight} />
              <Text style={styles.statText}>15-30</Text>
              <Text style={styles.statSubtext}>min</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.detailRow}>
            <MapPin size={16} color={COLORS.textLight} />
            <Text style={styles.detailText}>{restaurant.address}</Text>
          </View>

          {/* Phone */}
          {restaurant.phone && (
            <View style={styles.detailRow}>
              <Phone size={16} color={COLORS.textLight} />
              <Text style={styles.detailText}>{restaurant.phone}</Text>
            </View>
          )}

          {/* Email */}
          {restaurant.email && (
            <View style={styles.detailRow}>
              <Mail size={16} color={COLORS.textLight} />
              <Text style={styles.detailText}>{restaurant.email}</Text>
            </View>
          )}

          {/* Description */}
          {restaurant.description && (
            <Text style={styles.description}>{restaurant.description}</Text>
          )}
        </View>

        {/* Menu Section */}
        {menuItems.length > 0 ? (
          <>
            {/* Category Filter */}
            {categories.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoriesScroll}
                contentContainerStyle={styles.categoriesContent}
              >
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category &&
                          styles.categoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Menu Items */}
            <View style={styles.menuSection}>
              <Text style={styles.menuTitle}>Menu</Text>
              {filteredItems.length === 0 ? (
                <Text style={styles.emptyText}>No items in this category</Text>
              ) : (
                filteredItems.map((item) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    quantity={getItemQuantity(item.id)}
                    onAdd={() => addToCart(item)}
                    onRemove={() => removeFromCart(item.id)}
                  />
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>Menu</Text>
            <Text style={styles.emptyText}>No menu items available</Text>
          </View>
        )}
      </ScrollView>

      {/* Cart Footer */}
      {cartItemCount > 0 && (
        <View style={[styles.cartFooter, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>
              {cartItemCount} item{cartItemCount !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.cartTotal}>${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.viewCartButton}
            onPress={navigateToCheckout}
          >
            <Text style={styles.viewCartText}>View Cart</Text>
            <ShoppingCart size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ──────────────────────────────────────────────────────────
   Menu Item Component
────────────────────────────────────────────────────────── */

interface MenuItemProps {
  item: MenuItemType;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

function MenuItem({ item, quantity, onAdd, onRemove }: MenuItemProps) {
  const isAvailable = item.isAvailable !== false;

  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemInfo}>
        <Text style={styles.menuItemName}>{item.name}</Text>

        {item.description && (
          <Text style={styles.menuItemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>

          <View style={styles.menuItemBadges}>
            {item.isVegetarian && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🌱</Text>
              </View>
            )}
            {item.isVegan && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>V</Text>
              </View>
            )}
            {item.isGlutenFree && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>GF</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {item.images && item.images.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.menuItemImage} />
      )}

      {isAvailable ? (
        quantity > 0 ? (
          <View style={styles.quantityControl}>
            <TouchableOpacity style={styles.quantityButton} onPress={onRemove}>
              <Minus size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity style={styles.quantityButton} onPress={onAdd}>
              <Plus size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        )
      ) : (
        <View style={styles.unavailableBadge}>
          <Text style={styles.unavailableText}>Unavailable</Text>
        </View>
      )}
    </View>
  );
}

/* ──────────────────────────────────────────────────────────
   Styles
────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surface,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerImage: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 64,
    fontWeight: '700',
    color: '#fff',
  },
  headerButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  restaurantName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  statSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
    marginTop: 12,
  },
  categoriesScroll: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textLight,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  menuSection: {
    padding: 20,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    position: 'relative',
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 16,
  },
  menuItemName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  menuItemDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 10,
  },
  menuItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuItemBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  menuItemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  addButton: {
    position: 'absolute',
    right: 0,
    bottom: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quantityControl: {
    position: 'absolute',
    right: 0,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 6,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 14,
  },
  unavailableBadge: {
    position: 'absolute',
    right: 0,
    bottom: 20,
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  unavailableText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  cartFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cartInfo: {
    flex: 1,
  },
  cartItemCount: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  cartTotal: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  viewCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
