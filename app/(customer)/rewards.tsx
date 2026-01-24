import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  Gift,
  Star,
  TrendingUp,
  Check,
  X,
  Sparkles,
  Crown,
  Zap,
  Trophy,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string;
  category: 'discount' | 'freebie' | 'experience';
}

const rewards: Reward[] = [
  {
    id: 'r1',
    name: '10% Off Any Order',
    description: 'Get 10% discount on your next order at any partner restaurant.',
    pointsCost: 100,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    category: 'discount',
  },
  {
    id: 'r2',
    name: 'Free Dessert',
    description: 'Enjoy a complimentary dessert with your meal.',
    pointsCost: 150,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
    category: 'freebie',
  },
  {
    id: 'r3',
    name: '20% Off Weekend Brunch',
    description: 'Special weekend brunch discount at select restaurants.',
    pointsCost: 200,
    image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400',
    category: 'discount',
  },
  {
    id: 'r4',
    name: 'Free Appetizer',
    description: 'Get a free appetizer on your next dine-in visit.',
    pointsCost: 120,
    image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400',
    category: 'freebie',
  },
  {
    id: 'r5',
    name: 'VIP Table Booking',
    description: 'Priority seating with complimentary welcome drink.',
    pointsCost: 300,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    category: 'experience',
  },
  {
    id: 'r6',
    name: 'Chef\'s Special Tasting',
    description: 'Exclusive 5-course tasting menu experience.',
    pointsCost: 500,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    category: 'experience',
  },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { user, addPoints } = useAuth();
  const { colors, isDark } = useTheme();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const userPoints = user?.points || 0;

  const tiers = [
    {
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 99,
      icon: <Award size={24} color="#CD7F32" />,
      color: '#CD7F32',
      benefits: ['Access to basic rewards', 'Birthday bonus points'],
    },
    {
      name: 'Silver',
      minPoints: 100,
      maxPoints: 249,
      icon: <Star size={24} color="#C0C0C0" />,
      color: '#C0C0C0',
      benefits: ['Priority notifications', '1.2x points multiplier', 'Exclusive deals access'],
    },
    {
      name: 'Gold',
      minPoints: 250,
      maxPoints: 499,
      icon: <Crown size={24} color="#FFD700" />,
      color: '#FFD700',
      benefits: ['Early access to new offers', '1.5x points multiplier', 'Free delivery on orders'],
    },
    {
      name: 'Platinum',
      minPoints: 500,
      maxPoints: 999999,
      icon: <Trophy size={24} color="#E5E4E2" />,
      color: '#E5E4E2',
      benefits: ['VIP restaurant access', '2x points multiplier', 'Personal concierge', 'Exclusive events'],
    },
  ];

  const currentTier = tiers.find(t => userPoints >= t.minPoints && userPoints <= t.maxPoints) || tiers[0];
  const nextTier = tiers.find(t => t.minPoints > userPoints);
  const progressToNextTier = nextTier 
    ? ((userPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const handleRedeemReward = async (reward: Reward) => {
    if (userPoints < reward.pointsCost) return;
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const confirmRedeem = async () => {
    if (!selectedReward) return;
    
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    addPoints(-selectedReward.pointsCost);
    setRedeemSuccess(true);
    
    setTimeout(() => {
      setShowRedeemModal(false);
      setRedeemSuccess(false);
      setSelectedReward(null);
    }, 2000);
  };

  const pointsHistory = [
    { id: '1', action: 'Coupon claimed', points: 20, date: 'Jan 20, 2026' },
    { id: '2', action: 'Coupon used', points: 10, date: 'Jan 18, 2026' },
    { id: '3', action: 'Referral bonus', points: 50, date: 'Jan 15, 2026' },
    { id: '4', action: 'Review submitted', points: 15, date: 'Jan 12, 2026' },
  ];

  const styles = createStyles(colors, isDark);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Rewards</Text>
            <View style={styles.pointsDisplay}>
              <Sparkles size={28} color={colors.accent} />
              <Text style={styles.pointsValue}>{userPoints}</Text>
              <Text style={styles.pointsLabel}>Points</Text>
            </View>
          </View>

          <View style={styles.tierCard}>
            <View style={styles.tierHeader}>
              <View style={styles.tierBadge}>
                {currentTier.icon}
                <Text style={[styles.tierName, { color: currentTier.color }]}>{currentTier.name}</Text>
              </View>
              {nextTier && (
                <Text style={styles.nextTierText}>
                  {nextTier.minPoints - userPoints} pts to {nextTier.name}
                </Text>
              )}
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressToNextTier}%` }]} />
            </View>
            <View style={styles.tierBenefits}>
              {currentTier.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <Check size={14} color={colors.success} />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Rewards</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rewardsScroll}
          >
            {rewards.map((reward) => {
              const canRedeem = userPoints >= reward.pointsCost;
              return (
                <Pressable
                  key={reward.id}
                  style={[styles.rewardCard, !canRedeem && styles.rewardCardDisabled]}
                  onPress={() => canRedeem && handleRedeemReward(reward)}
                >
                  <Image
                    source={{ uri: reward.image }}
                    style={styles.rewardImage}
                    contentFit="cover"
                  />
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardName} numberOfLines={2}>{reward.name}</Text>
                    <View style={styles.rewardPoints}>
                      <Zap size={14} color={canRedeem ? colors.accent : colors.textMuted} />
                      <Text style={[
                        styles.rewardPointsText,
                        !canRedeem && styles.rewardPointsDisabled
                      ]}>
                        {reward.pointsCost} pts
                      </Text>
                    </View>
                  </View>
                  {!canRedeem && (
                    <View style={styles.lockedOverlay}>
                      <Text style={styles.lockedText}>
                        Need {reward.pointsCost - userPoints} more
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Earn Points</Text>
          <View style={styles.earnCard}>
            {[
              { action: 'Claim a coupon', points: '10-25 pts', icon: <Gift size={20} color={colors.primary} /> },
              { action: 'Use a coupon', points: '+10 pts bonus', icon: <Check size={20} color={colors.success} /> },
              { action: 'Write a review', points: '15 pts', icon: <Star size={20} color={colors.accent} /> },
              { action: 'Refer a friend', points: '50 pts', icon: <TrendingUp size={20} color={colors.primary} /> },
            ].map((item, index) => (
              <View key={index} style={styles.earnItem}>
                <View style={styles.earnIcon}>{item.icon}</View>
                <View style={styles.earnContent}>
                  <Text style={styles.earnAction}>{item.action}</Text>
                  <Text style={styles.earnPoints}>{item.points}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points History</Text>
          <View style={styles.historyCard}>
            {pointsHistory.map((item, index) => (
              <React.Fragment key={item.id}>
                <View style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyAction}>{item.action}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.historyPoints}>+{item.points}</Text>
                </View>
                {index < pointsHistory.length - 1 && <View style={styles.historyDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership Tiers</Text>
          <View style={styles.tiersCard}>
            {tiers.map((tier) => {
              const isCurrentTier = tier.name === currentTier.name;
              return (
                <View 
                  key={tier.name} 
                  style={[
                    styles.tierRow,
                    isCurrentTier && styles.tierRowActive
                  ]}
                >
                  <View style={styles.tierRowIcon}>{tier.icon}</View>
                  <View style={styles.tierRowContent}>
                    <Text style={[styles.tierRowName, { color: tier.color }]}>{tier.name}</Text>
                    <Text style={styles.tierRowPoints}>
                      {tier.maxPoints < 999999 ? `${tier.minPoints} - ${tier.maxPoints} pts` : `${tier.minPoints}+ pts`}
                    </Text>
                  </View>
                  {isCurrentTier && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <Modal visible={showRedeemModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {redeemSuccess ? (
              <View style={styles.successContent}>
                <View style={styles.successIcon}>
                  <Check size={40} color="#fff" />
                </View>
                <Text style={styles.successTitle}>Reward Redeemed!</Text>
                <Text style={styles.successText}>
                  Check your coupons for your new reward.
                </Text>
              </View>
            ) : (
              <>
                <Pressable 
                  style={styles.modalClose}
                  onPress={() => setShowRedeemModal(false)}
                >
                  <X size={24} color={colors.text} />
                </Pressable>
                
                {selectedReward && (
                  <>
                    <Image
                      source={{ uri: selectedReward.image }}
                      style={styles.modalImage}
                      contentFit="cover"
                    />
                    <Text style={styles.modalTitle}>{selectedReward.name}</Text>
                    <Text style={styles.modalDescription}>{selectedReward.description}</Text>
                    
                    <View style={styles.modalPoints}>
                      <Zap size={20} color={colors.accent} />
                      <Text style={styles.modalPointsText}>{selectedReward.pointsCost} points</Text>
                    </View>

                    <View style={styles.modalBalance}>
                      <Text style={styles.modalBalanceLabel}>Your balance after redemption:</Text>
                      <Text style={styles.modalBalanceValue}>
                        {userPoints - selectedReward.pointsCost} pts
                      </Text>
                    </View>

                    <Pressable style={styles.redeemButton} onPress={confirmRedeem}>
                      <Gift size={20} color="#fff" />
                      <Text style={styles.redeemButtonText}>Confirm Redemption</Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  tierCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  nextTierText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  tierBenefits: {
    gap: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 13,
    color: '#fff',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  rewardsScroll: {
    paddingRight: 20,
  },
  rewardCard: {
    width: 165,
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  rewardCardDisabled: {
    opacity: 0.7,
  },
  rewardImage: {
    width: '100%',
    height: 100,
  },
  rewardContent: {
    padding: 12,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
    minHeight: 36,
  },
  rewardPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardPointsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  rewardPointsDisabled: {
    color: colors.textMuted,
  },
  lockedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500' as const,
  },
  earnCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  earnIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earnAction: {
    fontSize: 15,
    color: colors.text,
  },
  earnPoints: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyLeft: {},
  historyAction: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.text,
  },
  historyDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.success,
  },
  historyDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  tiersCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tierRowActive: {
    backgroundColor: colors.backgroundSecondary,
  },
  tierRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierRowContent: {
    flex: 1,
  },
  tierRowName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  tierRowPoints: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    width: '100%',
    maxWidth: 340,
    overflow: 'hidden',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 160,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginTop: 8,
    lineHeight: 20,
  },
  modalPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    marginHorizontal: 20,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
  },
  modalPointsText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  modalBalance: {
    paddingHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBalanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalBalanceValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  redeemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    margin: 20,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  successContent: {
    padding: 40,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
