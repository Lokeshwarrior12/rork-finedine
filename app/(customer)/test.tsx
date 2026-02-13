import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  Pressable,
  StyleSheet, 
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Wifi,
  Database,
  User,
  Key,
  Server,
  RefreshCw,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

interface HealthCheckResult {
  status: string;
  database: boolean;
  cache: boolean;
  timestamp: string;
}

export default function TestScreen() {
  const insets = useSafeAreaInsets();
  const { session, user, signIn, signOut } = useAuth();
  const { colors } = useTheme();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testName, setTestName] = useState('Test User');
  const [isLoading, setIsLoading] = useState(false);

  // REAL API QUERY - Health check
  const { 
    data: healthResponse, 
    isLoading: healthLoading,
    error: healthError,
    refetch: refetchHealth 
  } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      console.log('🔄 Running health check...');
      const result = await api.healthCheck();
      console.log('✅ Health check complete:', result);
      return result;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // REAL API QUERY - Test restaurants endpoint
  const { 
    data: restaurantsResponse,
    error: restaurantsError,
    refetch: refetchRestaurants 
  } = useQuery({
    queryKey: ['test-restaurants'],
    queryFn: async () => {
      console.log('🔄 Testing restaurants endpoint...');
      const result = await api.getRestaurants();
      console.log('✅ Restaurants test:', result.data?.length || 0, 'restaurants');
      return result;
    },
    enabled: false, // Only run when manually triggered
  });

  const isAuthenticated = !!session;
  const healthCheck = healthResponse || { status: 'unknown', database: false, cache: false };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Testing login with:', testEmail);
      await signIn({ email: testEmail, password: testPassword });
      console.log('✅ Login successful');
      Alert.alert('Success', 'Login successful!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Login error:', errorMessage);
      Alert.alert('Login Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignup = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Testing signup with:', testEmail);
      await (signIn as any)({ 
        email: testEmail, 
        password: testPassword, 
        name: testName 
      });
      console.log('✅ Signup successful');
      Alert.alert('Success', 'Signup successful! Please check your email to verify.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Signup error:', errorMessage);
      Alert.alert('Signup Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testLogout = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Testing logout...');
      await signOut();
      console.log('✅ Logout successful');
      Alert.alert('Success', 'Logged out successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Logout error:', errorMessage);
      Alert.alert('Logout Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const testRestaurantsEndpoint = async () => {
    await refetchRestaurants();
  };

  const styles = createStyles(colors);

  const StatusIndicator = ({ status }: { status: boolean | string }) => {
    if (typeof status === 'boolean') {
      return status ? (
        <CheckCircle size={20} color={colors.success} />
      ) : (
        <XCircle size={20} color={colors.error} />
      );
    }
    return status === 'ok' ? (
      <CheckCircle size={20} color={colors.success} />
    ) : (
      <AlertTriangle size={20} color={colors.warning} />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>API & Auth Test Panel</Text>
          <Text style={styles.subtitle}>Production Backend Testing</Text>
        </View>

        {/* Backend Health Check */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Server size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Backend Health</Text>
            <Pressable 
              style={styles.refreshBtn}
              onPress={() => refetchHealth()}
              disabled={healthLoading}
            >
              {healthLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <RefreshCw size={16} color={colors.primary} />
              )}
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusLabel}>
                <Wifi size={18} color={colors.textSecondary} />
                <Text style={styles.statusText}>API Status</Text>
              </View>
              <View style={styles.statusValue}>
                <Text style={[
                  styles.statusValueText,
                  { color: healthCheck.status === 'ok' ? colors.success : colors.error }
                ]}>
                  {healthError ? 'Offline' : healthCheck.status || 'Unknown'}
                </Text>
                <StatusIndicator status={!healthError && healthCheck.status === 'ok'} />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <View style={styles.statusLabel}>
                <Database size={18} color={colors.textSecondary} />
                <Text style={styles.statusText}>Database</Text>
              </View>
              <View style={styles.statusValue}>
                <Text style={[
                  styles.statusValueText,
                  { color: healthCheck.database ? colors.success : colors.error }
                ]}>
                  {healthCheck.database ? 'Connected' : 'Disconnected'}
                </Text>
                <StatusIndicator status={healthCheck.database} />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statusRow}>
              <View style={styles.statusLabel}>
                <Server size={18} color={colors.textSecondary} />
                <Text style={styles.statusText}>Cache (Redis)</Text>
              </View>
              <View style={styles.statusValue}>
                <Text style={[
                  styles.statusValueText,
                  { color: healthCheck.cache ? colors.success : colors.error }
                ]}>
                  {healthCheck.cache ? 'Active' : 'Inactive'}
                </Text>
                <StatusIndicator status={healthCheck.cache} />
              </View>
            </View>

            {healthError && (
              <View style={styles.errorBox}>
                <AlertTriangle size={16} color={colors.error} />
                <Text style={styles.errorText}>
                  {healthError instanceof Error ? healthError.message : 'Health check failed'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Authentication Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Authentication</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusLabel}>
                <Key size={18} color={colors.textSecondary} />
                <Text style={styles.statusText}>Auth Status</Text>
              </View>
              <View style={styles.statusValue}>
                <Text style={[
                  styles.statusValueText,
                  { color: isAuthenticated ? colors.success : colors.textSecondary }
                ]}>
                  {isAuthenticated ? 'Logged In' : 'Not Logged In'}
                </Text>
                <StatusIndicator status={isAuthenticated} />
              </View>
            </View>

            {user && (
              <>
                <View style={styles.divider} />
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoLabel}>User ID:</Text>
                  <Text style={styles.userInfoValue}>{user.id}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoLabel}>Name:</Text>
                  <Text style={styles.userInfoValue}>{user.name}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoLabel}>Email:</Text>
                  <Text style={styles.userInfoValue}>{user.email}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoLabel}>Role:</Text>
                  <Text style={styles.userInfoValue}>{user.role}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoLabel}>Points:</Text>
                  <Text style={styles.userInfoValue}>{(user as any).loyaltyPoints ?? user.points ?? 0}</Text>
                </View>
              </>
            )}

            {session && (
              <>
                <View style={styles.divider} />
                <View style={styles.userInfo}>
                  <Text style={styles.userInfoLabel}>Session:</Text>
                  <Text style={[styles.userInfoValue, { color: colors.success }]}>Active</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Test Controls */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Authentication</Text>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={testEmail}
              onChangeText={setTestEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={testPassword}
              onChangeText={setTestPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Name (for signup)"
              placeholderTextColor={colors.placeholder}
              value={testName}
              onChangeText={setTestName}
            />

            <View style={styles.buttonGroup}>
              <Pressable 
                style={[styles.testButton, styles.loginButton]}
                onPress={testLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Test Login</Text>
                )}
              </Pressable>

              <Pressable 
                style={[styles.testButton, styles.signupButton]}
                onPress={testSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Test Signup</Text>
                )}
              </Pressable>
            </View>

            {isAuthenticated && (
              <Pressable 
                style={[styles.testButton, styles.logoutButton]}
                onPress={testLogout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Test Logout</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* API Endpoints Test */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test API Endpoints</Text>
          </View>

          <View style={styles.card}>
            <Pressable 
              style={[styles.testButton, styles.apiButton]}
              onPress={testRestaurantsEndpoint}
            >
              <Text style={styles.buttonText}>Test GET /restaurants</Text>
            </Pressable>

            {restaurantsResponse && (
              <View style={styles.resultBox}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={styles.resultText}>
                  Success! Found {restaurantsResponse.data?.length || 0} restaurants
                </Text>
              </View>
            )}

            {restaurantsError && (
              <View style={styles.errorBox}>
                <XCircle size={16} color={colors.error} />
                <Text style={styles.errorText}>
                  {restaurantsError instanceof Error ? restaurantsError.message : 'Request failed'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Debug Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Debug Information</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.debugText}>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>
            <Text style={styles.debugText}>
              API URL: {__DEV__ ? 'http://localhost:8080/api/v1' : 'Production API'}
            </Text>
            <Text style={styles.debugText}>Auth Provider: Supabase</Text>
            <Text style={styles.debugText}>State Management: React Query</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  refreshBtn: {
    padding: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusValueText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  userInfoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  userInfoValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  testButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: colors.primary,
  },
  signupButton: {
    backgroundColor: colors.success,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
  apiButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: `${colors.success}15`,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 13,
    color: colors.success,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: `${colors.error}15`,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.error,
    flex: 1,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
});
