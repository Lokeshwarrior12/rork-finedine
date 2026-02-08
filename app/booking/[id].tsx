import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  MapPin,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useRestaurant, useCreateTableBooking } from '@/hooks/useApi';

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [specialRequests, setSpecialRequests] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(id);
  const createBookingMutation = useCreateTableBooking();

  const timeSlots = ['12:00', '12:30', '13:00', '18:00', '18:30', '19:00', '19:30', '20:00'];

  const generateDates = () => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  };
  const dates = generateDates();

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !id) return;

    try {
      await createBookingMutation.mutateAsync({
        restaurantId: id,
        date: selectedDate,
        time: selectedTime,
        guests: guestCount,
        specialRequests: specialRequests || undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 2000);
    } catch (error) {
      console.error('[Booking] Error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (restaurantLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Book a Table</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {restaurant && (
            <View style={[styles.restaurantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Image
                source={{ uri: restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' }}
                style={styles.restaurantImage}
                contentFit="cover"
              />
              <View style={styles.restaurantInfo}>
                <Text style={[styles.restaurantName, { color: colors.text }]}>{restaurant.name}</Text>
                <View style={styles.restaurantMeta}>
                  <Star size={14} color={colors.rating} fill={colors.rating} />
                  <Text style={[styles.restaurantRating, { color: colors.text }]}>{restaurant.rating}</Text>
                  <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                  <MapPin size={14} color={colors.textMuted} />
                  <Text style={[styles.restaurantCity, { color: colors.textSecondary }]}>{restaurant.city}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {dates.map((date) => (
                  <Pressable
                    key={date}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      selectedDate === date && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Calendar size={14} color={selectedDate === date ? '#fff' : colors.textMuted} />
                    <Text
                      style={[
                        styles.chipText,
                        { color: colors.text },
                        selectedDate === date && { color: '#fff' },
                      ]}
                    >
                      {date}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Time</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map((time) => (
                <Pressable
                  key={time}
                  style={[
                    styles.timeChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selectedTime === time && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Clock size={14} color={selectedTime === time ? '#fff' : colors.textMuted} />
                  <Text
                    style={[
                      styles.timeChipText,
                      { color: colors.text },
                      selectedTime === time && { color: '#fff' },
                    ]}
                  >
                    {time}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Guests</Text>
            <View style={styles.guestSelector}>
              <Pressable
                style={[styles.guestBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
              >
                <Text style={[styles.guestBtnText, { color: colors.text }]}>−</Text>
              </Pressable>
              <View style={[styles.guestDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Users size={18} color={colors.primary} />
                <Text style={[styles.guestCount, { color: colors.text }]}>{guestCount}</Text>
              </View>
              <Pressable
                style={[styles.guestBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setGuestCount(guestCount + 1)}
              >
                <Text style={[styles.guestBtnText, { color: colors.text }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Requests</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Any dietary requirements or special requests?"
              placeholderTextColor={colors.placeholder}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            style={[
              styles.bookButton,
              { backgroundColor: colors.primary },
              (!selectedDate || !selectedTime || createBookingMutation.isPending) && { opacity: 0.6 },
            ]}
            onPress={handleBook}
            disabled={!selectedDate || !selectedTime || createBookingMutation.isPending}
          >
            {createBookingMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            )}
          </Pressable>
        </View>

        {showSuccess && (
          <View style={[styles.successOverlay]}>
            <View style={[styles.successCard, { backgroundColor: colors.surface }]}>
              <CheckCircle size={48} color={colors.success} />
              <Text style={[styles.successTitle, { color: colors.text }]}>Booking Confirmed!</Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                {selectedDate} at {selectedTime} for {guestCount} guests
              </Text>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  scrollContent: {
    padding: 20,
  },
  restaurantCard: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 24,
  },
  restaurantImage: {
    width: 80,
    height: 80,
  },
  restaurantInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  restaurantRating: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  restaurantCity: {
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  guestBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    fontSize: 24,
    fontWeight: '500' as const,
  },
  guestDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  guestCount: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  bookButton: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  successCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
