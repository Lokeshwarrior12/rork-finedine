import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, Lock, Phone, MapPin, X, ChevronRight, Star, Check, Shield } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { UserRole } from '@/types';
import { restaurants } from '@/mocks/data';

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
  const { role } = useLocalSearchParams<{ role: string }>();
  const { signUp } = useAuth();
  const signupPending = false;

  const isRestaurant = role === 'restaurant_owner';

  useEffect(() => {
    if (isRestaurant) {
      router.replace('/partner' as Href);
    }
  }, [isRestaurant, router]);

  const [step, setStep] = useState<'preferences' | 'details' | 'verify' | 'password'>('preferences');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');

  const [sendingCode] = useState(false);
  const [verifyingCode] = useState(false);

  const toggleCuisine = (cuisineId: string) => {
    if (selectedCuisines.includes(cuisineId)) {
      setSelectedCuisines(prev => prev.filter(c => c !== cuisineId));
    } else if (selectedCuisines.length < 3) {
      setSelectedCuisines(prev => [...prev, cuisineId]);
    }
  };

  const suggestedRestaurants = restaurants
    .filter(r => selectedCuisines.some(c => 
      r.cuisineType.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(r.cuisineType.toLowerCase())
    ))
    .slice(0, 3);

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

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setStep('password');
  };

  const handleSignup = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    try {
      const result = await signup(email, password, name, (role as UserRole) || 'customer');
      if (result.error) {
        setError(result.error);
        return;
      }
      if (isRestaurant) {
        router.replace('/(restaurant)/dashboard' as Href);
      } else {
        router.replace('/(customer)/home' as Href);
      }
    } catch {
      setError('Signup failed. Please try again.');
    }
  };

  if (!isRestaurant && step === 'preferences') {
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
              Select your 3 favorite cuisines and we&apos;ll suggest the best restaurants for you
            </Text>
          </View>

          <View style={styles.cuisineGrid}>
            {CUISINE_TYPES.map((cuisine) => (
              <Pressable
                key={cuisine.id}
                style={[
                  styles.cuisineCard,
                  selectedCuisines.includes(cuisine.id) && styles.cuisineCardSelected,
                ]}
                onPress={() => toggleCuisine(cuisine.id)}
              >
                <Text style={styles.cuisineEmoji}>{cuisine.emoji}</Text>
                <Text style={[
                  styles.cuisineName,
                  selectedCuisines.includes(cuisine.id) && styles.cuisineNameSelected,
                ]}>
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

          {selectedCuisines.length === 3 && suggestedRestaurants.length > 0 && (
            <View style={styles.suggestionsSection}>
              <Text style={styles.suggestionsTitle}>Top Picks for You</Text>
              {suggestedRestaurants.map((restaurant) => (
                <View key={restaurant.id} style={styles.suggestionCard}>
                  <Image
                    source={{ uri: restaurant.images[0] }}
                    style={styles.suggestionImage}
                    contentFit="cover"
                  />
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName}>{restaurant.name}</Text>
                    <Text style={styles.suggestionCuisine}>{restaurant.cuisineType}</Text>
                    <View style={styles.suggestionRating}>
                      <Star size={12} color={Colors.rating} fill={Colors.rating} />
                      <Text style={styles.suggestionRatingText}>{restaurant.rating}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

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

  if (!isRestaurant && step === 'details') {
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
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color={Colors.surface} />
            </Pressable>

            <View style={styles.header}>
              <Text style={styles.title}>Your Details</Text>
              <Text style={styles.subtitle}>
                Tell us about yourself to get started
              </Text>
            </View>

            <View style={styles.preferencesPreview}>
              <Text style={styles.preferencesLabel}>Your preferences:</Text>
              <View style={styles.preferencesChips}>
                {selectedCuisines.map(cuisineId => {
                  const cuisine = CUISINE_TYPES.find(c => c.id === cuisineId);
                  return cuisine ? (
                    <View key={cuisineId} style={styles.preferenceChip}>
                      <Text style={styles.preferenceChipText}>{cuisine.emoji} {cuisine.name}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <User size={20} color={Colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.textLight}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
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
                  placeholder="Address"
                  placeholderTextColor={Colors.textLight}
                  value={address}
                  onChangeText={setAddress}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[styles.signupButton, sendingCode && styles.signupButtonDisabled]}
                onPress={handleContinueFromDetails}
                disabled={sendingCode}
              >
                {sendingCode ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.signupButtonText}>Continue</Text>
                )}
              </Pressable>

              <Pressable style={styles.backLink} onPress={() => setStep('preferences')}>
                <Text style={styles.backLinkText}>← Back to preferences</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (!isRestaurant && step === 'verify') {
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
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color={Colors.surface} />
            </Pressable>

            <View style={styles.verifyContainer}>
              <View style={styles.verifyIconWrap}>
                <Mail size={48} color={Colors.surface} />
              </View>
              <Text style={styles.verifyTitle}>Verify Your Email</Text>
              <Text style={styles.verifySubtitle}>
                We&apos;ve sent a 6-digit code to{'\n'}
                <Text style={styles.verifyEmail}>{email}</Text>
              </Text>

              <View style={styles.codeInputContainer}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="000000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={[styles.signupButton, verifyingCode && styles.signupButtonDisabled]}
                onPress={handleVerifyCode}
                disabled={verifyingCode}
              >
                {verifyingCode ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.signupButtonText}>Verify Email</Text>
                )}
              </Pressable>

              <Pressable 
                style={styles.resendButton}
                onPress={() => console.log('Resend code for:', email)}
                disabled={sendingCode}
              >
                <Text style={styles.resendText}>
                  {sendingCode ? 'Sending...' : 'Resend Code'}
                </Text>
              </Pressable>

              <Pressable style={styles.backLink} onPress={() => setStep('details')}>
                <Text style={styles.backLinkText}>← Back</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (!isRestaurant && step === 'password') {
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
            <Pressable style={styles.closeButton} onPress={() => router.back()}>
              <X size={24} color={Colors.surface} />
            </Pressable>

            <View style={styles.verifyContainer}>
              <View style={[styles.verifyIconWrap, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
                <Shield size={48} color="#4CAF50" />
              </View>
              <Text style={styles.verifyTitle}>Almost Done!</Text>
              <Text style={styles.verifySubtitle}>
                Create a secure password to protect your account
              </Text>

              <View style={[styles.inputContainer, { width: '100%', marginTop: 20 }]}>
                <Lock size={20} color={Colors.textLight} style={styles.inputIcon} />
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
                style={[styles.signupButton, { width: '100%' }, signupPending && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={signupPending}
              >
                {signupPending ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </Pressable>

              <Pressable style={styles.backLink} onPress={() => setStep('verify')}>
                <Text style={styles.backLinkText}>← Back</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isRestaurant ? ['#1A1A2E', '#16213E'] : [Colors.primary, Colors.primaryDark]}
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              {isRestaurant ? 'Set up your restaurant account' : 'Join us and start saving'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
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
                placeholder="Address"
                placeholderTextColor={Colors.textLight}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={[styles.signupButton, signupPending && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={signupPending}
            >
              {signupPending ? (
                <ActivityIndicator color={isRestaurant ? Colors.surface : Colors.primary} />
              ) : (
                <Text style={[styles.signupButtonText, isRestaurant && { color: Colors.surface }]}>
                  Create Account
                </Text>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Pressable onPress={() => router.push(`/login?role=${role}` as Href)}>
                <Text style={styles.loginLink}>Sign In</Text>
              </Pressable>
            </View>

            {!isRestaurant && (
              <Pressable 
                style={styles.partnerButton}
                onPress={() => router.push('/partner' as Href)}
              >
                <Text style={styles.partnerButtonText}>Become a Partner Restaurant</Text>
              </Pressable>
            )}
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
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.surface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 22,
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
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
  cuisineEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  cuisineName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  cuisineNameSelected: {
    color: Colors.primary,
  },
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
  selectedCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  suggestionsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
    marginBottom: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  suggestionImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  suggestionCuisine: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  suggestionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  suggestionRatingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
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
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  preferencesPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  preferencesLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  preferencesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  preferenceChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  preferenceChipText: {
    fontSize: 13,
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
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: Colors.surface,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonDisabled: {
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
  },
  loginLink: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  partnerButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  partnerButtonText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.surface,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  verifyContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  verifyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  verifyTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.surface,
    marginBottom: 8,
  },
  verifySubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  verifyEmail: {
    color: Colors.surface,
    fontWeight: '600' as const,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    height: 64,
    fontSize: 32,
    fontWeight: '600' as const,
    color: Colors.surface,
    textAlign: 'center',
    letterSpacing: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resendButton: {
    marginTop: 16,
    padding: 12,
  },
  resendText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
