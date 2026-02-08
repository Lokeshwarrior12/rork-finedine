import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useCreateServiceBooking } from '@/hooks/useApi';

export default function ServiceBookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [guestCount, setGuestCount] = useState(10);
  const [showSuccess, setShowSuccess] = useState(false);

  const createServiceBookingMutation = useCreateServiceBooking();

  const timeSlots = [
    { label: 'Morning (10AM - 1PM)', value: '10:00-13:00' },
    { label: 'Afternoon (1PM - 5PM)', value: '13:00-17:00' },
    { label: 'Evening (5PM - 9PM)', value: '17:00-21:00' },
    { label: 'Night (9PM - 12AM)', value: '21:00-00:00' },
  ];

  const generateDates = () => {
    const dates: string[] = [];
    const now = new Date();
    for (let i = 3; i <= 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
  };
  const dates = generateDates().slice(0, 10);

  const pricePerPerson = 50;
  const totalPrice = guestCount * pricePerPerson;

  const handleBook = async () => {
    if (!selectedDate || !selectedTimeSlot || !id) return;

    try {
      await createServiceBookingMutation.mutateAsync({
        restaurantId: id,
        serviceId: id,
        serviceName: 'Event Booking',
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        guests: guestCount,
        totalPrice,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 2000);
    } catch (error) {
      console.error('[ServiceBooking] Error:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Book Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        >
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Time Slot</Text>
            {timeSlots.map((slot) => (
              <Pressable
                key={slot.value}
                style={[
                  styles.slotCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  selectedTimeSlot === slot.value && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
                ]}
                onPress={() => setSelectedTimeSlot(slot.value)}
              >
                <Clock size={18} color={selectedTimeSlot === slot.value ? colors.primary : colors.textMuted} />
                <Text
                  style={[
                    styles.slotText,
                    { color: colors.text },
                    selectedTimeSlot === slot.value && { color: colors.primary, fontWeight: '600' as const },
                  ]}
                >
                  {slot.label}
                </Text>
                {selectedTimeSlot === slot.value && (
                  <CheckCircle size={18} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Number of Guests</Text>
            <View style={styles.guestSelector}>
              <Pressable
                style={[styles.guestBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setGuestCount(Math.max(5, guestCount - 5))}
              >
                <Text style={[styles.guestBtnText, { color: colors.text }]}>−</Text>
              </Pressable>
              <View style={[styles.guestDisplay, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Users size={18} color={colors.primary} />
                <Text style={[styles.guestCount, { color: colors.text }]}>{guestCount}</Text>
              </View>
              <Pressable
                style={[styles.guestBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setGuestCount(guestCount + 5)}
              >
                <Text style={[styles.guestBtnText, { color: colors.text }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.priceSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Price Summary</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.priceItem, { color: colors.text }]}>${pricePerPerson}/person × {guestCount} guests</Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>${totalPrice}</Text>
            </View>
            <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>${totalPrice}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.footerInfo}>
            <Text style={[styles.footerTotal, { color: colors.text }]}>${totalPrice}</Text>
            <Text style={[styles.footerGuests, { color: colors.textSecondary }]}>{guestCount} guests</Text>
          </View>
          <Pressable
            style={[
              styles.bookButton,
              { backgroundColor: colors.primary },
              (!selectedDate || !selectedTimeSlot || createServiceBookingMutation.isPending) && { opacity: 0.6 },
            ]}
            onPress={handleBook}
            disabled={!selectedDate || !selectedTimeSlot || createServiceBookingMutation.isPending}
          >
            {createServiceBookingMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            )}
          </Pressable>
        </View>

        {showSuccess && (
          <View style={styles.successOverlay}>
            <View style={[styles.successCard, { backgroundColor: colors.surface }]}>
              <CheckCircle size={48} color={colors.success} />
              <Text style={[styles.successTitle, { color: colors.text }]}>Service Booked!</Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                {selectedDate} • {guestCount} guests • ${totalPrice}
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
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  slotText: {
    flex: 1,
    fontSize: 15,
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
  priceSummary: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  priceItem: {
    fontSize: 14,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  priceDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerInfo: {
    gap: 2,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  footerGuests: {
    fontSize: 13,
  },
  bookButton: {
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 16,
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
