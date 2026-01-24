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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  Clock,
  Edit2,
  Trash2,
  X,
  Utensils,
  ShoppingBag,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { deals } from '@/mocks/data';
import { useAuth } from '@/contexts/AuthContext';

export default function OffersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [offerType, setOfferType] = useState<'dinein' | 'pickup' | 'both'>('both');
  const [maxCoupons, setMaxCoupons] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [isActive, setIsActive] = useState(true);

  const restaurantDeals = deals.filter(d => d.restaurantId === user?.restaurantId);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDiscount('');
    setOfferType('both');
    setMaxCoupons('');
    setMinOrder('');
    setIsActive(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Offers</Text>
        <Pressable style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus size={20} color={Colors.surface} />
          <Text style={styles.addButtonText}>New Offer</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {restaurantDeals.map((deal) => (
          <View key={deal.id} style={styles.offerCard}>
            <View style={styles.offerHeader}>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{deal.discountPercent}%</Text>
              </View>
              <View style={[
                styles.statusBadge,
                deal.isActive ? styles.statusActive : styles.statusInactive
              ]}>
                <Text style={[
                  styles.statusText,
                  deal.isActive ? styles.statusTextActive : styles.statusTextInactive
                ]}>
                  {deal.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.offerTitle}>{deal.title}</Text>
            
            <View style={styles.offerMeta}>
              <View style={styles.metaItem}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.metaText}>{deal.validTill}</Text>
              </View>
              <View style={styles.metaItem}>
                {deal.offerType === 'dinein' ? (
                  <Utensils size={14} color={Colors.textSecondary} />
                ) : (
                  <ShoppingBag size={14} color={Colors.textSecondary} />
                )}
                <Text style={styles.metaText}>
                  {deal.offerType === 'dinein' ? 'Dine In' : deal.offerType === 'pickup' ? 'Pickup' : 'Both'}
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Claimed</Text>
                <Text style={styles.progressValue}>{deal.claimedCoupons}/{deal.maxCoupons}</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(deal.claimedCoupons / deal.maxCoupons) * 100}%` }
                  ]} 
                />
              </View>
            </View>

            <View style={styles.offerActions}>
              <Pressable style={styles.actionButton}>
                <Edit2 size={18} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={[styles.actionButton, styles.deleteButton]}>
                <Trash2 size={18} color={Colors.error} />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Offer</Text>
            <Pressable onPress={() => { setShowModal(false); resetForm(); }}>
              <X size={24} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Offer Title</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., 30% Off Weekend Brunch"
                placeholderTextColor={Colors.textLight}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Describe your offer..."
                placeholderTextColor={Colors.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Discount %</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="30"
                  placeholderTextColor={Colors.textLight}
                  value={discount}
                  onChangeText={setDiscount}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Min Order $</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="25"
                  placeholderTextColor={Colors.textLight}
                  value={minOrder}
                  onChangeText={setMinOrder}
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
                      offerType === type.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setOfferType(type.value as 'dinein' | 'pickup' | 'both')}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      offerType === type.value && styles.typeButtonTextActive,
                    ]}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Max Coupons</Text>
              <TextInput
                style={styles.formInput}
                placeholder="100"
                placeholderTextColor={Colors.textLight}
                value={maxCoupons}
                onChangeText={setMaxCoupons}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Activate immediately</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable 
                style={styles.cancelButton}
                onPress={() => { setShowModal(false); resetForm(); }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.createOfferButton}>
                <Text style={styles.createOfferButtonText}>Create Offer</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  offerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: `${Colors.success}15`,
  },
  statusInactive: {
    backgroundColor: Colors.surfaceAlt,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  statusTextActive: {
    color: Colors.success,
  },
  statusTextInactive: {
    color: Colors.textSecondary,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  offerMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  deleteButton: {
    backgroundColor: `${Colors.error}10`,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: Colors.surface,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  createOfferButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  createOfferButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
