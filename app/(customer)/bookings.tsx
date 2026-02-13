// app/bookings.tsx
// Table Booking Screen with Real Backend Integration

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import {
  CalendarDays,
  Users,
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle,
} from 'lucide-react-native';

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { restaurantId, restaurantName } = useLocalSearchParams<{
    restaurantId?: string;
    restaurantName?: string;
  }>();

  // Form state
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState('2');
  const [notes, setNotes] = useState('');

  /* -----------------------------------------------------
     CREATE BOOKING MUTATION
  ----------------------------------------------------- */
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: {
      restaurantId: string;
      date: string;
      time: string;
      guests: number;
      notes?: string;
    }) => {
      console.log('📅 Creating booking:', bookingData);

      // Call real booking endpoint
      const response = await api.request<any>('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Booking created:', data);

      // Invalidate bookings cache
      queryClient.invalidateQueries({ queryKey: ['bookings'] });

      // Show success message
      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your table for ${guests} ${parseInt(guests) === 1 ? 'person' : 'people'} on ${date} at ${time} has been confirmed.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (error: any) => {
      console.error('❌ Booking failed:', error);

      Alert.alert(
        'Booking Failed',
        error.message || 'Unable to create booking. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  /* -----------------------------------------------------
     FORM VALIDATION
  ----------------------------------------------------- */
  const validateForm = (): boolean => {
    if (!date) {
      Alert.alert('Date Required', 'Please enter a booking date');
      return false;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert(
        'Invalid Date',
        'Please use format YYYY-MM-DD (e.g., 2026-02-15)'
      );
      return false;
    }

    // Check if date is in the future
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      Alert.alert('Invalid Date', 'Booking date must be in the future');
      return false;
    }

    if (!guests || parseInt(guests) < 1) {
      Alert.alert('Guests Required', 'Please enter number of guests (minimum 1)');
      return false;
    }

    if (parseInt(guests) > 20) {
      Alert.alert(
        'Large Party',
        'For parties larger than 20, please call the restaurant directly'
      );
      return false;
    }

    return true;
  };

  /* -----------------------------------------------------
     FORM SUBMISSION
  ----------------------------------------------------- */
  const handleSubmit = async () => {
    // Check authentication
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please sign in to make a booking',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.push('/login'),
          },
        ]
      );
      return;
    }

    // Validate form
    if (!validateForm()) return;

    // Create booking
    createBookingMutation.mutate({
      restaurantId: restaurantId || 'general',
      date,
      time,
      guests: parseInt(guests, 10),
      notes: notes.trim(),
    });
  };

  /* -----------------------------------------------------
     QUICK TIME SELECTION
  ----------------------------------------------------- */
  const timeSlots = [
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
  ];

  /* -----------------------------------------------------
     QUICK GUEST SELECTION
  ----------------------------------------------------- */
  const guestOptions = ['1', '2', '3', '4', '5', '6'];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Book a Table
          </Text>
          {restaurantName && (
            <Text style={[styles.restaurantName, { color: colors.textMuted }]}>
              {restaurantName}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Date</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <CalendarDays size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="YYYY-MM-DD (e.g., 2026-02-15)"
              placeholderTextColor={colors.placeholder}
              value={date}
              onChangeText={setDate}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Format: YYYY-MM-DD
          </Text>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Time</Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Clock size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="HH:MM (e.g., 19:00)"
              placeholderTextColor={colors.placeholder}
              value={time}
              onChangeText={setTime}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Quick Time Selection */}
          <View style={styles.quickOptions}>
            {timeSlots.map((slot) => (
              <Pressable
                key={slot}
                style={[
                  styles.quickOption,
                  {
                    backgroundColor:
                      time === slot ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setTime(slot)}
              >
                <Text
                  style={[
                    styles.quickOptionText,
                    { color: time === slot ? '#fff' : colors.text },
                  ]}
                >
                  {slot}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Guests Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Number of Guests
          </Text>
          <View
            style={[
              styles.inputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
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

          {/* Quick Guest Selection */}
          <View style={styles.quickOptions}>
            {guestOptions.map((count) => (
              <Pressable
                key={count}
                style={[
                  styles.quickOption,
                  {
                    backgroundColor:
                      guests === count ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setGuests(count)}
              >
                <Text
                  style={[
                    styles.quickOptionText,
                    { color: guests === count ? '#fff' : colors.text },
                  ]}
                >
                  {count}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Special Requests */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            Special Requests (Optional)
          </Text>
          <View
            style={[
              styles.textAreaContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <MapPin size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder="e.g., Window seat, high chair needed, dietary restrictions..."
              placeholderTextColor={colors.placeholder}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: colors.primary,
              opacity: createBookingMutation.isPending ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={createBookingMutation.isPending}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.buttonText}>Confirm Booking</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* -----------------------------------------------------
   STYLES
----------------------------------------------------- */

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
    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  restaurantName: {
    fontSize: 14,
    marginTop: 2,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
    gap: 24,
  },

  section: {
    gap: 12,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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

  hint: {
    fontSize: 12,
    marginTop: 4,
  },

  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },

  quickOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },

  quickOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  textAreaContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    minHeight: 100,
  },

  textArea: {
    flex: 1,
    fontSize: 16,
  },

  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

/* -----------------------------------------------------
   BOOKING FLOW:
   
   1. User navigates from restaurant detail screen
   2. Form pre-fills restaurant ID and name (if provided)
   3. User selects date, time, and number of guests
   4. User optionally adds special requests
   5. User taps "Confirm Booking"
   6. Frontend validates form data
   7. Call: api.createBooking(bookingData)
   8. Backend creates booking in database
   9. Success: Show confirmation alert
   10. Navigate back to previous screen
   
   BACKEND CONNECTION:
   api.createBooking(bookingData)
     ↓
   POST /api/v1/bookings
   Headers: { Authorization: Bearer <JWT_TOKEN> }
   Body: { restaurantId, date, time, guests, notes }
     ↓
   Backend: Extract userID from JWT token
     ↓
   Database: INSERT INTO bookings (...) VALUES (...)
     ↓
   Response: { data: { id, restaurantId, userId, date, time, guests, status: "confirmed" } }
----------------------------------------------------- */} color="#fff" />
              <Text style={styles.buttonText}>Confirm Booking</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* -----------------------------------------------------
   STYLES
----------------------------------------------------- */

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
    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  restaurantName: {
    fontSize: 14,
    marginTop: 2,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
    gap: 24,
  },

  section: {
    gap: 12,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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

  hint: {
    fontSize: 12,
    marginTop: 4,
  },

  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },

  quickOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },

  quickOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    minHeight: 100,
  },

  textArea: {
    flex: 1,
    fontSize: 16,
    minHeight: 80,
  },

  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

/* -----------------------------------------------------
   BOOKING FLOW:
   
   1. User navigates from restaurant detail screen
   2. Form pre-fills restaurant info if available
   3. User selects date, time, number of guests
   4. User adds special requests (optional)
   5. User taps "Confirm Booking"
   6. Frontend validates form
   7. Checks authentication (redirect to login if needed)
   8. Call: api.createBooking(bookingData)
   
   BACKEND CONNECTION:
   api.createBooking(bookingData)
     ↓
   POST /api/v1/bookings
   Headers: { Authorization: Bearer <JWT_TOKEN> }
   Body: {
     restaurantId: string,
     date: string (YYYY-MM-DD),
     time: string (HH:MM),
     guests: number,
     notes?: string
   }
     ↓
   Backend: Extract userID from JWT token
     ↓
   Database: INSERT INTO bookings (...) VALUES (...) RETURNING *
     ↓
   Response: { data: Booking }
     ↓
   Frontend: Show success alert → Navigate back
   
   NOTE: This is a placeholder implementation. In production,
   you would implement the full booking API endpoint in the backend.
----------------------------------------------------- */} color="#fff" />
              <Text style={styles.buttonText}>Confirm Booking</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* -----------------------------------------------------
   STYLES
----------------------------------------------------- */

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
    borderBottomWidth: 1,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
  },

  restaurantName: {
    fontSize: 14,
    marginTop: 2,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 20,
    gap: 24,
  },

  section: {
    gap: 8,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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

  hint: {
    fontSize: 12,
    marginTop: 4,
  },

  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },

  quickOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },

  quickOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  textAreaContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },

  textArea: {
    flex: 1,
    fontSize: 16,
    minHeight: 80,
  },

  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
