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
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  X, 
  ChevronRight, 
  Star, 
  Check,
  Shield,
  ArrowLeft,
} from 'lucide-react-native';
import { Image } from 'expo-image';

import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { UserRole } from '@/types';

const { width } = Dimensions.get('window');

const CUISINE_TYPES = [
  { id: 'indian', name: 'Indian', emoji: '🍛' },
  { id: 'italian', name: 'Italian', emoji: '🍝' },
  { id: 'chinese', name: 'Chinese', emoji: '🥡' },
  { id: 'japanese', name: 'Japanese', emoji: '🍱' },
  { id: 'thai', name: 'Thai', emoji: '🍜' },
  { id: 'mexican', name: 'Mexican', emoji: '🌮' },
  { id: 'american', name: 'American', emoji: '🍔' },
  { id: 'mediterranean', name: 'Mediterranean', emoji: '🥙' },
  { id: 'korean', name: 'Korean', emoji: '🍲' },
  { id: 'french', name: 'French', emoji: '🥐' },
  { id: 'vietnamese', name: 'Vietnamese', emoji: '🍲' },
  { id: 'middle_eastern', name: 'Middle Eastern', emoji: '🧆' },
];

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const { signup, signupPending } = useAuth();

  const isCustomer = !role || role === 'customer';

  const [step, setStep] = useState<'preferences' | 'details' | 'password'>(
    isCustomer ? 'preferences' : 'details'
  );
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const toggleCuisine = (cuisineId: string) => {
    if (selectedCuisines.includes(cuisineId)) {
      setSelectedCuisines((prev) => prev.filter((c) => c !== cuisineId));
    } else if (selectedCuisines.length < 3) {
      setSelectedCuisines((prev) => [...prev, cuisineId]);
    }
  };

  const handleContinueFromPreferences = () => {
    if (selectedCuisines.length < 3) {
      setError('Please select 3 cuisine preferences');
      return;
    }
    setError('');
    setStep('details');
  };

  const handleContinueFromDetails = () => {
    if (!name || !email || !phone || !address) {
      setError('Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    setStep('password');
  };

  const handleSignup = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');

    try {
      // Sign up with real backend API
      await signup({
        email,
        password,
        name,
        phone,
        role: (role as UserRole) || 'customer',
      });

      // Navigate based on role
      if (role === 'restaurant_owner') {
        router.replace('/(restaurant)/dashboard' as Href);
      } else {
        router.replace('/(customer)/home' as Href);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    }
  };

  /* ---------------- STEP 1: CUISINE PREFERENCES (Customer Only) ---------------- */
  if (isCustomer && step === 'preferences') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color={Colors.surface} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>What do you love?</Text>
            <Text style={styles.subtitle}>
              Select your 3 favorite cuisines to personalize your experience
            </Text>
          </View>

          <View style={styles.cuisineGrid}>
            {CUISINE_TYPES.map((cuisine) => (
              <Pressable
                key={cuisine.id}
                style={[
                  styles.cuisineCard,
                  selectedCuisines.includes(cuisine.id) &&
                    styles.cuisineCardSelected,
                ]}
                onPress={() => toggleCuisine(cuisine.id)}
              >
                <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                <Text
                  style={[
                    styles.cuisineName,
                    selectedCuisines.includes(cuisine.id) &&
                      styles.cuisineNameSelected,
                  ]}
                >
                  {cuisine.name}
                </Text>
                {selectedCuisines.includes(cuisine.id) && (
                  <View style={styles.selectedBadge}>
                    <Check size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Text style={styles.selectedCount}>
            {selectedCuisines.length}/3 selected
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={[
              styles.continueButton,
              selectedCuisines.length < 3 && styles.continueButtonDisabled,
            ]}
            onPress={handleContinueFromPreferences}
            disabled={selectedCuisines.length < 3}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <ChevronRight size={20} color={Colors.primary} />
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  /* ---------------- STEP 2: PERSONAL DETAILS ---------------- */
  if (step === 'details') {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
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
            {isCustomer ? (
              <Pressable
                style={styles.backButton}
                onPress={() => setStep('preferences')}
              >
                <ArrowLeft size={24} color={Colors.surface} />
              </Pressable>
            ) : (
              <Pressable style={styles.closeButton} onPress={() => router.back()}>
                <X size={24} color={Colors.surface} />
              </Pressable>
            )}

            <View style={styles.header}>
              <Text style={styles.title}>Your Details</Text>
              <Text style={styles.subtitle}>
                Tell us about yourself to get started
              </Text>
            </View>

            {isCustomer && selectedCuisines.length > 0 && (
              <View style={styles.preferencesPreview}>
                <Text style={styles.preferencesLabel}>Your preferences:</Text>
                <View style={styles.preferencesChips}>
                  {selectedCuisines.map((cuisineId) => {
                    const cuisine = CUISINE_TYPES.find((c) => c.id === cuisineId);
                    return cuisine ? (
                      <View key={cuisineId} style={styles.preferenceChip}>
                        <Text style={styles.preferenceChipText}>
                          {cuisine.emoji} {cuisine.name}
                        </Text>
                      </View>
                    ) : null;
                  })}
                </View>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <User
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={Colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Phone
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
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
                <MapPin
                  size={20}
                  color={Colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Address"
                  placeholderTextColor={Colors.textLight}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={styles.signupButton}
                onPress={handleContinueFromDetails}
              >
                <Text style={styles.signupButtonText}>Continue</Text>
                <ChevronRight size={20} color={Colors.primary} />
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  /* ---------------- STEP 3: PASSWORD ---------------- */
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
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
          <Pressable
            style={styles.backButton}
            onPress={() => setStep('details')}
          >
            <ArrowLeft size={24} color={Colors.surface} />
          </Pressable>

          <View style={styles.verifyContainer}>
            <View
              style={[
                styles.verifyIconWrap,
                { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
              ]}
            >
              <Shield size={48} color="#4CAF50" />
            </View>
            <Text style={styles.verifyTitle}>Almost Done!</Text>
            <Text style={styles.verifySubtitle}>
              Create a secure password to protect your account
            </Text>

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Name</Text>
                <Text style={styles.summaryValue}>{name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Email</Text>
                <Text style={styles.summaryValue}>{email}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Phone</Text>
                <Text style={styles.summaryValue}>{phone}</Text>
              </View>
            </View>

            <View style={[styles.inputContainer, { width: '100%' }]}>
              <Lock
                size={20}
                color={Colors.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Create Password (min 6 chars)"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[
                styles.signupButton,
                { width: '100%' },
                signupPending && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={signupPending}
            >
              {signupPending ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Text style={styles.signupButtonText}>Create Account</Text>
                  <ChevronRight size={20} color={Colors.primary} />
                </>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Pressable onPress={() => router.push(`/login?role=${role}` as Href)}>
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  header: { marginTop: 20, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '700', color: Colors.surface, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 22 },
  cuisineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  cuisineCard: {
    width: (width - 68) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cuisineCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: Colors.surface,
  },
  cuisineEmoji: { fontSize: 28, marginBottom: 6 },
  cuisineName: { fontSize: 12, fontWeight: '600', color: Colors.surface },
  cuisineNameSelected: { color: Colors.primary },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCount: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginBottom: 20 },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { fontSize: 18, fontWeight: '600', color: Colors.primary },
  preferencesPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  preferencesLabel: { fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', marginBottom: 8 },
  preferencesChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preferenceChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  preferenceChipText: { fontSize: 13, color: Colors.surface },
  form: { gap: 14 },
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
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: Colors.surface },
  errorText: { color: Colors.error, fontSize: 14, textAlign: 'center' },
  signupButton: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonDisabled: { opacity: 0.7 },
  signupButtonText: { fontSize: 18, fontWeight: '600', color: Colors.primary },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 15 },
  loginLink: { color: Colors.surface, fontSize: 15, fontWeight: '600' },
  verifyContainer: { alignItems: 'center', paddingTop: 40 },
  verifyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  verifyTitle: { fontSize: 26, fontWeight: '700', color: Colors.surface, marginBottom: 8 },
  verifySubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' },
  summaryValue: { fontSize: 13, color: Colors.surface, fontWeight: '500' },
});
