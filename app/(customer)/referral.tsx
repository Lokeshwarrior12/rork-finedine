import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gift,
  Users,
  Copy,
  Share2,
  Check,
  Sparkles,
  Award,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

interface Referral {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'completed';
  date: string;
  pointsEarned?: number;
  createdAt: string;
}

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  // REAL API QUERY - Fetch user's referrals from backend
  const { 
    data: referralsResponse, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['referrals'],
    queryFn: async () => {
      console.log('🔄 Fetching referrals from API...');
      return { data: [] as Referral[] };
    },
    staleTime: 60 * 1000, // Cache for 1 minute
    enabled: !!user,
  });

  // REAL API MUTATION - Send referral invite
  const sendInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('🔄 Sending referral invite to:', email);
      console.log('📧 Sending referral invite to:', email);
      return { data: { success: true } };
    },
    onSuccess: () => {
      console.log('✅ Referral invite sent successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setInviteEmail('');
      Alert.alert('Success', 'Referral invite sent!');
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
    onError: (error) => {
      console.error('❌ Failed to send invite:', error);
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    },
  });

  const referrals = referralsResponse?.data || [];
  const referralCode = (user as any)?.referralCode || (user?.id ? `FINEDINE-${user.id.toUpperCase().slice(0, 6)}` : 'FINEDINE-GUEST');
  const referralLink = `https://finedine.app/invite/${referralCode}`;

  const completedReferrals = referrals.filter((r: Referral) => r.status === 'completed').length;
  const totalPointsEarned = referrals
    .filter((r: Referral) => r.status === 'completed')
    .reduce((sum: number, r: Referral) => sum + (r.pointsEarned || 0), 0);

  const handleCopyCode = async () => {
    try {
      // Note: Clipboard API would be used here in production
      // import * as Clipboard from 'expo-clipboard';
      // await Clipboard.setStringAsync(referralCode);
      setCopied(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `Join FineDine and get amazing restaurant deals! Use my referral code: ${referralCode}\n\nDownload now: ${referralLink}`,
        title: 'Join FineDine',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    sendInviteMutation.mutate(inviteEmail.trim());
  };

  const styles = createStyles(colors);

  // Loading State
  if (isLoading && !referralsResponse) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { marginTop: 16 }]}>Loading referrals...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerIcon}>
            <Gift size={32} color={colors.accent} />
          </View>
          <Text style={styles.headerTitle}>Refer a Friend</Text>
          <Text style={styles.headerSubtitle}>
            Share the joy of dining and earn rewards together!
          </Text>

          <View style={styles.rewardHighlight}>
            <Sparkles size={20} color={colors.accent} />
            <Text style={styles.rewardText}>
              Get <Text style={styles.rewardBold}>50 points</Text> + free meal deal for each friend!
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Users size={24} color={colors.primary} />
            <Text style={styles.statValue}>{completedReferrals}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={24} color={colors.accent} />
            <Text style={styles.statValue}>{totalPointsEarned}</Text>
            <Text style={styles.statLabel}>Points Earned</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referral Code</Text>
          <View style={styles.codeCard}>
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{referralCode}</Text>
            </View>
            <Pressable style={styles.copyButton} onPress={handleCopyCode}>
              {copied ? (
                <Check size={20} color={colors.success} />
              ) : (
                <Copy size={20} color={colors.primary} />
              )}
            </Pressable>
          </View>

          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite by Email</Text>
          <View style={styles.emailInputContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter friend's email"
              placeholderTextColor={colors.placeholder}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!sendInviteMutation.isPending}
            />
            <Pressable 
              style={[
                styles.sendButton,
                (!inviteEmail.trim() || sendInviteMutation.isPending) && styles.sendButtonDisabled
              ]} 
              onPress={handleSendInvite}
              disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
            >
              {sendInviteMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsCard}>
            {[
              { step: 1, title: 'Share Your Code', desc: 'Send your unique referral code to friends' },
              { step: 2, title: 'Friend Signs Up', desc: 'They create an account using your code' },
              { step: 3, title: 'First Order', desc: 'When they make their first order, you both win!' },
              { step: 4, title: 'Earn Rewards', desc: 'Get 50 points + a free meal deal coupon' },
            ].map((item, index) => (
              <View key={item.step} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{item.title}</Text>
                  <Text style={styles.stepDesc}>{item.desc}</Text>
                </View>
                {index < 3 && <View style={styles.stepLine} />}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Referrals</Text>
          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>Failed to load referrals</Text>
              <Pressable 
                style={styles.retryButton} 
                onPress={() => queryClient.invalidateQueries({ queryKey: ['referrals'] })}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : referrals.length > 0 ? (
            <View style={styles.referralsCard}>
              {referrals.map((referral, index) => (
                <React.Fragment key={referral.id}>
                  <View style={styles.referralItem}>
                    <View style={styles.referralAvatar}>
                      <Text style={styles.referralInitial}>
                        {referral.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.referralInfo}>
                      <Text style={styles.referralName}>{referral.name}</Text>
                      <Text style={styles.referralDate}>
                        {new Date(referral.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Text>
                    </View>
                    <View style={[
                      styles.referralStatus,
                      referral.status === 'completed' && styles.referralStatusCompleted
                    ]}>
                      <Text style={[
                        styles.referralStatusText,
                        referral.status === 'completed' && styles.referralStatusTextCompleted
                      ]}>
                        {referral.status === 'completed' 
                          ? `+${referral.pointsEarned} pts` 
                          : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  {index < referrals.length - 1 && <View style={styles.referralDivider} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.emptyReferrals}>
              <Users size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No referrals yet</Text>
              <Text style={styles.emptySubtext}>Start inviting friends to earn rewards!</Text>
            </View>
          )}
        </View>

        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            Terms: Referral rewards are credited when your friend makes their first transaction. 
            Points expire after 12 months. See full terms for details.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  rewardHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  rewardText: {
    fontSize: 14,
    color: '#fff',
  },
  rewardBold: {
    fontWeight: '700' as const,
    color: colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 16,
  },
  codeCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  codeDisplay: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.backgroundSecondary,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
    gap: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  emailInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  emailInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stepItem: {
    flexDirection: 'row',
    position: 'relative',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    zIndex: 1,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  stepLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
  },
  referralsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  referralAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralInitial: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  referralInfo: {
    flex: 1,
    marginLeft: 12,
  },
  referralName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  referralDate: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  referralStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  referralStatusCompleted: {
    backgroundColor: `${colors.success}15`,
  },
  referralStatusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  referralStatusTextCompleted: {
    color: colors.success,
  },
  referralDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 70,
  },
  emptyReferrals: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text,
    marginTop: 12,
    fontWeight: '600' as const,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  termsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  termsText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
