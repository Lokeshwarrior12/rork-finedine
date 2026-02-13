import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'freebie' | 'experience';
  isAvailable: boolean;
  stock?: number;
}

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
  const queryClient = useQueryClient();
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

  // REAL API QUERY - Fetch available rewards from backend
  const { 
    data: rewardsResponse, 
    isLoading: rewardsLoading,
    error: rewardsError 
  } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      console.log('🔄 Fetching rewards from API...');
      const result = await api.getRewards();
      console.log('✅ Rewards fetched:', result.data?.length || 0);
      return result;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // REAL API QUERY - Fetch user profile for points
  const { 
    data: profileResponse 
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      console.log('🔄 Fetching user profile for points...');
      const result = await api.getUserProfile();
      console.log('✅ User points:', result.data?.loyaltyPoints || 0);
      return result;
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  // REAL API MUTATION - Redeem reward
  const redeemRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      console.log('🔄 Redeeming reward:', rewardId);
      return await api.redeemReward(rewardId);
    },
    onSuccess: (data, rewardId) => {
      console.log('✅ Reward redeemed successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const reward = rewards.find(r => r.id === rewardId);
      Alert.alert(
        'Success!',
        `${reward?.title || 'Reward'} has been added to your coupons!`,
        [
          {
            text: 'View Coupons',
            onPress: () => {
              // Navigate to coupons screen
              // router.push('/(customer)/coupons');
            },
          },
          { text: 'OK' },
        ]
      );
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['rewards']);
      queryClient.invalidateQueries(['profile']);
      queryClient.invalidateQueries(['coupons']);
    },
    onError: (error) => {
      console.error('❌ Failed to redeem reward:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to redeem reward. Please try again.'
      );
    },
  });

  const rewards = rewardsResponse?.data || [];
  const userPoints = profileResponse?.data?.loyaltyPoints || user?.loyaltyPoints || 0;
  
  const currentTier = tiers.find(t => userPoints >= t.minPoints && userPoints <= t.maxPoints) || tiers[0];
  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progressToNextTier = nextTier 
    ? ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const filteredRewards = selectedCategory === 'all' 
    ? rewards 
    : rewards.filter(r => r.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'discount', label: 'Discounts' },
    { id: 'freebie', label: 'Freebies' },
    { id: 'experience', label: 'Experiences' },
  ];

  const handleRedeemReward = (reward: Reward) => {
    if (!reward.isAvailable) {
      Alert.alert('Not Available', 'This reward is currently unavailable.');
      return;
    }

    if (userPoints < reward.pointsCost) {
      Alert.alert(
        'Insufficient Points',
        `You need ${reward.pointsCost - userPoints} more points to redeem this reward.`
      );
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Redeem ${reward.title} for ${reward.pointsCost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => redeemRewardMutation.mutate(reward.id),
        },
      ]
    );
  };

  const styles = createStyles(colors, isDark);

  // Loading State
  if (rewardsLoading && !rewardsResponse) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>Loading rewards...</Text>
      </View>
    );
  }

  // Error State
  if (rewardsError && !rewardsResponse) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }]}>
        <Gift size={48} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Unable to load rewards</Text>
        <Text style={styles.errorText}>
          {rewardsError instanceof Error ? rewardsError.message : 'Please check your connection'}
        </Text>
        <Pressable 
          style={styles.retryButton} 
          onPress={() => queryClient.invalidateQueries(['rewards'])}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

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
                  <View style={[styles.progressFill, { width: `${Math.min(progressToNextTier, 100)}%` }]} />
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
                onPress={() => {
                  setSelectedCategory(cat.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
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

          {filteredRewards.length > 0 ? (
            filteredRewards.map((reward) => {
              const canRedeem = userPoints >= reward.pointsCost && reward.isAvailable;
              const isRedeeming = redeemRewardMutation.isPending && redeemRewardMutation.variables === reward.id;
              
              return (
                <Pressable 
                  key={reward.id} 
                  style={[styles.rewardCard, !reward.isAvailable && styles.rewardCardDisabled]}
                  onPress={() => canRedeem && handleRedeemReward(reward)}
                >
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDesc} numberOfLines={2}>{reward.description}</Text>
                    <View style={styles.rewardCost}>
                      <Sparkles size={14} color={colors.accent} />
                      <Text style={styles.rewardCostText}>{reward.pointsCost} points</Text>
                      {reward.stock !== undefined && reward.stock > 0 && reward.stock < 10 && (
                        <Text style={styles.stockText}>• {reward.stock} left</Text>
                      )}
                    </View>
                  </View>
                  <Pressable 
                    style={[styles.redeemBtn, canRedeem && styles.redeemBtnActive]}
                    disabled={!canRedeem || isRedeeming}
                    onPress={() => canRedeem && handleRedeemReward(reward)}
                  >
                    {isRedeeming ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={[styles.redeemBtnText, canRedeem && styles.redeemBtnTextActive]}>
                          {reward.isAvailable ? (canRedeem ? 'Redeem' : 'Locked') : 'Coming Soon'}
                        </Text>
                        {canRedeem && <ChevronRight size={16} color="#fff" />}
                      </>
                    )}
                  </Pressable>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyRewards}>
              <Gift size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No rewards in this category</Text>
            </View>
          )}
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
  stockText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    gap: 4,
    minWidth: 90,
    justifyContent: 'center',
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
  emptyRewards: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
