// app/(restaurant)/inventory.tsx
// Excel-like Inventory Management - REAL DATABASE INTEGRATION
// Professional spreadsheet UI like Google Sheets/Excel

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Filter,
  Camera,
  Image as ImageIcon,
  Download,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier?: string;
  sku?: string;
  purchaseDate?: string;
  expiryDate?: string;
  notes?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

const categories = ['All', 'Meat', 'Vegetables', 'Dairy', 'Dry Goods', 'Oils & Sauces', 'Herbs', 'Beverages', 'Frozen', 'Other'];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Meat',
    quantity: '',
    unit: 'kg',
    minStock: '',
    costPerUnit: '',
    supplier: '',
    sku: '',
    purchaseDate: '',
    expiryDate: '',
    notes: '',
    image: '',
  });

  const restaurantId = user?.restaurantId || '';

  // REAL DATA: Fetch inventory from database
  const {
    data: inventoryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inventory', restaurantId],
    queryFn: () => api.getRestaurantInventory(restaurantId),
    enabled: !!restaurantId,
  });

  // REAL DATA: Create inventory item
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createInventoryItem(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Item added successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to add item');
    },
  });

  // REAL DATA: Update inventory item
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateInventoryItem(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
      setModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Item updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update item');
    },
  });

  // REAL DATA: Delete inventory item
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
      Alert.alert('Success', 'Item deleted');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to delete item');
    },
  });

  const inventory = (inventoryData?.data || []) as InventoryItem[];

  // Calculate stats
  const lowStockItems = inventory.filter(item => item.quantity < item.minStock);
  const expiringSoonItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.floor((new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
  });
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Meat',
      quantity: '',
      unit: 'kg',
      minStock: '',
      costPerUnit: '',
      supplier: '',
      sku: '',
      purchaseDate: '',
      expiryDate: '',
      notes: '',
      image: '',
    });
    setEditingItem(null);
  };

  const handleAddItem = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minStock: item.minStock.toString(),
      costPerUnit: item.costPerUnit.toString(),
      supplier: item.supplier || '',
      sku: item.sku || '',
      purchaseDate: item.purchaseDate || '',
      expiryDate: item.expiryDate || '',
      notes: item.notes || '',
      image: item.image || '',
    });
    setModalVisible(true);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    );
  };

  const handleQuickUpdateQuantity = (item: InventoryItem) => {
    Alert.prompt(
      'Update Quantity',
      `Current: ${item.quantity} ${item.unit}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (newQty?: string) => {
            const qty = parseFloat(newQty || '0');
            if (!isNaN(qty) && qty >= 0) {
              updateMutation.mutate({
                id: item.id,
                quantity: qty,
              });
            }
          },
        },
      ],
      'plain-text',
      item.quantity.toString()
    );
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.quantity || !formData.costPerUnit) {
      Alert.alert('Error', 'Name, quantity, and cost are required');
      return;
    }

    const itemData = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      minStock: parseFloat(formData.minStock) || 5,
      costPerUnit: parseFloat(formData.costPerUnit),
      supplier: formData.supplier || undefined,
      sku: formData.sku || undefined,
      purchaseDate: formData.purchaseDate || undefined,
      expiryDate: formData.expiryDate || undefined,
      notes: formData.notes || undefined,
      image: formData.image || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...itemData });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity < item.minStock) return 'critical';
    if (item.quantity < item.minStock * 1.5) return 'low';
    return 'good';
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    return Math.floor((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const styles = createStyles(colors, isDark);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inventory</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inventory</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Inventory</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.exportButton}>
            <Download size={18} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.addButton} onPress={handleAddItem}>
            <Plus size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Item</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <Package size={20} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{inventory.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.warningLight }]}>
              <AlertTriangle size={20} color={colors.warning} />
            </View>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {lowStockItems.length}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
              <TrendingUp size={20} color={colors.success} />
            </View>
            <Text style={styles.statValue}>${totalValue.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Value</Text>
          </View>
        </View>

        {/* Alerts */}
        {lowStockItems.length > 0 && (
          <View style={styles.alertBanner}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.alertText}>
              {lowStockItems.length} item(s) running low on stock!
            </Text>
          </View>
        )}

        {expiringSoonItems.length > 0 && (
          <View style={[styles.alertBanner, { backgroundColor: colors.errorLight }]}>
            <Calendar size={20} color={colors.error} />
            <Text style={[styles.alertText, { color: colors.error }]}>
              {expiringSoonItems.length} item(s) expiring within 7 days!
            </Text>
          </View>
        )}

        {/* Search & Filter */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SKU..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Pressable style={styles.filterBtn}>
            <Filter size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map(category => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Excel-like Spreadsheet Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.spreadsheet}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.cellImage]}>Image</Text>
              <Text style={[styles.headerCell, styles.cellName]}>Name</Text>
              <Text style={[styles.headerCell, styles.cellSKU]}>SKU</Text>
              <Text style={[styles.headerCell, styles.cellCategory]}>Category</Text>
              <Text style={[styles.headerCell, styles.cellQty]}>Qty</Text>
              <Text style={[styles.headerCell, styles.cellUnit]}>Unit</Text>
              <Text style={[styles.headerCell, styles.cellCost]}>Cost</Text>
              <Text style={[styles.headerCell, styles.cellValue]}>Value</Text>
              <Text style={[styles.headerCell, styles.cellMin]}>Min</Text>
              <Text style={[styles.headerCell, styles.cellSupplier]}>Supplier</Text>
              <Text style={[styles.headerCell, styles.cellPurchase]}>Purchase</Text>
              <Text style={[styles.headerCell, styles.cellExpiry]}>Expiry</Text>
              <Text style={[styles.headerCell, styles.cellStatus]}>Status</Text>
              <Text style={[styles.headerCell, styles.cellActions]}>Actions</Text>
            </View>

            {/* Table Rows */}
            {filteredInventory.map((item, index) => {
              const status = getStockStatus(item);
              const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.tableRowAlt,
                    status === 'critical' && styles.tableRowCritical,
                  ]}
                >
                  {/* Image */}
                  <View style={[styles.cell, styles.cellImage]}>
                    <Image
                      source={{
                        uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100',
                      }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                  </View>

                  {/* Name */}
                  <Text style={[styles.cell, styles.cellName, styles.cellTextBold]}>
                    {item.name}
                  </Text>

                  {/* SKU */}
                  <Text style={[styles.cell, styles.cellSKU, styles.cellTextMuted]}>
                    {item.sku || '-'}
                  </Text>

                  {/* Category */}
                  <View style={[styles.cell, styles.cellCategory]}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                  </View>

                  {/* Quantity */}
                  <Pressable
                    style={[styles.cell, styles.cellQty]}
                    onPress={() => handleQuickUpdateQuantity(item)}
                  >
                    <Text style={[styles.cellTextBold, { color: colors.primary }]}>
                      {item.quantity}
                    </Text>
                  </Pressable>

                  {/* Unit */}
                  <Text style={[styles.cell, styles.cellUnit]}>{item.unit}</Text>

                  {/* Cost */}
                  <Text style={[styles.cell, styles.cellCost]}>
                    ${item.costPerUnit.toFixed(2)}
                  </Text>

                  {/* Value */}
                  <Text style={[styles.cell, styles.cellValue, styles.cellTextBold]}>
                    ${(item.quantity * item.costPerUnit).toFixed(2)}
                  </Text>

                  {/* Min Stock */}
                  <Text style={[styles.cell, styles.cellMin, styles.cellTextMuted]}>
                    {item.minStock}
                  </Text>

                  {/* Supplier */}
                  <Text style={[styles.cell, styles.cellSupplier, styles.cellTextMuted]}>
                    {item.supplier || '-'}
                  </Text>

                  {/* Purchase Date */}
                  <Text style={[styles.cell, styles.cellPurchase, styles.cellTextMuted]}>
                    {item.purchaseDate
                      ? new Date(item.purchaseDate).toLocaleDateString()
                      : '-'}
                  </Text>

                  {/* Expiry Date */}
                  <View style={[styles.cell, styles.cellExpiry]}>
                    {item.expiryDate ? (
                      <View>
                        <Text
                          style={[
                            styles.cellText,
                            isExpiringSoon && { color: colors.error, fontWeight: '600' },
                          ]}
                        >
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </Text>
                        {isExpiringSoon && (
                          <Text style={styles.expiryWarning}>
                            {daysUntilExpiry === 0
                              ? 'Expires today!'
                              : `${daysUntilExpiry}d left`}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.cellTextMuted}>-</Text>
                    )}
                  </View>

                  {/* Status */}
                  <View style={[styles.cell, styles.cellStatus]}>
                    <View
                      style={[
                        styles.statusBadge,
                        status === 'critical' && styles.statusCritical,
                        status === 'low' && styles.statusLow,
                        status === 'good' && styles.statusGood,
                      ]}
                    >
                      {status === 'critical' ? (
                        <TrendingDown size={12} color={colors.error} />
                      ) : status === 'low' ? (
                        <AlertTriangle size={12} color={colors.warning} />
                      ) : (
                        <TrendingUp size={12} color={colors.success} />
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          status === 'critical' && { color: colors.error },
                          status === 'low' && { color: colors.warning },
                          status === 'good' && { color: colors.success },
                        ]}
                      >
                        {status === 'critical'
                          ? 'Critical'
                          : status === 'low'
                          ? 'Low'
                          : 'Good'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={[styles.cell, styles.cellActions]}>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => handleEditItem(item)}
                    >
                      <Edit2 size={16} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {filteredInventory.length === 0 && (
              <View style={styles.emptyState}>
                <Package size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No items found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try a different search' : 'Add your first item'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Upload */}
              <Pressable style={styles.imageUpload} onPress={pickImage}>
                {formData.image ? (
                  <Image source={{ uri: formData.image }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Camera size={32} color={colors.textMuted} />
                    <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                  </View>
                )}
              </Pressable>

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Fresh Chicken Breast"
                  value={formData.name}
                  onChangeText={text => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>SKU</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="SKU-001"
                    value={formData.sku}
                    onChangeText={text => setFormData({ ...formData, sku: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Category</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.category}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={formData.quantity}
                    onChangeText={text => setFormData({ ...formData, quantity: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="kg"
                    value={formData.unit}
                    onChangeText={text => setFormData({ ...formData, unit: text })}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Cost/Unit *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={formData.costPerUnit}
                    onChangeText={text => setFormData({ ...formData, costPerUnit: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Min Stock</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="5"
                    keyboardType="numeric"
                    value={formData.minStock}
                    onChangeText={text => setFormData({ ...formData, minStock: text })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Supplier</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Supplier name"
                  value={formData.supplier}
                  onChangeText={text => setFormData({ ...formData, supplier: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Purchase Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    value={formData.purchaseDate}
                    onChangeText={text => setFormData({ ...formData, purchaseDate: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="YYYY-MM-DD"
                    value={formData.expiryDate}
                    onChangeText={text => setFormData({ ...formData, expiryDate: text })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Additional notes..."
                  multiline
                  numberOfLines={3}
                  value={formData.notes}
                  onChangeText={text => setFormData({ ...formData, notes: text })}
                />
              </View>

              <Pressable
                style={styles.saveBtn}
                onPress={handleSaveItem}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
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
    headerTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
    headerActions: { flexDirection: 'row', gap: 8 },
    exportButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
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
    statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
    statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
    statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
    statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
    alertBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.warningLight, marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12, gap: 10 },
    alertText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.warning },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, paddingHorizontal: 14, height: 50, borderRadius: 14, gap: 10, borderWidth: 1, borderColor: colors.border },
    searchInput: { flex: 1, fontSize: 15, color: colors.text },
    filterBtn: { padding: 6 },
    categoriesScroll: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
    categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, marginRight: 8, borderWidth: 1, borderColor: colors.border },
    categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    categoryChipText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    categoryChipTextActive: { color: '#fff' },
    spreadsheet: { marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    tableHeader: { flexDirection: 'row', backgroundColor: colors.primaryLight, paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: colors.primary },
    headerCell: { fontSize: 11, fontWeight: '700', color: colors.primary, textTransform: 'uppercase', textAlign: 'center' },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
    tableRowAlt: { backgroundColor: colors.backgroundSecondary },
    tableRowCritical: { backgroundColor: colors.errorLight },
    cell: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
    cellText: { fontSize: 13, color: colors.text },
    cellTextBold: { fontWeight: '600', color: colors.text },
    cellTextMuted: { color: colors.textMuted },
    cellImage: { width: 60 },
    cellName: { width: 150, alignItems: 'flex-start' },
    cellSKU: { width: 80 },
    cellCategory: { width: 100 },
    cellQty: { width: 60 },
    cellUnit: { width: 50 },
    cellCost: { width: 70 },
    cellValue: { width: 80 },
    cellMin: { width: 50 },
    cellSupplier: { width: 120 },
    cellPurchase: { width: 100 },
    cellExpiry: { width: 120 },
    cellStatus: { width: 100 },
    cellActions: { width: 100, flexDirection: 'row', gap: 6 },
    itemImage: { width: 50, height: 50, borderRadius: 8 },
    categoryBadge: { backgroundColor: colors.backgroundSecondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    categoryBadgeText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
    statusCritical: { backgroundColor: colors.errorLight },
    statusLow: { backgroundColor: colors.warningLight },
    statusGood: { backgroundColor: colors.successLight },
    statusText: { fontSize: 11, fontWeight: '600' },
    expiryWarning: { fontSize: 10, color: colors.error, fontWeight: '600', marginTop: 2 },
    actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    emptyText: { fontSize: 14, color: colors.textMuted },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    imageUpload: { width: 120, height: 120, borderRadius: 16, overflow: 'hidden', alignSelf: 'center', marginBottom: 20 },
    uploadedImage: { width: '100%', height: '100%' },
    imagePlaceholder: { width: '100%', height: '100%', backgroundColor: colors.backgroundSecondary, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    imagePlaceholderText: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
    formGroup: { marginBottom: 16 },
    formLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
    formInput: { backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text },
    formRow: { flexDirection: 'row', gap: 12 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 14, marginTop: 8, marginBottom: 20, gap: 8 },
    saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  });
