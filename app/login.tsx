// app/login.tsx
// Unified Login & Signup Screen with Real Supabase Authentication

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Store,
  User,
  Shield,
  ArrowLeft,
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

type LoginRole = 'customer' | 'restaurant_owner' | 'admin';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signup, loading: isAuthLoading } = useAuth();
  const { role: urlRole } = useLocalSearchParams<{ role?: LoginRole }>();

  // Form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole>(urlRole || 'customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync URL role param with selected role
  useEffect(() => {
    if (urlRole && urlRole !== selectedRole) {
      setSelectedRole(urlRole);
    }
  }, [urlRole]);

  // Dev mode: Pre-fill credentials
  useEffect(() => {
    if (__DEV__) {
      // Uncomment to test quickly:
      // setEmail('customer@test.com');
      // setPassword('password123');
    }
  }, []);

  const roles = [
    {
      key: 'customer' as LoginRole,
      icon: User,
      label: 'Customer',
      description: 'Order food & discover deals',
    },
    {
      key: 'restaurant_owner' as LoginRole,
      icon: Store,
      label: 'Restaurant Owner',
      description: 'Manage your restaurant',
    },
    {
      key: 'admin' as LoginRole,
      icon: Shield,
      label: 'Admin',
      description: 'Platform administration',
    },
  ];

  /* -----------------------------------------------------
     FORM VALIDATION
  ----------------------------------------------------- */
  const validateForm = (): boolean => {
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (isSignUp && !name.trim()) {
      setError('Full name is required');
      return false;
    }

    return true;
  };

  /* -----------------------------------------------------
     FORM SUBMISSION
  ----------------------------------------------------- */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      if (isSignUp) {
        // SIGN UP - Create new account
        console.log('📝 Signing up user:', { email, role: selectedRole });

        await signup({
          email: email.trim(),
          password,
          name: name.trim(),
          role: selectedRole,
        });

        console.log('✅ Sign up successful');

        // Navigate based on role
        if (selectedRole === 'restaurant_owner') {
          router.replace('/(restaurant)/dashboard' as Href);
        } else {
          router.replace('/(customer)/home' as Href);
        }
      } else {
        // SIGN IN - Authenticate existing user
        console.log('🔐 Signing in user:', email);

        await signIn({
          email: email.trim(),
          password,
        });

        console.log('✅ Sign in successful');

        router.replace('/(customer)/home' as Href);
      }
    } catch (err: any) {
      console.error('❌ Auth error:', err);

      // User-friendly error messages
      let errorMessage = 'Authentication failed. Please try again.';

      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (err.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in.';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email to confirm your account';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Show alert for critical errors
      if (err.message?.includes('network') || err.message?.includes('timeout')) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -----------------------------------------------------
     FORGOT PASSWORD
  ----------------------------------------------------- */
  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your email address first.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Password reset link will be sent to ${email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            // TODO: Implement password reset via Supabase
            Alert.alert('Success', 'Check your email for reset link!');
          },
        },
      ]
    );
  };

  /* -----------------------------------------------------
     CONTINUE AS GUEST
  ----------------------------------------------------- */
  const handleGuestContinue = () => {
    console.log('👤 Continuing as guest');
    router.replace('/(customer)/home' as Href);
  };

  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */
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
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 40,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.surface} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Store size={40} color={Colors.surface} />
            </View>
            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp ? 'Sign up to get started' : 'Sign in to continue'}
            </Text>
          </View>

          {/* Role Selection (Sign Up Only) */}
          {isSignUp && (
            <View style={styles.roleSection}>
              <Text style={styles.roleTitle}>Select Role</Text>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.key}
                  style={[
                    styles.roleCard,
                    selectedRole === role.key && styles.roleCardActive,
                  ]}
                  onPress={() => setSelectedRole(role.key)}
                >
                  <role.icon
                    size={20}
                    color={
                      selectedRole === role.key
                        ? Colors.primary
                        : 'rgba(255,255,255,0.6)'
                    }
                  />
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleLabel}>{role.label}</Text>
                    <Text style={styles.roleDescription}>
                      {role.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input (Sign Up Only) */}
            {isSignUp && (
              <View style={styles.inputContainer}>
                <User size={20} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Mail size={20} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Lock size={20} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="rgba(255,255,255,0.5)" />
                ) : (
                  <Eye size={20} color="rgba(255,255,255,0.5)" />
                )}
              </TouchableOpacity>
            </View>

            {/* Forgot Password (Sign In Only) */}
            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (isSubmitting || isAuthLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || isAuthLoading}
            >
              {isSubmitting || isAuthLoading ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                  <ArrowRight size={18} color="#1A1A2E" />
                </>
              )}
            </TouchableOpacity>

            {/* Toggle Sign In / Sign Up */}
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleText}>
                {isSignUp
                  ? 'Already have an account? '
                  : "Don't have an account? "}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
              >
                <Text style={styles.toggleLink}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Guest Continue (Sign In + Customer Only) */}
            {!isSignUp && selectedRole === 'customer' && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.guestButton}
                  onPress={handleGuestContinue}
                >
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.surface,
  },

  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },

  roleSection: {
    marginBottom: 24,
  },

  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
    marginBottom: 12,
  },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(232,93,4,0.1)',
  },

  roleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },

  roleLabel: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },

  roleDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },

  form: {
    gap: 16,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  input: {
    flex: 1,
    marginLeft: 12,
    color: Colors.surface,
    fontSize: 16,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
  },

  forgotPasswordText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  errorContainer: {
    backgroundColor: 'rgba(244,67,54,0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
  },

  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 14,
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  submitButtonDisabled: {
    opacity: 0.6,
  },

  submitButtonText: {
    fontWeight: '700',
    color: '#1A1A2E',
    fontSize: 16,
  },

  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  toggleText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },

  toggleLink: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  dividerText: {
    marginHorizontal: 10,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },

  guestButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  guestButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
});

/* -----------------------------------------------------
   AUTHENTICATION FLOW:
   
   SIGN UP:
   1. User fills form (email, password, name, role)
   2. Frontend validates input
   3. Call: signup({ email, password, name, role })
   4. AuthContext → supabase.auth.signUp()
   5. Supabase creates user in auth.users table
   6. Database trigger creates user in public.users table
   7. Session created, access_token returned
   8. api.setAuthToken(access_token)
   9. Navigate to home screen based on role
   
   SIGN IN:
   1. User enters email + password
   2. Frontend validates input
   3. Call: signIn({ email, password })
   4. AuthContext → supabase.auth.signInWithPassword()
   5. Supabase validates credentials
   6. Returns: { user, session, access_token }
   7. Fetch user role from database
   8. api.setAuthToken(access_token)
   9. Navigate to home screen based on role
   
   BACKEND CONNECTION:
   - Supabase Auth API: https://qtmvztgxfvqmqekdhnxw.supabase.co/auth/v1
   - Database: PostgreSQL public.users table
   - All subsequent API calls include: Authorization: Bearer <token>
----------------------------------------------------- */
