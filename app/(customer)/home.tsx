import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  MapPin,
  Clock,
  Star,
  Heart,
  ChevronRight,
  Bell,
  Percent,
  Building2,
  Wine,
  Coffee,
  UtensilsCrossed,
  Users,
  Crown,
  Sparkles,
  PartyPopper,
  TreePine,
  Wallet,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { restaurants, deals, cuisineTypes, serviceCategories } from '@/mocks/data';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function CustomerHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, toggleFavorite } = useAuth();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const hotDeals = deals.filter(d => d.isActive).slice(0, 5);
  const nearbyRestaurants = restaurants.slice(0, 6);
  const spotlightRestaurants = restaurants.slice(0, 3);

  const categoryIcons: Record<string, React.ReactNode> = {
    'Banquet Halls': <Building2 size={24} color={colors.secondary} />,
    'Party Halls': <PartyPopper size={24} color={colors.secondary} />,
    'Bars': <Wine size={24} color={colors.secondary} />,
    'Cafes': <Coffee size={24} color={colors.secondary} />,
    'Buffet': <UtensilsCrossed size={24} color={colors.secondary} />,
    'Family Friendly': <Users size={24} color={colors.secondary} />,
    'Rooftop': <TreePine size={24} color={colors.secondary} />,
    'Luxury Dining': <Crown size={24} color={colors.secondary} />,
  };

  const navigateToRestaurant = (id: string) => {
    router.push(`/restaurant/${id}` as any);
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good evening,</Text>
              <Text style={styles.userName}>{user?.name || 'Guest'} 👋</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable 
                style={styles.walletBadge}
                onPress={() => router.push('/(customer)/rewards')}
              >
                <Wallet size={16} color={colors.primary} />
                <Text style={styles.walletText}>{user?.points || 0}</Text>
              </Pressable>
              <Pressable 
                style={styles.notificationBtn}
                onPress={() => router.push('/(customer)/notifications')}
              >
                <Bell size={22} color={colors.text} />
                <View style={styles.notificationDot} />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.searchContainer}>
            <Search size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurant, area, vibe..."
              placeholderTextColor={colors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Pressable>
        </View>

        <View style={styles.cashbackBanner}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cashbackGradient}
          >
            <View style={styles.cashbackContent}>
              <View style={styles.cashbackLeft}>
                <Sparkles size={20} color="#FFD700" />
                <View style={styles.cashbackTextContainer}>
                  <Text style={styles.cashbackTitle}>10% Cashback</Text>
                  <Text style={styles.cashbackSubtitle}>on every dining bill</Text>
                </View>
              </View>
              <Pressable style={styles.cashbackBtn}>
                <Text style={styles.cashbackBtnText}>Know More</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In the spotlight</Text>
            <Pressable onPress={() => router.push('/(customer)/deals')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotlightScroll}
            decelerationRate="fast"
            snapToInterval={CARD_WIDTH + 16}
          >
            {spotlightRestaurants.map((restaurant, index) => (
              <Pressable
                key={restaurant.id}
                style={styles.spotlightCard}
                onPress={() => navigateToRestaurant(restaurant.id)}
              >
                <Image
                  source={{ uri: restaurant.images[0] }}
                  style={styles.spotlightImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.spotlightGradient}
                />
                <View style={styles.spotlightBadge}>
                  <Percent size={12} color="#fff" />
                  <Text style={styles.spotlightBadgeText}>Flat 50% OFF</Text>
                </View>
                <View style={styles.spotlightInfo}>
                  <Text style={styles.spotlightName}>{restaurant.name}</Text>
                  <Text style={styles.spotlightDesc} numberOfLines={2}>
                    Crafted for Connoisseurs
                  </Text>
                  <Pressable style={styles.prebookBtn}>
                    <Text style={styles.prebookBtnText}>PREBOOK NOW</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{user?.name?.split(' ')[0] || 'Hey'}, what&apos;s on your mind?</Text>
          
          <View style={styles.quickActions}>
            <Pressable style={styles.quickActionCard}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <MapPin size={24} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Restaurants{'\n'}near me</Text>
            </Pressable>
            <Pressable 
              style={styles.quickActionCard}
              onPress={() => router.push('/(customer)/deals')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accentLight }]}>
                <Percent size={24} color={colors.secondary} />
              </View>
              <Text style={styles.quickActionText}>Pre-Book{'\n'}Offers</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.categoriesGrid}>
            {serviceCategories.map((category) => (
              <Pressable key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryIconBg}>
                  {categoryIcons[category.name] || <UtensilsCrossed size={24} color={colors.secondary} />}
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>{category.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Hot Deals 🔥</Text>
            <Pressable onPress={() => router.push('/(customer)/deals')}>
              <ChevronRight size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dealsScroll}
          >
            {hotDeals.map((deal) => (
              <Pressable
                key={deal.id}
                style={styles.dealCard}
                onPress={() => navigateToRestaurant(deal.restaurantId)}
              >
                <Image
                  source={{ uri: deal.restaurantImage }}
                  style={styles.dealImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.dealGradient}
                />
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{deal.discountPercent}% OFF</Text>
                </View>
                <View style={styles.dealInfo}>
                  <Text style={styles.dealRestaurant}>{deal.restaurantName}</Text>
                  <Text style={styles.dealTitle} numberOfLines={1}>{deal.title}</Text>
                  <View style={styles.dealMeta}>
                    <Clock size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.dealMetaText}>Until {deal.validTill}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cuisine Types</Text>
            <ChevronRight size={22} color={colors.textMuted} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cuisineScroll}
          >
            {cuisineTypes.map((cuisine) => (
              <Pressable key={cuisine.id} style={styles.cuisineCard}>
                <Image
                  source={{ uri: cuisine.image }}
                  style={styles.cuisineImage}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.7)']}
                  style={styles.cuisineGradient}
                />
                <Text style={styles.cuisineName}>{cuisine.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MapPin size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Nearby Restaurants</Text>
            </View>
          </View>

          {nearbyRestaurants.map((restaurant) => {
            const isFavorite = user?.favorites.includes(restaurant.id);
            return (
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
                <View style={styles.restaurantInfo}>
                  <View style={styles.restaurantHeader}>
                    <View style={styles.restaurantNameRow}>
                      <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
                      <View style={styles.ratingBadge}>
                        <Star size={12} color="#fff" fill="#fff" />
                        <Text style={styles.ratingText}>{restaurant.rating}</Text>
                      </View>
                    </View>
                    <Pressable 
                      onPress={() => toggleFavorite(restaurant.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Heart
                        size={22}
                        color={isFavorite ? colors.error : colors.textMuted}
                        fill={isFavorite ? colors.error : 'transparent'}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.restaurantCuisine}>{restaurant.cuisineType} • {restaurant.city}</Text>
                  <View style={styles.restaurantMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={colors.textMuted} />
                      <Text style={styles.metaText}>{restaurant.waitingTime}</Text>
                    </View>
                    <View style={styles.metaDot} />
                    <Text style={styles.openStatus}>
                      <Text style={{ color: colors.success }}>Open</Text> till 11:59PM
                    </Text>
                  </View>
                  <View style={styles.restaurantActions}>
                    <Pressable style={styles.bookTableBtn}>
                      <Text style={styles.bookTableText}>Book a table</Text>
                    </Pressable>
                    <Pressable style={styles.orderBtn}>
                      <Text style={styles.orderBtnText}>Order</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.surface,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  walletText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  cashbackBanner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  cashbackGradient: {
    borderRadius: 16,
    padding: 16,
  },
  cashbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cashbackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cashbackTextContainer: {
    gap: 2,
  },
  cashbackTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  cashbackSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  cashbackBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cashbackBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  spotlightScroll: {
    paddingHorizontal: 20,
  },
  spotlightCard: {
    width: CARD_WIDTH,
    height: 220,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
  },
  spotlightGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  spotlightBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  spotlightInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  spotlightName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  spotlightDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  prebookBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  prebookBtnText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.text,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    lineHeight: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryCard: {
    width: (width - 56) / 4,
    alignItems: 'center',
    paddingVertical: 12,
  },
  categoryIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
  dealsScroll: {
    paddingHorizontal: 20,
  },
  dealCard: {
    width: width * 0.65,
    height: 180,
    marginRight: 14,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  dealImage: {
    width: '100%',
    height: '100%',
  },
  dealGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  dealInfo: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  dealRestaurant: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 6,
  },
  dealMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dealMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  cuisineScroll: {
    paddingHorizontal: 20,
  },
  cuisineCard: {
    width: 90,
    height: 90,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuisineImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cuisineGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cuisineName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  restaurantCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  restaurantImage: {
    width: '100%',
    height: 160,
  },
  restaurantInfo: {
    padding: 14,
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  restaurantCuisine: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginHorizontal: 10,
  },
  openStatus: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  restaurantActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  bookTableBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  bookTableText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  orderBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
  },
  orderBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
