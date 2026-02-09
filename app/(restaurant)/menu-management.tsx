// app/(restaurant)/menu-management.tsx
// Restaurant Owner - Menu Management Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, Image, Alert, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api, MenuItem } from '@/lib/api';
import Colors from '@/constants/colors';

export default function MenuManagementScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const restaurantId = 'restaurant-123';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
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

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => api.getRestaurantMenu(restaurantId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createMenuItem(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMenuItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
    },
  });

  const menuItems = menuData?.data || [];
  const categories = [...new Set(menuItems.map((item) => item.category || 'Other'))];

  const openModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        category: item.category || '',
        isVegetarian: item.isVegetarian,
        isVegan: item.isVegan,
        isGlutenFree: item.isGlutenFree,
        isAvailable: item.isAvailable,
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

    const data = {
      ...formData,
      price: parseFloat(formData.price),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        {item.description && <Text style={styles.menuItemDesc} numberOfLines={1}>{item.description}</Text>}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
          <View style={styles.badges}>
            {item.isVegetarian && <View style={styles.badge}><Text style={styles.badgeText}>🌱 Veg</Text></View>}
            {!item.isAvailable && <View style={[styles.badge, styles.unavailableBadge]}><Text style={styles.unavailableText}>Unavailable</Text></View>}
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
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id}
          renderItem={renderMenuItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
        />
      )}

      {/* Add/Edit Modal */}
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
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#333' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  menuItem: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  menuItemContent: { flex: 1 },
  menuItemName: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  menuItemDesc: { fontSize: 13, color: '#666', marginBottom: 8 },
  menuItemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuItemPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, color: '#666' },
  unavailableBadge: { backgroundColor: '#FFE5E5' },
  unavailableText: { fontSize: 11, color: '#FF3B30', fontWeight: '600' },
  menuItemActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  textArea: { height: 80 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 8, marginTop: 20, gap: 8 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
