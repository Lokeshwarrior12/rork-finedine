// app/(restaurant)/menu-management.tsx
// Simple Menu CRUD - REAL DATABASE INTEGRATION

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { Plus, Edit, Trash2, X, Save, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';

interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
}

export default function MenuManagementScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  
  const restaurantId = user?.restaurantId || '';

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

  // REAL DATA: Fetch menu from database
  const { data: menuData, isLoading, error, refetch } = useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: () => api.getRestaurantMenu(restaurantId),
    enabled: !!restaurantId,
  });

  // REAL DATA: Create menu item
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createMenuItem(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
      closeModal();
      Alert.alert('Success', 'Menu item added');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Update menu item
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateMenuItem(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
      closeModal();
      Alert.alert('Success', 'Menu item updated');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Delete menu item
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', restaurantId] });
      Alert.alert('Success', 'Menu item deleted');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const menuItems = (menuData?.data || []) as MenuItem[];

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

    const itemData = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      category: formData.category || undefined,
      isVegetarian: formData.isVegetarian,
      isVegan: formData.isVegan,
      isGlutenFree: formData.isGlutenFree,
      isAvailable: formData.isAvailable,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu Management</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu Management</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Menu</Text>
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

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.menuItemDesc} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.menuItemFooter}>
          <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
          <View style={styles.badges}>
            {item.isVegetarian && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>🌱 Veg</Text>
              </View>
            )}
            {!item.isAvailable && (
              <View style={[styles.badge, styles.unavailableBadge]}>
                <Text style={styles.unavailableText}>Unavailable</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.menuItemActions}>
        <TouchableOpacity style={styles.iconButton} onPress={() => openModal(item)}>
          <Edit size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
          <Trash2 size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {menuItems.length === 0 ? (
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
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Item Name *"
                placeholderTextColor={colors.textMuted}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={colors.textMuted}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <TextInput
                style={styles.input}
                placeholder="Price *"
                placeholderTextColor={colors.textMuted}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Category"
                placeholderTextColor={colors.textMuted}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Available</Text>
                <Switch
                  value={formData.isAvailable}
                  onValueChange={(val) => setFormData({ ...formData, isAvailable: val })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Vegetarian</Text>
                <Switch
                  value={formData.isVegetarian}
                  onValueChange={(val) => setFormData({ ...formData, isVegetarian: val })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Vegan</Text>
                <Switch
                  value={formData.isVegan}
                  onValueChange={(val) => setFormData({ ...formData, isVegan: val })}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Item</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
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
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    errorTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
    errorMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginVertical: 12 },
    retryButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    listContent: { padding: 16 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: colors.textSecondary },
    menuItem: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    menuItemContent: { flex: 1 },
    menuItemName: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
    menuItemDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
    menuItemFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menuItemPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
    badges: { flexDirection: 'row', gap: 6 },
    badge: { backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 11, color: colors.textSecondary },
    unavailableBadge: { backgroundColor: colors.errorLight },
    unavailableText: { fontSize: 11, color: colors.error, fontWeight: '600' },
    menuItemActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '90%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    input: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    textArea: { height: 80, textAlignVertical: 'top' },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    switchLabel: { fontSize: 15, color: colors.text },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      marginTop: 20,
      gap: 8,
    },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  });
