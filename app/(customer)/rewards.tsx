import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Gift,
  Star,
  Sparkles,
  Trophy,
  ChevronRight,
  Zap,
  Crown,
  Target,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

Dimensions.get('window');

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'freebie' | 'experience';
  isAvailable: boolean;
}

const mockRewards: Reward[] = [
  { id: '1', title: '10% Off Next Order', description: 'Get 10% discount on your next dining experience', pointsCost: 100, category: 'discount', isAvailable: true },
  { id: '2', title: 'Free Dessert', description: 'Complimentary dessert at any partner restaurant', pointsCost: 200, category: 'freebie', isAvailable: true },
  { id: '3', title: '25% Off Weekend Brunch', description: 'Special weekend brunch discount', pointsCost: 350, category: 'discount', isAvailable: true },
  { id: '4', title: 'VIP Table Booking', description: 'Priority reservation at premium restaurants', pointsCost: 500, category: 'experience', isAvailable: true },
  { id: '5', title: 'Free Appetizer', description: 'Complimentary starter at select restaurants', pointsCost: 150, category: 'freebie', isAvailable: true },
  { id: '6', title: 'Chef\'s Table Experience', description: 'Exclusive dining with the head chef', pointsCost: 1000, category: 'experience', isAvailable: false },
];

const tiers = [
  { name: 'Bronze', minPoints: 0, maxPoints: 499, color: '#CD7F32', icon: Star },
  { name: 'Silver', minPoints: 500, maxPoints: 1499, color: '#C0C0C0', icon: Trophy },
  { name: 'Gold', minPoints: 1500, maxPoints: 4999, color: '#FFD700', icon: Crown },
  { name: 'Platinum', minPoints: 5000, maxPoints: Infinity, color: '#E5E4E2', icon: Sparkles },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const userPoints = user?.points || 0;
  const currentTier = tiers.find(t => userPoints >= t.minPoints && userPoints <= t.maxPoints) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progressToNextTier = nextTier 
    ? ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const filteredRewards = selectedCategory === 'all' 
    ? mockRewards 
    : mockRewards.filter(r => r.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'discount', label: 'Discounts' },
    { id: 'freebie', label: 'Freebies' },
    { id: 'experience', label: 'Experiences' },
  ];

  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Rewards</Text>
          <Text style={styles.subtitle}>Earn points, unlock rewards</Text>
        </View>

        <Animated.View 
          style={[
            styles.pointsCard,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim }
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pointsGradient}
          >
            <View style={styles.pointsHeader}>
              <View style={styles.tierBadge}>
                <currentTier.icon size={16} color={currentTier.color} />
                <Text style={[styles.tierText, { color: currentTier.color }]}>{currentTier.name}</Text>
              </View>
              <Gift size={24} color="#fff" />
            </View>
            
            <View style={styles.pointsDisplay}>
              <Sparkles size={28} color="#FFD700" />
              <Text style={styles.pointsValue}>{userPoints}</Text>
              <Text style={styles.pointsLabel}>points</Text>
            </View>

            {nextTier && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    {nextTier.minPoints - userPoints} points to {nextTier.name}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressToNextTier}%` }]} />
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
          <View style={styles.earnGrid}>
            <View style={styles.earnCard}>
              <View style={[styles.earnIcon, { backgroundColor: colors.primaryLight }]}>
                <Target size={20} color={colors.primary} />
              </View>
              <Text style={styles.earnTitle}>Claim Deals</Text>
              <Text style={styles.earnDesc}>+10-50 pts</Text>
            </View>
            <View style={styles.earnCard}>
              <View style={[styles.earnIcon, { backgroundColor: colors.successLight }]}>
                <Star size={20} color={colors.success} />
              </View>
              <Text style={styles.earnTitle}>Write Reviews</Text>
              <Text style={styles.earnDesc}>+25 pts</Text>
            </View>
            <View style={styles.earnCard}>
              <View style={[styles.earnIcon, { backgroundColor: colors.accentLight }]}>
                <Zap size={20} color={colors.accent} />
              </View>
              <Text style={styles.earnTitle}>Book Tables</Text>
              <Text style={styles.earnDesc}>+15 pts</Text>
            </View>
          </View>
        </View>

        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map(cat => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive
                ]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {filteredRewards.map((reward) => {
            const canRedeem = userPoints >= reward.pointsCost && reward.isAvailable;
            return (
              <Pressable 
                key={reward.id} 
                style={[styles.rewardCard, !reward.isAvailable && styles.rewardCardDisabled]}
              >
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardDesc} numberOfLines={2}>{reward.description}</Text>
                  <View style={styles.rewardCost}>
                    <Sparkles size={14} color={colors.accent} />
                    <Text style={styles.rewardCostText}>{reward.pointsCost} points</Text>
                  </View>
                </View>
                <Pressable 
                  style={[styles.redeemBtn, canRedeem && styles.redeemBtnActive]}
                  disabled={!canRedeem}
                >
                  <Text style={[styles.redeemBtnText, canRedeem && styles.redeemBtnTextActive]}>
                    {reward.isAvailable ? (canRedeem ? 'Redeem' : 'Locked') : 'Coming Soon'}
                  </Text>
                  {canRedeem && <ChevronRight size={16} color="#fff" />}
                </Pressable>
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
    paddingTop: 16,
    paddingBottom: 8,
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
  pointsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  pointsGradient: {
    padding: 24,
  },
  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  tierText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#fff',
  },
  pointsLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  howItWorks: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  earnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  earnCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  earnTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  earnDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rewardsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  categoryScroll: {
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.text,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  rewardCardDisabled: {
    opacity: 0.6,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  rewardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  rewardCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardCostText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    gap: 4,
  },
  redeemBtnActive: {
    backgroundColor: colors.primary,
  },
  redeemBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  redeemBtnTextActive: {
    color: '#fff',
  },
});
