// app/(restaurant)/offers.tsx
// Offers & Deals Management - REAL DATABASE INTEGRATION

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Clock, Edit2, Trash2, X, Utensils, ShoppingBag, AlertCircle } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

interface Offer {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  discountPercent: number;
  offerType: 'dinein' | 'pickup' | 'both';
  maxCoupons: number;
  claimedCoupons: number;
  minOrder: number;
  validTill: string;
  isActive: boolean;
}

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const restaurantId = user?.restaurantId || '';

  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercent: '',
    offerType: 'both' as 'dinein' | 'pickup' | 'both',
    maxCoupons: '',
    minOrder: '',
    validTill: '',
    isActive: true,
  });

  // REAL DATA: Fetch offers from database
  const { data: offersData, isLoading, error, refetch } = useQuery({
    queryKey: ['offers', restaurantId],
    queryFn: () => api.getRestaurantOffers(restaurantId),
    enabled: !!restaurantId,
  });

  // REAL DATA: Create offer
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createOffer(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', restaurantId] });
      setShowModal(false);
      resetForm();
      Alert.alert('Success', 'Offer created');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Update offer
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateOffer(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', restaurantId] });
      setShowModal(false);
      resetForm();
      Alert.alert('Success', 'Offer updated');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Delete offer
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers', restaurantId] });
      Alert.alert('Success', 'Offer deleted');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const offers = (offersData?.data || []) as Offer[];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      discountPercent: '',
      offerType: 'both',
      maxCoupons: '',
      minOrder: '',
      validTill: '',
      isActive: true,
    });
    setEditingOffer(null);
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      discountPercent: offer.discountPercent.toString(),
      offerType: offer.offerType,
      maxCoupons: offer.maxCoupons.toString(),
      minOrder: offer.minOrder.toString(),
      validTill: offer.validTill,
      isActive: offer.isActive,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.discountPercent || !formData.maxCoupons) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }

    const offerData = {
      title: formData.title,
      description: formData.description,
      discountPercent: parseInt(formData.discountPercent),
      offerType: formData.offerType,
      maxCoupons: parseInt(formData.maxCoupons),
      minOrder: parseFloat(formData.minOrder) || 0,
      validTill: formData.validTill,
      isActive: formData.isActive,
    };

    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, ...offerData });
    } else {
      createMutation.mutate(offerData);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Offer', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Offers</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Offers</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Offers</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Something went wrong'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Offers</Text>
        <Pressable style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>New Offer</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {offers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Offers Yet</Text>
            <Text style={styles.emptyText}>Create your first offer to attract customers</Text>
          </View>
        ) : (
          offers.map((offer) => (
            <View key={offer.id} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{offer.discountPercent}%</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    offer.isActive ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      offer.isActive ? styles.statusTextActive : styles.statusTextInactive,
                    ]}
                  >
                    {offer.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <Text style={styles.offerTitle}>{offer.title}</Text>

              <View style={styles.offerMeta}>
                <View style={styles.metaItem}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{offer.validTill}</Text>
                </View>
                <View style={styles.metaItem}>
                  {offer.offerType === 'dinein' ? (
                    <Utensils size={14} color={colors.textSecondary} />
                  ) : (
                    <ShoppingBag size={14} color={colors.textSecondary} />
                  )}
                  <Text style={styles.metaText}>
                    {offer.offerType === 'dinein'
                      ? 'Dine In'
                      : offer.offerType === 'pickup'
                      ? 'Pickup'
                      : 'Both'}
                  </Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Claimed</Text>
                  <Text style={styles.progressValue}>
                    {offer.claimedCoupons}/{offer.maxCoupons}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${(offer.claimedCoupons / offer.maxCoupons) * 100}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.offerActions}>
                <Pressable style={styles.actionButton} onPress={() => handleEdit(offer)}>
                  <Edit2 size={18} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => handleDelete(offer.id)}
                >
                  <Trash2 size={18} color={colors.error} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingOffer ? 'Edit Offer' : 'Create New Offer'}
            </Text>
            <Pressable
              onPress={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              <X size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Offer Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 30% Off Weekend Brunch"
                placeholderTextColor={colors.textMuted}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Describe your offer..."
                placeholderTextColor={colors.textMuted}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Discount % *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="30"
                  placeholderTextColor={colors.textMuted}
                  value={formData.discountPercent}
                  onChangeText={(text) =>
                    setFormData({ ...formData, discountPercent: text })
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Min Order $</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="25"
                  placeholderTextColor={colors.textMuted}
                  value={formData.minOrder}
                  onChangeText={(text) => setFormData({ ...formData, minOrder: text })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Offer Type</Text>
              <View style={styles.typeButtons}>
                {[
                  { value: 'dinein', label: 'Dine In' },
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'both', label: 'Both' },
                ].map((type) => (
                  <Pressable
                    key={type.value}
                    style={[
                      styles.typeButton,
                      formData.offerType === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        offerType: type.value as 'dinein' | 'pickup' | 'both',
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        formData.offerType === type.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Max Coupons *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="100"
                  placeholderTextColor={colors.textMuted}
                  value={formData.maxCoupons}
                  onChangeText={(text) => setFormData({ ...formData, maxCoupons: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Valid Till</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  value={formData.validTill}
                  onChangeText={(text) => setFormData({ ...formData, validTill: text })}
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Activate immediately</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(val) => setFormData({ ...formData, isActive: val })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.createOfferButton}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createOfferButtonText}>
                    {editingOffer ? 'Update Offer' : 'Create Offer'}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 24, fontWeight: '700', color: colors.text },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 6,
    },
    addButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
    errorMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginVertical: 12 },
    retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.textSecondary },
    offerCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    offerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    discountBadge: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    discountText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    statusActive: { backgroundColor: colors.successLight },
    statusInactive: { backgroundColor: colors.backgroundSecondary },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextActive: { color: colors.success },
    statusTextInactive: { color: colors.textSecondary },
    offerTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 10 },
    offerMeta: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, color: colors.textSecondary },
    progressContainer: { marginBottom: 16 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 13, color: colors.textSecondary },
    progressValue: { fontSize: 13, fontWeight: '600', color: colors.text },
    progressBar: {
      height: 6,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 3 },
    offerActions: { flexDirection: 'row', gap: 12 },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.backgroundSecondary,
      gap: 6,
    },
    actionButtonText: { fontSize: 14, fontWeight: '500', color: colors.primary },
    deleteButton: { backgroundColor: colors.errorLight },
    deleteButtonText: { color: colors.error },
    modalContainer: { flex: 1, backgroundColor: colors.background },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    modalTitle: { fontSize: 20, fontWeight: '600', color: colors.text },
    modalContent: { padding: 20 },
    formGroup: { marginBottom: 20 },
    formLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    formInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formTextarea: { minHeight: 100, textAlignVertical: 'top' },
    formRow: { flexDirection: 'row', gap: 12 },
    typeButtons: { flexDirection: 'row', gap: 10 },
    typeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeButtonText: { fontSize: 14, fontWeight: '500', color: colors.text },
    typeButtonTextActive: { color: '#fff' },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    switchLabel: { fontSize: 16, color: colors.text },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
    },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: colors.text },
    createOfferButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    createOfferButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  });
