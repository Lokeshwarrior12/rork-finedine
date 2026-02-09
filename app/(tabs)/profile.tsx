import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Phone, MapPin, LogOut, Save } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  const updateMutation = useMutation({
    mutationFn: () => updateProfile({ name, phone, address }),
    onSuccess: () => {
      Alert.alert('Success', 'Profile updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update profile');
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <User size={18} color="#666" />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color="#666" />
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputContainer}>
              <Phone size={18} color="#666" />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.inputContainer}>
              <MapPin size={18} color="#666" />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Delivery address"
                multiline
              />
            </View>
          </View>

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={updateMutation.isPending}>
            <Save size={18} color="#fff" />
            <Text style={styles.saveButtonText}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#E63946" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 28, fontWeight: '700', color: '#333' },
  content: { padding: 16 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' },
  emailText: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#666' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E63946',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E63946',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#E63946' },
});
