import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useCreateTableBooking } from '@/hooks/useApi';
import { CalendarDays, Users, ArrowLeft } from 'lucide-react-native';

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');

  const createBookingMutation = useCreateTableBooking();

  const handleSubmit = () => {
    if (date && guests) {
      createBookingMutation.mutate({
        restaurantId: 'general',
        date,
        time: '19:00',
        guests: parseInt(guests, 10) || 1,
      }, {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          console.error('Booking failed:', error);
        },
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Make a Booking</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <CalendarDays size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor={colors.placeholder}
            value={date}
            onChangeText={setDate}
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Users size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Number of Guests"
            placeholderTextColor={colors.placeholder}
            value={guests}
            onChangeText={setGuests}
            keyboardType="numeric"
          />
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.primary, opacity: createBookingMutation.isPending ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={createBookingMutation.isPending}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Book Now</Text>
          )}
        </Pressable>
      </View>
    </View>
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
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
