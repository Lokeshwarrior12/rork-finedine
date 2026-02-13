import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Phone,
  MapPin,
  Edit,
  Save,
  X,
  LogOut,
  ChevronRight,
  Bell,
  Lock,
  CreditCard,
  Heart,
  ShoppingBag,
  HelpCircle,
  Shield,
  Star,
  Gift,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
  loyaltyPoints?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  /* ---------------- FETCH PROFILE FROM REAL API ---------------- */
  const { data: profile, isLoading, isError } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const result = await api.getUserProfile();
      return result.data as unknown as UserProfile;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
    }
  }, [profile]);

  /* ---------------- UPDATE PROFILE VIA REAL API ---------------- */
  const updateMutation = useMutation({
    mutationFn: (payload: typeof formData) => api.updateUserProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  /* ---------------- SIGN OUT ---------------- */
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    updateMutation.mutate(formData);
  };

  /* ---------------- NOT LOGGED IN STATE ---------------- */
  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.notLoggedIn}>
          <User size={64} color="#ccc" />
          <Text style={styles.notLoggedInTitle}>Not Logged In</Text>
          <Text style={styles.notLoggedInText}>
            Sign in to view your profile and orders
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ---------------- LOADING STATE ---------------- */
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  /* ---------------- ERROR STATE ---------------- */
  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load profile</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={[Colors.primary, '#DC2F02']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0)?.toUpperCase() ||
                user.email?.charAt(0)?.toUpperCase() ||
                'U'}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{profile?.name || 'User'}</Text>
            <Text style={styles.headerEmail}>{user.email}</Text>
          </View>

          <Pressable onPress={() => setIsEditing(!isEditing)}>
            {isEditing ? (
              <X size={24} color="#fff" />
            ) : (
              <Edit size={24} color="#fff" />
            )}
          </Pressable>
        </View>

        {profile?.loyaltyPoints !== undefined && (
          <View style={styles.loyalty}>
            <Star size={18} color="#FFB800" fill="#FFB800" />
            <Text style={styles.loyaltyText}>
              {profile.loyaltyPoints} Loyalty Points
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* EDIT FORM */}
        {isEditing ? (
          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <View style={styles.inputContainer}>
                <User size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <View style={styles.inputContainer}>
                <Phone size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <View style={styles.inputContainer}>
                <MapPin size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Delivery Address"
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                />
              </View>
            </View>

            <Pressable
              style={[
                styles.saveButton,
                updateMutation.isPending && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            {/* PROFILE INFO */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              
              <View style={styles.infoRow}>
                <User size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{profile?.name || 'Not set'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Phone size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{profile?.phone || 'Not set'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={20} color={Colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{profile?.address || 'Not set'}</Text>
                </View>
              </View>
            </View>

            {/* MENU OPTIONS */}
            <View style={styles.menuSection}>
              <Pressable style={styles.menuItem}>
                <Bell size={22} color={Colors.textSecondary} />
                <Text style={styles.menuItemText}>Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#ccc', true: Colors.primary }}
                />
              </Pressable>

              <Pressable 
                style={styles.menuItem}
                onPress={() => router.push('/(customer)/favorites' as any)}
              >
                <Heart size={22} color={Colors.textSecondary} />
                <Text style={styles.menuItemText}>Favorites</Text>
                <ChevronRight size={22} color={Colors.textSecondary} />
              </Pressable>

              <Pressable 
                style={styles.menuItem}
                onPress={() => router.push('/(customer)/orders' as any)}
              >
                <ShoppingBag size={22} color={Colors.textSecondary} />
                <Text style={styles.menuItemText}>Order History</Text>
                <ChevronRight size={22} color={Colors.textSecondary} />
              </Pressable>

              <Pressable style={styles.menuItem}>
                <CreditCard size={22} color={Colors.textSecondary} />
                <Text style={styles.menuItemText}>Payment Methods</Text>
                <ChevronRight size={22} color={Colors.textSecondary} />
              </Pressable>

              <Pressable style={styles.menuItem}>
                <Gift size={22} color={Colors.textSecondary} />
                <Text style={styles.menuItemText}>Rewards</Text>
                <ChevronRight size={22} color={Colors.textSecondary} />
              </Pressable>

              <Pressable style={styles.menuItem}>
                <Shield size={22} color={Colors.textSecondary} />
                <Text style={styles.menuItemText}>Privacy & Security</Text>
                <ChevronRight size={22} color={Colors.textSecondary} />
              </Pressable>

              <Pressable style={styles.menuItem}>
                <HelpCircle size={22} color={Colors.textSecondary} />
                <Text style={styles.menuItemText}>Help & Support</Text>
                <ChevronRight size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* SIGN OUT BUTTON */}
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <LogOut size={20} color="#FF3B30" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: Colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  errorText: { fontSize: 18, color: Colors.error, textAlign: 'center' },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.primary, borderRadius: 12 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  notLoggedIn: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  notLoggedInTitle: { fontSize: 24, fontWeight: '700', color: Colors.text },
  notLoggedInText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
  loginButton: { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: Colors.primary, borderRadius: 12, marginTop: 8 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { paddingBottom: 20, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  headerName: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 2 },
  headerEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  loyalty: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  loyaltyText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 20 },
  editSection: { gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.surface,
  },
  input: { flex: 1, fontSize: 16, color: Colors.text },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  infoSection: { gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  menuSection: { gap: 4 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  menuItemText: { flex: 1, fontSize: 16, color: Colors.text, fontWeight: '500' },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 12,
    marginTop: 20,
  },
  signOutText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' },
});
