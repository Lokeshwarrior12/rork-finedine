import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Alert, Switch } from 'react-native';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

interface MenuItemData {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
}

export default function MenuManagementScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const restaurantId = user?.restaurantId || '';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isAvailable: true,
  });

  const { data: menuItemsRaw, isLoading } = useMenuItems(restaurantId);
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const menuItems = (menuItemsRaw || []) as MenuItemData[];

  const openModal = (item?: MenuItemData) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: (item.price ?? 0).toString(),
        category: item.category || '',
        isVegetarian: item.isVegetarian ?? false,
        isVegan: item.isVegan ?? false,
        isGlutenFree: item.isGlutenFree ?? false,
        isAvailable: item.isAvailable ?? true,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isAvailable: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Name and price are required');
      return;
    }

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        restaurantId,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        category: formData.category || undefined,
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        isGlutenFree: formData.isGlutenFree,
        isAvailable: formData.isAvailable,
      }, {
        onSuccess: () => closeModal(),
        onError: (err) => Alert.alert('Error', err.message),
      });
    } else {
      createMutation.mutate({
        restaurantId,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        category: formData.category || undefined,
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        isGlutenFree: formData.isGlutenFree,
        isAvailable: formData.isAvailable,
      }, {
        onSuccess: () => closeModal(),
        onError: (err) => Alert.alert('Error', err.message),
      });
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(
          { id, restaurantId },
          { onError: (err) => Alert.alert('Error', err.message) }
        ),
      },
    ]);
  };

  const renderMenuItem = ({ item }: { item: MenuItemData }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        {item.description && <Text style={styles.menuItemDesc} numberOfLines={1}>{item.description}</Text>}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>${(item.price ?? 0).toFixed(2)}</Text>
          <View style={styles.badges}>
            {item.isVegetarian && <View style={styles.badge}><Text style={styles.badgeText}>🌱 Veg</Text></View>}
            {item.isAvailable === false && <View style={[styles.badge, styles.unavailableBadge]}><Text style={styles.unavailableText}>Unavailable</Text></View>}
          </View>
        </View>
      </View>
      <View style={styles.menuItemActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => openModal(item)}>
          <Edit size={18} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
          <Trash2 size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : menuItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Menu Items</Text>
          <Text style={styles.emptyText}>Add your first menu item to get started</Text>
        </View>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id}
          renderItem={renderMenuItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
        />
      )}

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Item Name *" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Description" value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline numberOfLines={3} textAlignVertical="top" />
            <TextInput style={styles.input} placeholder="Price *" value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} keyboardType="decimal-pad" />
            <TextInput style={styles.input} placeholder="Category" value={formData.category} onChangeText={(text) => setFormData({ ...formData, category: text })} />

            <View style={styles.switchRow}>
              <Text>Available</Text>
              <Switch value={formData.isAvailable} onValueChange={(val) => setFormData({ ...formData, isAvailable: val })} />
            </View>
            <View style={styles.switchRow}>
              <Text>Vegetarian</Text>
              <Switch value={formData.isVegetarian} onValueChange={(val) => setFormData({ ...formData, isVegetarian: val })} />
            </View>
            <View style={styles.switchRow}>
              <Text>Vegan</Text>
              <Switch value={formData.isVegan} onValueChange={(val) => setFormData({ ...formData, isVegan: val })} />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Item</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 28, fontWeight: '700' as const, color: '#333' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '600' as const, color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666' },
  menuItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  menuItemContent: { flex: 1 },
  menuItemName: { fontSize: 16, fontWeight: '600' as const, color: '#333', marginBottom: 4 },
  menuItemDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  menuItemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuItemPrice: { fontSize: 16, fontWeight: '700' as const, color: Colors.primary },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, color: '#666' },
  unavailableBadge: { backgroundColor: '#FFE5E5' },
  unavailableText: { fontSize: 11, color: '#FF3B30', fontWeight: '600' as const },
  menuItemActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' as const, color: '#333' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  textArea: { height: 80 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 8, marginTop: 20, gap: 8 },
  saveButtonText: { fontSize: 16, fontWeight: '600' as const, color: '#fff' },
});
