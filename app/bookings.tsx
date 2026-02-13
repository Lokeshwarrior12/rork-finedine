import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Users,
  X,
  CheckCircle,
  AlertCircle,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import Colors from '@/constants/colors';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Booking } from '@/lib/api';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export default function BookingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');

  /* ---------------- FETCH BOOKINGS FROM REAL API ---------------- */
  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      // Use the correct API method based on your API client
      const response = await api.getBookings();
      return response;
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  const bookings = (bookingsData?.data || []) as Booking[];
  const filteredBookings = bookings.filter((b) => b.status === activeTab);

  /* ---------------- CANCEL BOOKING MUTATION ---------------- */
  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      // Implement cancel booking API call
      // For now, return a mock response
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', user?.id] });
      Alert.alert('Success', 'Booking cancelled successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to cancel booking');
    },
  });

  /* ---------------- HANDLERS ---------------- */
  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${booking.restaurantName || 'this restaurant'}?`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            if (Platform.OS !== 'web') {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            cancelBookingMutation.mutate(booking.id);
          },
        },
      ]
    );
  };

  const navigateToRestaurant = (id: string) => {
    router.push(`/(customer)/restaurant/${id}` as any);
  };

  /* ---------------- HELPERS ---------------- */
  const tabs: { key: BookingStatus; label: string; count: number }[] = [
    {
      key: 'upcoming',
      label: 'Upcoming',
      count: bookings.filter((b) => b.status === 'upcoming').length,
    },
    {
      key: 'completed',
      label: 'Completed',
      count: bookings.filter((b) => b.status === 'completed').length,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: bookings.filter((b) => b.status === 'cancelled').length,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock size={14} color={Colors.primary} />;
      case 'completed':
        return <CheckCircle size={14} color={Colors.success} />;
      case 'cancelled':
        return <X size={14} color={Colors.error} />;
      default:
        return <Clock size={14} color={Colors.primary} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { bg: `${Colors.primary}15`, text: Colors.primary };
      case 'completed':
        return { bg: `${Colors.success}15`, text: Colors.success };
      case 'cancelled':
        return { bg: `${Colors.error}15`, text: Colors.error };
      default:
        return { bg: `${Colors.primary}15`, text: Colors.primary };
    }
  };

  /* ---------------- LOADING STATE ---------------- */
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>Manage your reservations</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </View>
    );
  }

  /* ---------------- ERROR STATE ---------------- */
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.subtitle}>Manage your reservations</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.error} />
          <Text style={styles.errorText}>Failed to load bookings</Text>
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
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Manage your reservations</Text>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      >
        {filteredBookings.map((booking) => {
          const statusColors = getStatusColor(booking.status);
          return (
            <Pressable
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => navigateToRestaurant(booking.restaurantId)}
            >
              <Image
                source={{ uri: booking.restaurantImage || 'https://via.placeholder.com/400' }}
                style={styles.bookingImage}
                contentFit="cover"
              />
              <View style={styles.bookingContent}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.restaurantName}>{booking.restaurantName || 'Restaurant'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    {getStatusIcon(booking.status)}
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Calendar size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{booking.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{booking.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Users size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{booking.guests} guests</Text>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <View style={styles.confirmationCode}>
                    <Text style={styles.confirmationLabel}>Confirmation:</Text>
                    <Text style={styles.confirmationValue}>
                      {booking.confirmationCode || booking.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </View>

                  {booking.status === 'upcoming' && (
                    <Pressable
                      style={[
                        styles.cancelButton,
                        cancelBookingMutation.isPending && styles.cancelButtonDisabled,
                      ]}
                      onPress={() => handleCancelBooking(booking)}
                      disabled={cancelBookingMutation.isPending}
                    >
                      {cancelBookingMutation.isPending ? (
                        <ActivityIndicator size="small" color={Colors.error} />
                      ) : (
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      )}
                    </Pressable>
                  )}
                </View>

                {booking.specialRequests && booking.status === 'upcoming' && (
                  <View style={styles.specialRequests}>
                    <AlertCircle size={14} color={Colors.textSecondary} />
                    <Text style={styles.specialRequestsText} numberOfLines={2}>
                      {booking.specialRequests}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}

        {filteredBookings.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No {activeTab} bookings</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'upcoming'
                ? 'Book a table at your favorite restaurant'
                : `Your ${activeTab} bookings will appear here`}
            </Text>
            {activeTab === 'upcoming' && (
              <Pressable
                style={styles.exploreButton}
                onPress={() => router.push('/(customer)/home' as any)}
              >
                <Text style={styles.exploreButtonText}>Explore Restaurants</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
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
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  tabTextActive: {
    color: Colors.surface,
  },
  tabBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabBadgeTextActive: {
    color: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bookingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingImage: {
    width: '100%',
    height: 120,
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmationCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confirmationLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  confirmationValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: `${Colors.error}10`,
    borderRadius: 8,
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.error,
  },
  specialRequests: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  specialRequestsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  exploreButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});
