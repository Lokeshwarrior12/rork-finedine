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
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Store, 
  Mail, 
  Lock, 
  X, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Calendar, 
  BarChart3,
  Utensils,
  Shield,
  Star,
  ArrowRight,
  Phone,
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Real-time insights & reports' },
  { icon: Users, title: 'Customer Management', desc: 'Build lasting relationships' },
  { icon: Calendar, title: 'Table Booking System', desc: 'Automated reservations' },
  { icon: BarChart3, title: 'Inventory Tracking', desc: 'Smart stock management' },
  { icon: Utensils, title: 'Menu Management', desc: 'Digital menu builder' },
  { icon: Shield, title: 'Secure Platform', desc: 'Enterprise-grade security' },
];

const TESTIMONIALS = [
  { name: 'Raj Patel', restaurant: 'Spice Garden', quote: 'Increased our bookings by 40%!' },
  { name: 'Maria Santos', restaurant: 'Casa Bella', quote: 'The analytics changed everything.' },
];

export default function PartnerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, isLoading: signupPending } = useAuth();

  const [step, setStep] = useState<'info' | 'verify' | 'signup'>('info');
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const handleSendCode = async () => {
    setIsLoadingCode(true);
    setError('');
    try {
      // TODO: Implement actual API call when backend endpoint is ready
      // await api.sendVerificationCode({ email });
      
      // For now, simulate success
      console.log('Verification code would be sent to:', email);
      setStep('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoadingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    
    setIsVerifyingCode(true);
    setError('');
    try {
      // TODO: Implement actual API call when backend endpoint is ready
      // await api.verifyCode({ email, code: verificationCode });
      
      // For now, simulate success
      console.log('Verifying code:', verificationCode, 'for email:', email);
      setStep('signup');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleContinueToVerify = () => {
    if (!restaurantName || !ownerName || !email || !phone) {
      setError('Please fill in all fields');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    handleSendCode();
  };

  const handleSignup = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    try {
      const result = await signUp(email, password, ownerName, 'restaurant_owner');
      if (result.error) {
        setError(result.error);
        return;
      }
      router.replace('/(restaurant)/dashboard' as Href);
    } catch {
      setError('Signup failed. Please try again.');
    }
  };

  const renderInfoStep = () => (
    <>
      <View style={styles.heroSection}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceLabel}>Partnership Fee</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>$</Text>
            <Text style={styles.price}>399</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.priceNote}>Cancel anytime</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>500+</Text>
          <Text style={styles.statLabel}>Partners</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>40%</Text>
          <Text style={styles.statLabel}>Avg Growth</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.9</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Everything You Need</Text>
      <View style={styles.featuresGrid}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={styles.featureIconWrap}>
              <feature.icon size={20} color={Colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </View>
        ))}
      </View>

      <View style={styles.testimonialsSection}>
        <Text style={styles.sectionTitle}>What Partners Say</Text>
        {TESTIMONIALS.map((t, index) => (
          <View key={index} style={styles.testimonialCard}>
            <View style={styles.testimonialStars}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={14} color="#FFB800" fill="#FFB800" />
              ))}
            </View>
            <Text style={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</Text>
            <Text style={styles.testimonialAuthor}>{t.name}</Text>
            <Text style={styles.testimonialRestaurant}>{t.restaurant}</Text>
          </View>
        ))}
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Get Started Today</Text>
        
        <View style={styles.inputContainer}>
          <Store size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Restaurant Name"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={restaurantName}
            onChangeText={setRestaurantName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Users size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Owner Name"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={ownerName}
            onChangeText={setOwnerName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Mail size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Phone size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable 
          style={styles.primaryButton} 
          onPress={handleContinueToVerify}
          disabled={isLoadingCode}
        >
          {isLoadingCode ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ArrowRight size={20} color="#1A1A2E" />
            </>
          )}
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already a partner? </Text>
          <Pressable onPress={() => router.push('/login?role=restaurant_owner' as Href)}>
            <Text style={styles.loginLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  const renderVerifyStep = () => (
    <View style={styles.verifyContainer}>
      <View style={styles.verifyIconWrap}>
        <Mail size={48} color={Colors.primary} />
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
        style={styles.primaryButton} 
        onPress={handleVerifyCode}
        disabled={isVerifyingCode}
      >
        {isVerifyingCode ? (
          <ActivityIndicator color="#1A1A2E" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify Email</Text>
        )}
      </Pressable>

      <Pressable 
        style={styles.resendButton}
        onPress={handleSendCode}
        disabled={isLoadingCode}
      >
        <Text style={styles.resendText}>
          {isLoadingCode ? 'Sending...' : 'Resend Code'}
        </Text>
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => setStep('info')}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </View>
  );

  const renderSignupStep = () => (
    <View style={styles.signupContainer}>
      <View style={styles.verifyIconWrap}>
        <CheckCircle size={48} color={Colors.success} />
      </View>
      <Text style={styles.verifyTitle}>Email Verified!</Text>
      <Text style={styles.verifySubtitle}>
        Create a secure password to complete your registration
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Restaurant</Text>
          <Text style={styles.summaryValue}>{restaurantName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Owner</Text>
          <Text style={styles.summaryValue}>{ownerName}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Email</Text>
          <Text style={styles.summaryValue}>{email}</Text>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Lock size={20} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Create Password (min 6 chars)"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable 
        style={styles.primaryButton} 
        onPress={handleSignup}
        disabled={signupPending}
      >
        {signupPending ? (
          <ActivityIndicator color="#1A1A2E" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Complete Registration</Text>
            <ArrowRight size={20} color="#1A1A2E" />
          </>
        )}
      </Pressable>

      <Pressable style={styles.backButton} onPress={() => setStep('verify')}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0F1A', '#1A1A2E', '#16213E']}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="#fff" />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Store size={28} color="#fff" />
            </View>
            <Text style={styles.title}>Partner with FineDine</Text>
            <Text style={styles.subtitle}>
              Join 500+ restaurants growing with our platform
            </Text>
          </View>

          {step === 'info' && renderInfoStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'signup' && renderSignupStep()}
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceBadge: {
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600' as const,
    marginTop: 4,
  },
  price: {
    fontSize: 56,
    color: '#fff',
    fontWeight: '700' as const,
  },
  pricePeriod: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    marginLeft: 4,
  },
  priceNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  testimonialsSection: {
    marginBottom: 24,
  },
  testimonialCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  testimonialQuote: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  testimonialAuthor: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
  testimonialRestaurant: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  form: {
    gap: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A2E',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  verifyContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  verifyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  verifySubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  verifyEmail: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  codeInputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    height: 60,
    fontSize: 28,
    fontWeight: '600' as const,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resendButton: {
    marginTop: 16,
    padding: 12,
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  backButton: {
    marginTop: 8,
    padding: 12,
  },
  backText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
  },
  signupContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500' as const,
  },
});
