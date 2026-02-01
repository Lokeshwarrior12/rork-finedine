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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, X, Eye, EyeOff } from 'lucide-react-native';

import Colors from '@/constants/colors';
// UserRole type available from @/types if needed
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: string }>();

  const isRestaurant = role === 'restaurant_owner';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Authentication service not configured.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        const message = authError.message.toLowerCase();

        if (message.includes('invalid') || message.includes('credentials')) {
          setError('Invalid email or password.');
        } else if (message.includes('not confirmed')) {
          setError('Please verify your email before logging in.');
        } else if (message.includes('timeout') || message.includes('fetch')) {
          setError('Network error. Please try again.');
        } else {
          setError(authError.message);
        }
        return;
      }

      if (!data.session || !data.user) {
        setError('Login failed. Please try again.');
        return;
      }

      // 🔁 Navigate by role
      if (isRestaurant) {
        router.replace('/(restaurant)/dashboard' as any);
      } else {
        router.replace('/(customer)/home' as any);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isRestaurant
            ? ['#1A1A2E', '#16213E']
            : [Colors.primary, Colors.primaryDark]
        }
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {isRestaurant
                ? 'Sign in to manage your restaurant'
                : 'Sign in to discover amazing deals'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isRestaurant ? 'Restaurant Email' : 'Email'}
                placeholderTextColor={Colors.textLight}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
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
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textLight} />
                ) : (
                  <Eye size={20} color={Colors.textLight} />
                )}
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>

            <Pressable
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>Signing in…</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <Pressable
                onPress={() => {
                  if (isRestaurant) {
                    router.push('/partner' as any);
                  } else {
                    router.push(`/signup?role=${role}` as any);
                  }
                }}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </Pressable>
            </View>

            {!isRestaurant && (
              <Pressable
                style={styles.partnerButton}
                onPress={() => router.push('/partner' as any)}
              >
                <Text style={styles.partnerButtonText}>
                  Become a Partner Restaurant
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------- STYLES (UNCHANGED) ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  header: { marginTop: 40, marginBottom: 40 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: Colors.surface },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  forgotPassword: { alignSelf: 'flex-end' },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.surface,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginButtonDisabled: { opacity: 0.7 },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  signupLink: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  partnerButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  partnerButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.surface,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});
