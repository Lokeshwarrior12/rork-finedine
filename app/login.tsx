// app/login.tsx
// Unified Login & Signup Screen with Role-Based Authentication

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
import { useRouter, useLocalSearchParams } from 'expo-router';
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
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

type LoginRole = 'customer' | 'restaurant_owner' | 'admin';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signup, loading: isLoading, signInPending, signupPending } = useAuth();
  const { role: urlRole } = useLocalSearchParams<{ role?: LoginRole }>();

  const [isSignUp, setIsSignUp] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole>(
    urlRole || 'customer'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlRole) {
      setSelectedRole(urlRole);
    }
  }, [urlRole]);

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

  const validateForm = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!email.includes('@')) {
      setError('Enter a valid email');
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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setError('');

    try {
      let result: { user: { role: string } | null; error: null };

      if (isSignUp) {
        const role = selectedRole === 'admin' ? 'customer' : selectedRole;
          result = await signup({ email, password, name, role }).then(() => ({ user: { role: selectedRole }, error: null }));
      } else {
        result = await signIn({ email, password }).then(() => ({ user: null, error: null }));
      }

      // Role-based navigation
      const userRole = isSignUp ? selectedRole : 'customer';

      if (userRole === 'restaurant_owner') {
        router.replace('/(restaurant)/dashboard' as any);
      } else {
        router.replace('/(customer)/home' as any);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Reset Password', 'Coming soon!');
  };

  const handleGuestContinue = () => {
    router.replace('/(customer)/home');
  };

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
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Store size={40} color="#fff" />
            </View>
            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Sign up to get started'
                : 'Sign in to continue'}
            </Text>
          </View>

          {/* Role Selection (Sign Up only) */}
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
                  <View style={{ marginLeft: 12 }}>
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
            {isSignUp && (
              <View style={styles.inputContainer}>
                <User size={20} color="rgba(255,255,255,0.5)" />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

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
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="rgba(255,255,255,0.5)" />
                ) : (
                  <Eye size={20} color="rgba(255,255,255,0.5)" />
                )}
              </TouchableOpacity>
            </View>

            {!isSignUp && (
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSignUp ? signupPending : signInPending}
            >
              {(isSignUp ? signupPending : signInPending) ? (
                <ActivityIndicator color="#1A1A2E" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Text>
                  <ArrowRight size={18} color="#1A1A2E" />
                </>
              )}
            </TouchableOpacity>

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
                  <Text style={styles.guestButtonText}>
                    Continue as Guest
                  </Text>
                </TouchableOpacity>
              </>
            )}
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

  header: { alignItems: 'center', marginBottom: 32 },

  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },

  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 6,
  },

  roleSection: { marginBottom: 24 },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },

  roleCardActive: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  roleLabel: { color: '#fff', fontWeight: '600' },
  roleDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },

  form: { gap: 16 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 14,
  },

  input: { flex: 1, marginLeft: 12, color: '#fff' },

  forgotPassword: { alignSelf: 'flex-end' },

  forgotPasswordText: {
    color: Colors.primary,
    fontWeight: '600',
  },

  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
  },

  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 14,
    gap: 8,
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

  toggleText: { color: 'rgba(255,255,255,0.6)' },

  toggleLink: {
    color: Colors.primary,
    fontWeight: '600',
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
  },

  guestButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
