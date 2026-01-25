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
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { UserRole } from '@/types';
import { trpc, checkServerConnection } from '@/lib/trpc';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { login, loginPending } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [seedMessage, setSeedMessage] = useState('');
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const seedMutation = trpc.auth.seedDatabase.useMutation({
    onSuccess: () => {
      setSeedMessage('Sample users created! You can now login.');
      console.log('Database seeded successfully');
    },
    onError: (err) => {
      console.error('Seed error:', err);
      setSeedMessage('Seeding complete (users may already exist)');
    },
  });

  const isRestaurant = role === 'restaurant_owner';

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    
    setIsCheckingConnection(true);
    const isConnected = await checkServerConnection();
    setIsCheckingConnection(false);
    
    if (!isConnected) {
      setError('Unable to connect to server. Please check your internet connection or try again later.');
      return;
    }
    
    try {
      await login({ email, password, role: (role as UserRole) || 'customer' });
      if (isRestaurant) {
        router.replace('/(restaurant)/dashboard' as any);
      } else {
        router.replace('/(customer)/home' as any);
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err instanceof Error) {
        if (err.message.includes('Unable to connect') || err.message.includes('Failed to fetch')) {
          setError('Server connection failed. Please try again later.');
        } else if (err.message.includes('not found') || err.message.includes('NOT_FOUND')) {
          setError('User not found. Please sign up first.');
        } else if (err.message.includes('password') || err.message.includes('UNAUTHORIZED')) {
          setError('Invalid email or password.');
        } else if (err.message.includes('role')) {
          setError('Account exists with different role. Please select correct role.');
        } else {
          setError(err.message || 'Login failed. Please try again.');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              {isRestaurant ? 'Sign in to manage your restaurant' : 'Sign in to discover amazing deals'}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isRestaurant ? "Restaurant Email" : "Email"}
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
              style={[styles.loginButton, (loginPending || isCheckingConnection) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loginPending || isCheckingConnection}
            >
              {loginPending || isCheckingConnection ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.loadingText}>
                    {isCheckingConnection ? 'Connecting...' : 'Signing in...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <Pressable onPress={() => router.push(`/signup?role=${role}`)}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </Pressable>
            </View>

            <View style={styles.testAccountsSection}>
              <Text style={styles.testAccountsTitle}>Test Accounts</Text>
              <Text style={styles.testAccountInfo}>
                Customer: b14175705@gmail.com
              </Text>
              <Text style={styles.testAccountInfo}>
                Restaurant: lokeshwarrior12@gmail.com
              </Text>
              <Text style={styles.testAccountInfo}>
                Password: Daddy@2502
              </Text>
              
              {seedMessage ? (
                <Text style={styles.seedMessage}>{seedMessage}</Text>
              ) : null}
              
              <Pressable
                style={[styles.seedButton, seedMutation.isPending && styles.seedButtonDisabled]}
                onPress={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                {seedMutation.isPending ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <Text style={styles.seedButtonText}>Initialize Test Users</Text>
                )}
              </Pressable>
            </View>
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
    marginTop: 40,
    marginBottom: 40,
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
  },
  form: {
    gap: 16,
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.surface,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
  },
  signupLink: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  testAccountsSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  testAccountsTitle: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
    textAlign: 'center',
  },
  testAccountInfo: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  seedMessage: {
    color: Colors.success,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  seedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  seedButtonDisabled: {
    opacity: 0.6,
  },
  seedButtonText: {
    color: Colors.surface,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '500' as const,
  },
});
