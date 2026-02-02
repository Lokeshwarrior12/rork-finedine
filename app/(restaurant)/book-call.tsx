import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Phone,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  Video,
  Headphones,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
];

const dates = ['Today', 'Tomorrow', 'Jan 15', 'Jan 16', 'Jan 17'];

const callTypes = [
  { id: 'phone', label: 'Phone Call', icon: Phone, description: 'Quick voice call' },
  { id: 'video', label: 'Video Call', icon: Video, description: 'Face-to-face meeting' },
  { id: 'support', label: 'Support Chat', icon: Headphones, description: 'Live text support' },
];

export default function BookCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  useAuth();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCallType, setSelectedCallType] = useState('phone');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select a date and time for your call.');
      return;
    }

    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const styles = createStyles(colors, isDark);

  if (isSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Call Scheduled!</Text>
          <Text style={styles.successMessage}>
            We&apos;ll call you on {selectedDate} at {selectedTime}
          </Text>
          <View style={styles.successDetails}>
            <View style={styles.successDetailRow}>
              <Calendar size={18} color={colors.textSecondary} />
              <Text style={styles.successDetailText}>{selectedDate}</Text>
            </View>
            <View style={styles.successDetailRow}>
              <Clock size={18} color={colors.textSecondary} />
              <Text style={styles.successDetailText}>{selectedTime}</Text>
            </View>
            {topic && (
              <View style={styles.successDetailRow}>
                <MessageSquare size={18} color={colors.textSecondary} />
                <Text style={styles.successDetailText}>{topic}</Text>
              </View>
            )}
          </View>
          <Text style={styles.successNote}>
            You&apos;ll receive a confirmation email with call details.
          </Text>
          <Pressable 
            style={styles.successButton}
            onPress={() => router.back()}
          >
            <Text style={styles.successButtonText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Book a Call</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        <Text style={styles.sectionLabel}>Call Type</Text>
        <View style={styles.callTypeGrid}>
          {callTypes.map((type) => (
            <Pressable
              key={type.id}
              style={[
                styles.callTypeCard,
                selectedCallType === type.id && styles.callTypeCardActive,
              ]}
              onPress={() => setSelectedCallType(type.id)}
            >
              <View style={[
                styles.callTypeIcon,
                selectedCallType === type.id && styles.callTypeIconActive
              ]}>
                <type.icon 
                  size={24} 
                  color={selectedCallType === type.id ? '#fff' : colors.primary} 
                />
              </View>
              <Text style={[
                styles.callTypeLabel,
                selectedCallType === type.id && styles.callTypeLabelActive
              ]}>
                {type.label}
              </Text>
              <Text style={styles.callTypeDesc}>{type.description}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Select Date</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          {dates.map((date) => (
            <Pressable
              key={date}
              style={[
                styles.dateChip,
                selectedDate === date && styles.dateChipActive,
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateChipText,
                selectedDate === date && styles.dateChipTextActive,
              ]}>
                {date}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Select Time</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time) => (
            <Pressable
              key={time}
              style={[
                styles.timeChip,
                selectedTime === time && styles.timeChipActive,
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeChipText,
                selectedTime === time && styles.timeChipTextActive,
              ]}>
                {time}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Topic (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="What would you like to discuss?"
          placeholderTextColor={colors.placeholder}
          value={topic}
          onChangeText={setTopic}
        />

        <Text style={styles.sectionLabel}>Additional Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any additional information..."
          placeholderTextColor={colors.placeholder}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <Pressable 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Phone size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Schedule Call</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          Our support team is available Monday - Friday, 9 AM - 6 PM IST.
          You&apos;ll receive a confirmation email once your call is scheduled.
        </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
    marginTop: 20,
  },
  callTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  callTypeCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  callTypeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  callTypeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  callTypeIconActive: {
    backgroundColor: colors.primary,
  },
  callTypeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  callTypeLabelActive: {
    color: colors.primary,
  },
  callTypeDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dateScroll: {
    gap: 10,
  },
  dateChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.text,
  },
  dateChipTextActive: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.text,
  },
  timeChipTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  successDetails: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successDetailText: {
    fontSize: 15,
    color: colors.text,
  },
  successNote: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
