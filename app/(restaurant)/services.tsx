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
import { Plus, Edit2, Trash2, X, Users, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { services, bookingSlots } from '@/mocks/data';

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [pricePerPerson, setPricePerPerson] = useState('');
  const [minGuests, setMinGuests] = useState('');
  const [maxGuests, setMaxGuests] = useState('');
  const [isServiceActive, setIsServiceActive] = useState(true);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Services & Amenities</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <Pressable style={styles.addButton} onPress={() => setShowServiceModal(true)}>
              <Plus size={18} color={Colors.surface} />
              <Text style={styles.addButtonText}>Add Service</Text>
            </Pressable>
          </View>

          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <View style={[
                  styles.statusBadge,
                  service.isActive ? styles.statusActive : styles.statusInactive
                ]}>
                  <Text style={[
                    styles.statusText,
                    service.isActive ? styles.statusTextActive : styles.statusTextInactive
                  ]}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.serviceDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Price/Person</Text>
                  <Text style={styles.detailValue}>${service.pricePerPerson}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Min Guests</Text>
                  <Text style={styles.detailValue}>{service.minGuests}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Max Guests</Text>
                  <Text style={styles.detailValue}>{service.maxGuests}</Text>
                </View>
              </View>

              <View style={styles.serviceActions}>
                <Pressable style={styles.actionButton}>
                  <Edit2 size={16} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </Pressable>
                <Pressable style={[styles.actionButton, styles.deleteButton]}>
                  <Trash2 size={16} color={Colors.error} />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Booking Slots</Text>
            <Pressable style={styles.addButton} onPress={() => setShowSlotModal(true)}>
              <Plus size={18} color={Colors.surface} />
              <Text style={styles.addButtonText}>Add Slot</Text>
            </Pressable>
          </View>

          {bookingSlots.slice(0, 3).map((slot) => (
            <View key={slot.id} style={styles.slotCard}>
              <View style={styles.slotIcon}>
                <Clock size={20} color={Colors.primary} />
              </View>
              <View style={styles.slotInfo}>
                <Text style={styles.slotName}>{slot.name}</Text>
                <Text style={styles.slotTime}>{slot.startTime} - {slot.endTime}</Text>
              </View>
              <View style={styles.slotMeta}>
                <Users size={14} color={Colors.textSecondary} />
                <Text style={styles.slotMetaText}>Max {slot.maxGuests}</Text>
              </View>
              <View style={styles.slotActions}>
                <Pressable style={styles.iconButton}>
                  <Edit2 size={16} color={Colors.primary} />
                </Pressable>
                <Pressable style={styles.iconButton}>
                  <Trash2 size={16} color={Colors.error} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showServiceModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Service</Text>
            <Pressable onPress={() => setShowServiceModal(false)}>
              <X size={24} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView 
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Service Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Private Dining Room"
                placeholderTextColor={Colors.textLight}
                value={serviceName}
                onChangeText={setServiceName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Price per Person ($)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="75"
                placeholderTextColor={Colors.textLight}
                value={pricePerPerson}
                onChangeText={setPricePerPerson}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Min Guests</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="8"
                  placeholderTextColor={Colors.textLight}
                  value={minGuests}
                  onChangeText={setMinGuests}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Max Guests</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="20"
                  placeholderTextColor={Colors.textLight}
                  value={maxGuests}
                  onChangeText={setMaxGuests}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active</Text>
              <Switch
                value={isServiceActive}
                onValueChange={setIsServiceActive}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.surface}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable 
                style={styles.cancelButton}
                onPress={() => setShowServiceModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Service</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showSlotModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Booking Slot</Text>
            <Pressable onPress={() => setShowSlotModal(false)}>
              <X size={24} color={Colors.text} />
            </Pressable>
          </View>

          <ScrollView 
            contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Slot Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Lunch, Dinner"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="12:00"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="14:00"
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Max Guests</Text>
              <TextInput
                style={styles.formInput}
                placeholder="40"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable 
                style={styles.cancelButton}
                onPress={() => setShowSlotModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton}>
                <Text style={styles.saveButtonText}>Save Slot</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  serviceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
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
  serviceDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  detailItem: {},
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 10,
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
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotInfo: {
    flex: 1,
    marginLeft: 12,
  },
  slotName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  slotTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  slotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  slotMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  slotActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
