import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store, Mail, Phone, MapPin, X, Calendar, CheckCircle, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function PartnerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name || !email || !phone || !address) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.successContent, { paddingTop: insets.top + 60 }]}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color={Colors.success} />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successText}>
            Thank you for your interest in partnering with DineDeals. Our team will review your application.
          </Text>
          <View style={styles.verificationCard}>
            <Clock size={24} color={Colors.accent} />
            <Text style={styles.verificationText}>
              Verification may take up to 24 hours. We&apos;ll notify you via email.
            </Text>
          </View>
          <Pressable style={styles.bookCallButton}>
            <Calendar size={20} color={Colors.surface} />
            <Text style={styles.bookCallText}>Book a Call with Our Team</Text>
          </Pressable>
          <Pressable style={styles.doneButton} onPress={() => router.replace('/')}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.surface} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.partnerIcon}>
              <Store size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Become a Partner</Text>
            <Text style={styles.subtitle}>
              Join our network of restaurants and reach thousands of hungry customers
            </Text>
          </View>

          <View style={styles.pricingCard}>
            <Text style={styles.pricingTitle}>Partnership Plan</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>$500</Text>
              <Text style={styles.pricePeriod}>/year</Text>
            </View>
            <View style={styles.features}>
              {['Unlimited deals & coupons', 'Analytics dashboard', 'Table booking system', 'Priority support'].map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <CheckCircle size={16} color={Colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Store size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Restaurant Name"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Business Email"
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Phone size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <MapPin size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Restaurant Address"
                placeholderTextColor={Colors.textLight}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Application</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  partnerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(232, 93, 4, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.surface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pricingTitle: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  pricePeriod: {
    fontSize: 16,
    color: Colors.textLight,
    marginLeft: 4,
  },
  features: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: Colors.surface,
  },
  form: {
    gap: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.surface,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  successContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.surface,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 183, 3, 0.1)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  verificationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accent,
    lineHeight: 20,
  },
  bookCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
  },
  bookCallText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  doneButton: {
    paddingVertical: 12,
  },
  doneButtonText: {
    fontSize: 16,
    color: Colors.textLight,
  },
});
