import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import Colors from '@/constants/colors';

interface Referral {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'completed';
  date: string;
  pointsEarned?: number;
}

const mockReferrals: Referral[] = [
  { id: '1', name: 'Sarah M.', email: 'sarah.m@email.com', status: 'completed', date: 'Jan 18, 2026', pointsEarned: 50 },
  { id: '2', name: 'Mike R.', email: 'mike.r@email.com', status: 'completed', date: 'Jan 12, 2026', pointsEarned: 50 },
  { id: '3', name: 'Emily K.', email: 'emily.k@email.com', status: 'pending', date: 'Jan 20, 2026' },
];

export default function ReferralScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const referralCode = user?.id ? `FINEDINE-${user.id.toUpperCase().slice(0, 6)}` : 'FINEDINE-GUEST';
  const referralLink = `https://finedine.app/invite/${referralCode}`;

  const handleCopyCode = async () => {
    setCopied(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
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
    if (!inviteEmail.trim()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInviteEmail('');
  };

  const completedReferrals = mockReferrals.filter(r => r.status === 'completed').length;
  const totalPointsEarned = mockReferrals
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.pointsEarned || 0), 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.header}
        >
          <View style={styles.headerIcon}>
            <Gift size={32} color={Colors.accent} />
          </View>
          <Text style={styles.headerTitle}>Refer a Friend</Text>
          <Text style={styles.headerSubtitle}>
            Share the joy of dining and earn rewards together!
          </Text>

          <View style={styles.rewardHighlight}>
            <Sparkles size={20} color={Colors.accent} />
            <Text style={styles.rewardText}>
              Get <Text style={styles.rewardBold}>50 points</Text> + free meal deal for each friend!
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Users size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{completedReferrals}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={24} color={Colors.accent} />
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
                <Check size={20} color={Colors.success} />
              ) : (
                <Copy size={20} color={Colors.primary} />
              )}
            </Pressable>
          </View>

          <Pressable style={styles.shareButton} onPress={handleShare}>
            <Share2 size={20} color={Colors.surface} />
            <Text style={styles.shareButtonText}>Share Invite Link</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite by Email</Text>
          <View style={styles.emailInputContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter friend's email"
              placeholderTextColor={Colors.textLight}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Pressable 
              style={[
                styles.sendButton,
                !inviteEmail.trim() && styles.sendButtonDisabled
              ]} 
              onPress={handleSendInvite}
              disabled={!inviteEmail.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
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
          {mockReferrals.length > 0 ? (
            <View style={styles.referralsCard}>
              {mockReferrals.map((referral, index) => (
                <React.Fragment key={referral.id}>
                  <View style={styles.referralItem}>
                    <View style={styles.referralAvatar}>
                      <Text style={styles.referralInitial}>
                        {referral.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.referralInfo}>
                      <Text style={styles.referralName}>{referral.name}</Text>
                      <Text style={styles.referralDate}>{referral.date}</Text>
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
                  {index < mockReferrals.length - 1 && <View style={styles.referralDivider} />}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.emptyReferrals}>
              <Users size={32} color={Colors.textLight} />
              <Text style={styles.emptyText}>No referrals yet</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.surface,
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
    color: Colors.surface,
  },
  rewardBold: {
    fontWeight: '700' as const,
    color: Colors.accent,
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
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  codeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
  },
  codeDisplay: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  codeText: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  copyButton: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 12,
    gap: 10,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  emailInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  emailInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  stepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepItem: {
    flexDirection: 'row',
    position: 'relative',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    zIndex: 1,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  stepLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.border,
  },
  referralsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralInitial: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  referralInfo: {
    flex: 1,
    marginLeft: 12,
  },
  referralName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  referralDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  referralStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.surfaceAlt,
  },
  referralStatusCompleted: {
    backgroundColor: `${Colors.success}15`,
  },
  referralStatusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  referralStatusTextCompleted: {
    color: Colors.success,
  },
  referralDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 70,
  },
  emptyReferrals: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  termsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  termsText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});
