import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRestaurant, useMenuItems } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface MenuItemData {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}

interface CartItem {
  menuItem: MenuItemData;
  quantity: number;
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, toggleFavorite } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const { data: restaurant, isLoading: restaurantLoading, error: restaurantError } = useRestaurant(id);
  const { data: menuItems, isLoading: menuLoading } = useMenuItems(id);

  const isFavorite = user?.favorites?.includes(id || '') ?? false;
  const allMenuItems = (menuItems || []) as MenuItemData[];

  const categories = ['All', ...new Set(allMenuItems.map((item) => item.category || 'Other'))];

  const filteredItems = selectedCategory === 'All'
    ? allMenuItems
    : allMenuItems.filter((item) => item.category === selectedCategory);

  const addToCart = (menuItem: MenuItemData) => {
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

  const cartTotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleToggleFavorite = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (id) toggleFavorite(id);
  };

  if (restaurantLoading || menuLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading restaurant...</Text>
      </View>
    );
  }

  if (restaurantError || !restaurant) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Restaurant Not Found</Text>
        <Text style={styles.errorMessage}>
          {restaurantError instanceof Error ? restaurantError.message : 'Unable to load restaurant'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.headerImage}>
          {restaurant.images && restaurant.images.length > 0 ? (
            <Image source={{ uri: restaurant.images[0] }} style={styles.image} />
          ) : (
            <LinearGradient
              colors={['#E85D04', '#DC2F02']}
              style={styles.imagePlaceholder}
            />
          )}
          
          <TouchableOpacity
            style={[styles.headerButton, { top: insets.top + 10, left: 16 }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerButton, { top: insets.top + 10, right: 16 }]}
            onPress={handleToggleFavorite}
          >
            <Heart 
              size={24} 
              color={isFavorite ? Colors.primary : '#fff'} 
              fill={isFavorite ? Colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={16} color="#FFB800" fill="#FFB800" />
              <Text style={styles.statText}>{(restaurant.rating ?? 0).toFixed(1)}</Text>
              <Text style={styles.statSubtext}>({restaurant.reviewCount ?? 0})</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statText}>{restaurant.cuisineType}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Clock size={16} color="#666" />
              <Text style={styles.statText}>{restaurant.waitingTime || '15-30'}</Text>
              <Text style={styles.statSubtext}>min</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={16} color="#666" />
            <Text style={styles.detailText}>{restaurant.address}</Text>
          </View>

          {restaurant.phone && (
            <View style={styles.detailRow}>
              <Phone size={16} color="#666" />
              <Text style={styles.detailText}>{restaurant.phone}</Text>
            </View>
          )}

          {restaurant.description && (
            <Text style={styles.description}>{restaurant.description}</Text>
          )}
        </View>

        {allMenuItems.length > 0 && (
          <>
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
                    selectedCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.menuSection}>
              <Text style={styles.menuTitle}>Menu</Text>
              {filteredItems.length === 0 ? (
                <Text style={styles.emptyText}>No items in this category</Text>
              ) : (
                filteredItems.map((item) => {
                  const quantity = getItemQuantity(item.id);
                  return (
                    <View key={item.id} style={styles.menuItem}>
                      <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        {item.description && (
                          <Text style={styles.menuItemDescription} numberOfLines={2}>
                            {item.description}
                          </Text>
                        )}
                        <View style={styles.menuItemFooter}>
                          <Text style={styles.menuItemPrice}>${(item.price ?? 0).toFixed(2)}</Text>
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
                          </View>
                        </View>
                      </View>

                      {item.image && (
                        <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                      )}

                      {item.isAvailable !== false ? (
                        quantity > 0 ? (
                          <View style={styles.quantityControl}>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => removeFromCart(item.id)}
                            >
                              <Minus size={16} color={Colors.primary} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{quantity}</Text>
                            <TouchableOpacity
                              style={styles.quantityButton}
                              onPress={() => addToCart(item)}
                            >
                              <Plus size={16} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => addToCart(item)}
                          >
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
                })
              )}
            </View>
          </>
        )}

        {allMenuItems.length === 0 && (
          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>Menu</Text>
            <Text style={styles.emptyText}>No menu items available yet</Text>
          </View>
        )}
      </ScrollView>

      {cartItemCount > 0 && (
        <View style={[styles.cartFooter, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartItemCount}>{cartItemCount} items</Text>
            <Text style={styles.cartTotal}>${cartTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.viewCartButton} onPress={() => {
            router.push({
              pathname: '/(customer)/checkout' as any,
              params: { 
                restaurantId: id,
                cartData: JSON.stringify(cart),
              },
            });
          }}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <ShoppingCart size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
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
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerImage: {
    width: '100%',
    height: 250,
    position: 'relative' as const,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  headerButton: {
    position: 'absolute' as const,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#ddd',
    marginHorizontal: 12,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
  },
  categoriesScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  menuSection: {
    padding: 16,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
    marginTop: 24,
  },
  menuItem: {
    flexDirection: 'row' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative' as const,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  menuItemFooter: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  menuItemBadges: {
    flexDirection: 'row' as const,
    gap: 4,
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  addButton: {
    position: 'absolute' as const,
    right: 0,
    bottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quantityControl: {
    position: 'absolute' as const,
    right: 0,
    bottom: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginHorizontal: 12,
  },
  unavailableBadge: {
    position: 'absolute' as const,
    right: 0,
    bottom: 16,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unavailableText: {
    fontSize: 12,
    color: '#999',
  },
  cartFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cartInfo: {
    flex: 1,
  },
  cartItemCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cartTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
  },
  viewCartButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewCartText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
