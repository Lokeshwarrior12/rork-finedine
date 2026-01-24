import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  Clock,
  X,
  Percent,
  Utensils,
  ShoppingBag,
  Star,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { deals } from '@/mocks/data';

type OfferTypeFilter = 'all' | 'dinein' | 'pickup' | 'both';
type DiscountFilter = 'all' | '10-20' | '21-30' | '31-50';

export default function DealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [offerType, setOfferType] = useState<OfferTypeFilter>('all');
  const [discountRange, setDiscountRange] = useState<DiscountFilter>('all');

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = offerType === 'all' || deal.offerType === offerType;
      
      let matchesDiscount = true;
      if (discountRange !== 'all') {
        const [min, max] = discountRange.split('-').map(Number);
        matchesDiscount = deal.discountPercent >= min && deal.discountPercent <= max;
      }
      
      return matchesSearch && matchesType && matchesDiscount && deal.isActive;
    });
  }, [searchQuery, offerType, discountRange]);

  const clearFilters = () => {
    setOfferType('all');
    setDiscountRange('all');
  };

  const hasActiveFilters = offerType !== 'all' || discountRange !== 'all';

  const navigateToRestaurant = (id: string) => {
    router.push(`/restaurant/${id}` as any);
  };

  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Deals</Text>
        <Text style={styles.subtitle}>{filteredDeals.length} offers available</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deals..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={showFilters ? '#fff' : colors.primary} />
        </Pressable>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Offer Type</Text>
            <View style={styles.filterChips}>
              {[
                { value: 'all', label: 'All', icon: null },
                { value: 'dinein', label: 'Dine In', icon: Utensils },
                { value: 'pickup', label: 'Pickup', icon: ShoppingBag },
                { value: 'both', label: 'Both', icon: null },
              ].map((type) => (
                <Pressable
                  key={type.value}
                  style={[
                    styles.filterChip,
                    offerType === type.value && styles.filterChipActive,
                  ]}
                  onPress={() => setOfferType(type.value as OfferTypeFilter)}
                >
                  {type.icon && (
                    <type.icon size={14} color={offerType === type.value ? '#fff' : colors.text} />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      offerType === type.value && styles.filterChipTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Discount Range</Text>
            <View style={styles.filterChips}>
              {[
                { value: 'all', label: 'All' },
                { value: '10-20', label: '10-20%' },
                { value: '21-30', label: '21-30%' },
                { value: '31-50', label: '31-50%' },
              ].map((range) => (
                <Pressable
                  key={range.value}
                  style={[
                    styles.filterChip,
                    discountRange === range.value && styles.filterChipActive,
                  ]}
                  onPress={() => setDiscountRange(range.value as DiscountFilter)}
                >
                  <Percent size={14} color={discountRange === range.value ? '#fff' : colors.text} />
                  <Text
                    style={[
                      styles.filterChipText,
                      discountRange === range.value && styles.filterChipTextActive,
                    ]}
                  >
                    {range.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {hasActiveFilters && (
            <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {filteredDeals.map((deal) => (
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
            <View style={styles.dealBadges}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{deal.discountPercent}% OFF</Text>
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>
                  {deal.offerType === 'dinein' ? 'Dine In' : deal.offerType === 'pickup' ? 'Pickup' : 'Both'}
                </Text>
              </View>
            </View>
            <View style={styles.dealContent}>
              <View style={styles.dealHeader}>
                <Text style={styles.dealTitle} numberOfLines={1}>{deal.title}</Text>
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#fff" fill="#fff" />
                  <Text style={styles.ratingText}>4.5</Text>
                </View>
              </View>
              <Text style={styles.dealRestaurant}>{deal.restaurantName}</Text>
              <Text style={styles.dealDescription} numberOfLines={2}>
                {deal.description}
              </Text>
              <View style={styles.dealMeta}>
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>Until {deal.validTill}</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(deal.claimedCoupons / deal.maxCoupons) * 100}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.claimedText}>{deal.claimedCoupons}/{deal.maxCoupons}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}

        {filteredDeals.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No deals found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters or search term</Text>
          </View>
        )}
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
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: colors.surface,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtersContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 10,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  clearFiltersButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dealCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dealImage: {
    width: '100%',
    height: 160,
  },
  dealBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  discountBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  discountText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  dealContent: {
    padding: 16,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    flex: 1,
    marginRight: 12,
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
  dealRestaurant: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  dealMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 60,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  claimedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
