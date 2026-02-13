import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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

import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface ProfileResponse {
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
  loyaltyPoints?: number;
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

  /* ---------------- FETCH PROFILE ---------------- */
  const { data: profile, isLoading, isError } = useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: () => apiFetch('/api/v1/profile'),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
      });
    }
  }, [profile]);

  /* ---------------- UPDATE PROFILE ---------------- */
  const updateMutation = useMutation({
    mutationFn: (payload: typeof formData) =>
      apiFetch('/api/v1/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
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
          } catch {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  /* ---------------- STATES ---------------- */
  if (!user) {
    return (
      <View style={styles.center}>
        <User size={64} color="#ccc" />
        <Text style={styles.title}>Not Logged In</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.primaryText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 10 }}>Loading profile…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text>Failed to load profile</Text>
      </View>
    );
  }

  /* ---------------- UI ---------------- */
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
              {profile?.name?.charAt(0) ??
                user.email?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>{profile?.name ?? 'User'}</Text>
            <Text style={styles.headerEmail}>{user.email}</Text>
          </View>

          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            {isEditing ? <X color="#fff" /> : <Edit color="#fff" />}
          </TouchableOpacity>
        </View>

        {profile?.loyaltyPoints !== undefined && (
          <View style={styles.loyalty}>
            <Star size={18} color="#FFB800" />
            <Text style={{ color: '#fff' }}>
              {profile.loyaltyPoints} Points
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* EDIT FORM */}
        {isEditing && (
          <>
            {['name', 'phone', 'address'].map((field) => (
              <TextInput
                key={field}
                placeholder={field}
                style={styles.input}
                value={(formData as any)[field]}
                onChangeText={(t) =>
                  setFormData({ ...formData, [field]: t })
                }
              />
            ))}

            <TouchableOpacity
              style={styles.primaryBtn}
              disabled={updateMutation.isPending}
              onPress={() => updateMutation.mutate(formData)}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Save</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* SIGN OUT */}
        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <LogOut size={18} color="#FF3B30" />
          <Text style={{ color: '#FF3B30', marginLeft: 6 }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, marginTop: 10 },

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

  headerName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerEmail: { color: 'rgba(255,255,255,0.8)' },

  loyalty: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '600' },

  signOut: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 10,
  },
});
