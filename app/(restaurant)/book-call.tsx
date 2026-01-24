import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Phone,
  Calendar,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  X,
  Headphones,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

const topics = [
  { id: 'setup', label: 'Setup Help', desc: 'Get help setting up your restaurant profile' },
  { id: 'technical', label: 'Technical Support', desc: 'Issues with the app or features' },
  { id: 'marketing', label: 'Marketing Tips', desc: 'Learn how to attract more customers' },
  { id: 'payment', label: 'Payment Issues', desc: 'Help with subscription or payments' },
  { id: 'other', label: 'Other', desc: 'Any other questions or concerns' },
];

const timeSlots = [
  'Morning (9AM - 12PM)',
  'Afternoon (12PM - 5PM)',
  'Evening (5PM - 8PM)',
];

export default function BookCallScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      full: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
  });

  const handleSubmit = async () => {
    if (!name || !phone || !selectedTopic || !selectedDate || !selectedTime) {
      return;
    }
    
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);
  };

  const resetForm = () => {
    setSelectedTopic('');
    setSelectedDate('');
    setSelectedTime('');
    setMessage('');
    setShowSuccess(false);
  };

  const isFormValid = name && phone && selectedTopic && selectedDate && selectedTime;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <LinearGradient
          colors={[Colors.secondary, '#2D2D4A']}
          style={styles.header}
        >
          <View style={styles.headerIcon}>
            <Headphones size={32} color={Colors.surface} />
          </View>
          <Text style={styles.headerTitle}>Book a Call</Text>
          <Text style={styles.headerSubtitle}>
            Schedule a call with our support team. We are here to help you succeed!
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Details</Text>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <User size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputGroup}>
              <View style={styles.inputIcon}>
                <Phone size={20} color={Colors.textSecondary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What do you need help with?</Text>
            <View style={styles.topicsGrid}>
              {topics.map((topic) => (
                <Pressable
                  key={topic.id}
                  style={[
                    styles.topicCard,
                    selectedTopic === topic.id && styles.topicCardActive,
                  ]}
                  onPress={() => setSelectedTopic(topic.id)}
                >
                  <Text style={[
                    styles.topicLabel,
                    selectedTopic === topic.id && styles.topicLabelActive,
                  ]}>
                    {topic.label}
                  </Text>
                  <Text style={[
                    styles.topicDesc,
                    selectedTopic === topic.id && styles.topicDescActive,
                  ]}>
                    {topic.desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select a Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.datesRow}>
                {dates.map((d) => (
                  <Pressable
                    key={d.full}
                    style={[
                      styles.dateCard,
                      selectedDate === d.full && styles.dateCardActive,
                    ]}
                    onPress={() => setSelectedDate(d.full)}
                  >
                    <Text style={[
                      styles.dateDay,
                      selectedDate === d.full && styles.dateDayActive,
                    ]}>
                      {d.day}
                    </Text>
                    <Text style={[
                      styles.dateNumber,
                      selectedDate === d.full && styles.dateNumberActive,
                    ]}>
                      {d.date}
                    </Text>
                    <Text style={[
                      styles.dateMonth,
                      selectedDate === d.full && styles.dateMonthActive,
                    ]}>
                      {d.month}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Time</Text>
            <View style={styles.timeSlots}>
              {timeSlots.map((slot) => (
                <Pressable
                  key={slot}
                  style={[
                    styles.timeSlot,
                    selectedTime === slot && styles.timeSlotActive,
                  ]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Clock size={16} color={selectedTime === slot ? Colors.surface : Colors.textSecondary} />
                  <Text style={[
                    styles.timeSlotText,
                    selectedTime === slot && styles.timeSlotTextActive,
                  ]}>
                    {slot}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
            <View style={styles.textareaContainer}>
              <MessageSquare size={20} color={Colors.textSecondary} style={styles.textareaIcon} />
              <TextInput
                style={styles.textarea}
                placeholder="Tell us more about what you need help with..."
                placeholderTextColor={Colors.textLight}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          <Pressable
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <Calendar size={20} color={Colors.surface} />
            <Text style={styles.submitButtonText}>Schedule Call</Text>
          </Pressable>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>What to expect:</Text>
            <Text style={styles.infoText}>
              • Our team will call you at your preferred time{'\n'}
              • Calls typically last 15-30 minutes{'\n'}
              • You will receive a confirmation email{'\n'}
              • Reschedule anytime if needed
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showSuccess} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Pressable style={styles.modalClose} onPress={resetForm}>
              <X size={24} color={Colors.text} />
            </Pressable>
            
            <View style={styles.successIcon}>
              <CheckCircle size={48} color={Colors.surface} />
            </View>
            <Text style={styles.successTitle}>Call Scheduled!</Text>
            <Text style={styles.successText}>
              We have scheduled your call for{'\n'}
              <Text style={styles.successHighlight}>{selectedDate}</Text>{'\n'}
              during {selectedTime}
            </Text>
            <Text style={styles.successNote}>
              You will receive a confirmation email shortly with all the details.
            </Text>
            
            <Pressable style={styles.doneButton} onPress={resetForm}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    lineHeight: 22,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    color: Colors.text,
  },
  topicsGrid: {
    gap: 10,
  },
  topicCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  topicLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  topicLabelActive: {
    color: Colors.surface,
  },
  topicDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  topicDescActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  datesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCard: {
    width: 72,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateDayActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateNumber: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dateNumberActive: {
    color: Colors.surface,
  },
  dateMonth: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateMonthActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  timeSlots: {
    gap: 10,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: 15,
    color: Colors.text,
  },
  timeSlotTextActive: {
    color: Colors.surface,
    fontWeight: '500' as const,
  },
  textareaContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  textareaIcon: {
    marginBottom: 8,
  },
  textarea: {
    fontSize: 15,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  infoBox: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  successText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  successHighlight: {
    fontWeight: '600' as const,
    color: Colors.text,
  },
  successNote: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    marginTop: 24,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
