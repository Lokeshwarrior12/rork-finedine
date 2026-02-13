import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  PanResponder,
  LayoutChangeEvent,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket, Clock, CheckCircle, XCircle, Copy, Check, QrCode, Type } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

type TabType = 'active' | 'used' | 'expired';

interface Coupon {
  id: string;
  code: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage: string;
  dealTitle: string;
  discountPercent: number;
  status: TabType;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

const ScratchCard = ({
  children,
  isRevealed,
  onReveal,
  colors,
}: {
  children: React.ReactNode;
  isRevealed: boolean;
  onReveal: () => void;
  colors: any;
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const opacity = useRef(new Animated.Value(1)).current;

  const rows = 5;
  const cols = 15;
  const totalBlocks = rows * cols;
  const [scratchedBlocks, setScratchedBlocks] = useState<Set<number>>(new Set());

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt) => {
        if (isRevealed || dimensions.width === 0) return;

        const { locationX, locationY } = evt.nativeEvent;
        const blockWidth = dimensions.width / cols;
        const blockHeight = dimensions.height / rows;

        const col = Math.floor(locationX / blockWidth);
        const row = Math.floor(locationY / blockHeight);

        if (col >= 0 && col < cols && row >= 0 && row < rows) {
          const blockIndex = row * cols + col;

          setScratchedBlocks((prev) => {
            if (prev.has(blockIndex)) return prev;

            const newSet = new Set(prev);
            newSet.add(blockIndex);

            if (newSet.size > totalBlocks * 0.4) {
              setTimeout(() => {
                if (!isRevealed) onReveal();
              }, 0);
            }

            if (newSet.size % 3 === 0 && Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }

            return newSet;
          });
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (isRevealed) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRevealed, opacity]);

  const scratchStyles = createScratchStyles(colors);

  return (
    <View style={scratchStyles.scratchContainer}>
      <View style={scratchStyles.hiddenContent}>{children}</View>

      {!isRevealed && (
        <Animated.View
          style={[scratchStyles.scratchOverlay, { opacity }]}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          <View style={scratchStyles.scratchPattern}>
            {dimensions.width > 0 &&
              Array.from({ length: totalBlocks }).map((_, i) => {
                const isScratched = scratchedBlocks.has(i);
                return (
                  <View
                    key={i}
                    style={[
                      scratchStyles.scratchBlock,
                      {
                        width: dimensions.width / cols,
                        height: dimensions.height / rows,
                        opacity: isScratched ? 0 : 1,
                      },
                    ]}
                  />
                );
              })}

            <View style={scratchStyles.scratchTextContainer} pointerEvents="none">
              <Text style={scratchStyles.scratchText}>Scratch to Reveal</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const CouponCard = ({ coupon, colors, isDark }: { coupon: Coupon; colors: any; isDark: boolean }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [isRevealed, setIsRevealed] = useState(coupon.status !== 'active');

  const handleCopyCode = async (code: string) => {
    setCopiedCode(code);
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleReveal = () => {
    setIsRevealed(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const styles = createCardStyles(colors, isDark);

  return (
    <View
      style={[
        styles.couponCard,
        coupon.status === 'expired' && styles.couponCardExpired,
      ]}
    >
      <Image
        source={{ uri: coupon.restaurantImage }}
        style={styles.couponImage}
        contentFit="cover"
      />
      <View style={styles.couponContent}>
        <View style={styles.couponHeader}>
          <View
            style={[
              styles.discountBadge,
              coupon.status === 'used' && styles.discountBadgeUsed,
              coupon.status === 'expired' && styles.discountBadgeExpired,
            ]}
          >
            <Text style={styles.discountText}>{coupon.discountPercent}% OFF</Text>
          </View>
          {coupon.status === 'used' && (
            <View style={styles.statusBadge}>
              <CheckCircle size={14} color={colors.success} />
              <Text style={[styles.statusText, { color: colors.success }]}>Used</Text>
            </View>
          )}
          {coupon.status === 'expired' && (
            <View style={styles.statusBadge}>
              <XCircle size={14} color={colors.error} />
              <Text style={[styles.statusText, { color: colors.error }]}>Expired</Text>
            </View>
          )}
        </View>

        <Text style={styles.couponTitle}>{coupon.dealTitle}</Text>
        <Text style={styles.couponRestaurant}>{coupon.restaurantName}</Text>

        <View style={styles.codeSection}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeLabel}>Coupon Code:</Text>
            {isRevealed && coupon.status === 'active' && (
              <Pressable style={styles.toggleButton} onPress={() => setShowQr(!showQr)}>
                {showQr ? (
                  <>
                    <Type size={14} color={colors.primary} />
                    <Text style={styles.toggleButtonText}>Show Code</Text>
                  </>
                ) : (
                  <>
                    <QrCode size={14} color={colors.primary} />
                    <Text style={styles.toggleButtonText}>Show QR</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>

          <View style={styles.scratchWrapper}>
            <ScratchCard isRevealed={isRevealed} onReveal={handleReveal} colors={colors}>
              <View style={styles.codeBox}>
                {showQr ? (
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${coupon.code}`,
                    }}
                    style={styles.qrCode}
                    contentFit="contain"
                  />
                ) : (
                  <>
                    <Text style={styles.codeText}>{coupon.code}</Text>
                    {coupon.status === 'active' && (
                      <Pressable style={styles.copyButton} onPress={() => handleCopyCode(coupon.code)}>
                        {copiedCode === coupon.code ? (
                          <Check size={16} color={colors.success} />
                        ) : (
                          <Copy size={16} color={colors.primary} />
                        )}
                      </Pressable>
                    )}
                  </>
                )}
              </View>
            </ScratchCard>
          </View>
        </View>

        <View style={styles.couponMeta}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {coupon.status === 'used' ? `Used on ${coupon.usedAt}` : `Expires ${coupon.expiresAt}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('active');

  /* ---------------- FETCH COUPONS FROM REAL API ---------------- */
  const {
    data: couponsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['coupons', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      // Use getCoupons instead of getUserCoupons
      return api.getCoupons();
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  const coupons = (couponsData?.data || []) as Coupon[];
  const filteredCoupons = coupons.filter((c) => c.status === activeTab);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: coupons.filter((c) => c.status === 'active').length },
    { key: 'used', label: 'Used', count: coupons.filter((c) => c.status === 'used').length },
    { key: 'expired', label: 'Expired', count: coupons.filter((c) => c.status === 'expired').length },
  ];

  const styles = createStyles(colors, isDark);

  /* ---------------- LOADING STATE ---------------- */
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Coupons</Text>
          <Text style={styles.subtitle}>Manage your saved deals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading coupons...</Text>
        </View>
      </View>
    );
  }

  /* ---------------- ERROR STATE ---------------- */
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Coupons</Text>
          <Text style={styles.subtitle}>Manage your saved deals</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ticket size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load coupons</Text>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Coupons</Text>
        <Text style={styles.subtitle}>Manage your saved deals</Text>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, activeTab === tab.key && styles.tabBadgeTextActive]}>
                {tab.count}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {filteredCoupons.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} colors={colors} isDark={isDark} />
        ))}

        {filteredCoupons.length === 0 && (
          <View style={styles.emptyState}>
            <Ticket size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No {activeTab} coupons</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active'
                ? 'Claim deals to see your coupons here'
                : `Your ${activeTab} coupons will appear here`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 32,
    },
    errorText: {
      fontSize: 18,
      color: colors.error,
      textAlign: 'center',
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 12,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
      backgroundColor: colors.surface,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 8,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 14,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    tabTextActive: {
      color: '#fff',
    },
    tabBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    tabBadgeActive: {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
    tabBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabBadgeTextActive: {
      color: '#fff',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
  });

const createCardStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    couponCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    couponCardExpired: {
      opacity: 0.7,
    },
    couponImage: {
      width: '100%',
      height: 130,
    },
    couponContent: {
      padding: 16,
    },
    couponHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    discountBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 10,
    },
    discountBadgeUsed: {
      backgroundColor: colors.success,
    },
    discountBadgeExpired: {
      backgroundColor: colors.textSecondary,
    },
    discountText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#fff',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    couponTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    couponRestaurant: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 14,
    },
    codeSection: {
      marginBottom: 14,
    },
    codeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    codeLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    toggleButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    scratchWrapper: {
      overflow: 'hidden',
      borderRadius: 12,
    },
    codeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 14,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.border,
      minHeight: 60,
    },
    codeText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 2,
      flex: 1,
      textAlign: 'center',
    },
    qrCode: {
      width: 120,
      height: 120,
      backgroundColor: 'white',
      borderRadius: 8,
    },
    copyButton: {
      padding: 10,
      backgroundColor: colors.surface,
      borderRadius: 10,
      marginLeft: 8,
    },
    couponMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });

const createScratchStyles = (colors: any) =>
  StyleSheet.create({
    scratchContainer: {
      position: 'relative',
      minHeight: 60,
    },
    hiddenContent: {
      width: '100%',
    },
    scratchOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.surface,
      zIndex: 10,
    },
    scratchPattern: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: colors.primary,
    },
    scratchBlock: {
      backgroundColor: colors.primaryDark,
      borderWidth: 0.5,
      borderColor: colors.primary,
    },
    scratchTextContainer: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scratchText: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.8)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
  });
