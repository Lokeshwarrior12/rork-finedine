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
  FlatList,
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
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock?: number;
  lowStockThreshold?: number;
  price: number;
  image?: string;
  lastUpdated?: string;
  updatedAt?: string;
}

const categories = ['All', 'Meat', 'Vegetables', 'Dairy', 'Dry Goods', 'Oils & Sauces', 'Herbs'];

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
    price: '',
    image: '',
  });

  const restaurantId = user?.restaurantId || 'restaurant-123';

  // Fetch inventory
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

  // Update inventory item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      api.updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
      setModalVisible(false);
      Alert.alert('Success', 'Item updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update item');
    },
  });

  // Create inventory item mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<InventoryItem>) =>
      api.createInventoryItem(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
      setModalVisible(false);
      Alert.alert('Success', 'Item added successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to add item');
    },
  });

  // Delete inventory item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', restaurantId] });
      Alert.alert('Success', 'Item deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to delete item');
    },
  });

  const inventory = inventoryData?.data || [];
  const lowStockItems = inventory.filter((item: InventoryItem) => 
    item.quantity < (item.minStock || item.lowStockThreshold || 5)
  );
  const totalValue = inventory.reduce((sum: number, item: InventoryItem) => 
    sum + (item.quantity * (item.price || 0)), 0
  );

  const filteredInventory = inventory.filter((item: InventoryItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const styles = createStyles(colors, isDark);

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Meat',
      quantity: '',
      unit: 'kg',
      minStock: '',
      price: '',
      image: '',
    });
    setModalVisible(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minStock: (item.minStock || item.lowStockThreshold || 5).toString(),
      price: (item.price || 0).toString(),
      image: item.image || '',
    });
    setModalVisible(true);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this inventory item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const handleUpdateQuantity = (item: InventoryItem) => {
    Alert.prompt(
      'Update Quantity',
      `Current: ${item.quantity} ${item.unit}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: (newQty) => {
            const qty = parseFloat(newQty || '0');
            if (!isNaN(qty) && qty >= 0) {
              updateMutation.mutate({
                id: item.id,
                data: { quantity: qty },
              });
            }
          },
        },
      ],
      'plain-text',
      item.quantity.toString()
    );
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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFormData({ ...formData, image: result.assets[0].uri });
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveItem = () => {
    if (!formData.name || !formData.quantity || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const itemData = {
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      minStock: parseFloat(formData.minStock) || 5,
      lowStockThreshold: parseFloat(formData.minStock) || 5,
      price: parseFloat(formData.price),
      image: formData.image || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        data: itemData,
      });
    } else {
      createMutation.mutate(itemData);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const threshold = item.minStock || item.lowStockThreshold || 5;
    if (item.quantity < threshold) return 'low';
    if (item.quantity < threshold * 1.5) return 'medium';
    return 'good';
  };

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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <Pressable style={styles.addButton} onPress={handleAddItem}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Item</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
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
            <Text style={[styles.statValue, { color: colors.warning }]}>{lowStockItems.length}</Text>
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

        {lowStockItems.length > 0 && (
          <View style={styles.alertBanner}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.alertText}>
              {lowStockItems.length} item(s) running low on stock!
            </Text>
          </View>
        )}

        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search inventory..."
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
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inventoryList}>
          {filteredInventory.map((item: InventoryItem) => {
            const stockStatus = getStockStatus(item);
            const threshold = item.minStock || item.lowStockThreshold || 5;
            return (
              <View 
                key={item.id} 
                style={[
                  styles.inventoryCard,
                  stockStatus === 'low' && styles.lowStockCard,
                ]}
              >
                <Image
                  source={{ uri: item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200' }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={[
                      styles.stockBadge,
                      stockStatus === 'low' && styles.stockBadgeLow,
                      stockStatus === 'medium' && styles.stockBadgeMedium,
                      stockStatus === 'good' && styles.stockBadgeGood,
                    ]}>
                      {stockStatus === 'low' && <TrendingDown size={12} color={colors.error} />}
                      {stockStatus === 'good' && <TrendingUp size={12} color={colors.success} />}
                      <Text style={[
                        styles.stockBadgeText,
                        stockStatus === 'low' && { color: colors.error },
                        stockStatus === 'medium' && { color: colors.warning },
                        stockStatus === 'good' && { color: colors.success },
                      ]}>
                        {item.quantity} {item.unit}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemPrice}>${(item.price || 0).toFixed(2)}/{item.unit}</Text>
                    <Text style={styles.itemUpdated}>
                      Updated {item.lastUpdated || item.updatedAt || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.stockProgress}>
                    <View 
                      style={[
                        styles.stockProgressBar,
                        { 
                          width: `${Math.min((item.quantity / (threshold * 2)) * 100, 100)}%`,
                          backgroundColor: stockStatus === 'low' ? colors.error : 
                            stockStatus === 'medium' ? colors.warning : colors.success,
                        },
                      ]} 
                    />
                  </View>
                  <Text style={styles.minStockText}>Min stock: {threshold} {item.unit}</Text>
                </View>
                <View style={styles.itemActions}>
                  <Pressable 
                    style={styles.actionBtn}
                    onPress={() => handleUpdateQuantity(item)}
                  >
                    <Package size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable 
                    style={styles.actionBtn}
                    onPress={() => handleEditItem(item)}
                  >
                    <Edit2 size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable 
                    style={styles.actionBtn}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 size={18} color={colors.error} />
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
                {searchQuery ? 'Try a different search term' : 'Add your first inventory item'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
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
              <View style={styles.imageUploadSection}>
                <Pressable style={styles.imageUploadBtn} onPress={showImageOptions}>
                  {formData.image ? (
                    <Image 
                      source={{ uri: formData.image }} 
                      style={styles.uploadedImage} 
                      contentFit="cover" 
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Camera size={32} color={colors.textMuted} />
                      <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                </Pressable>
                <View style={styles.imageUploadActions}>
                  <Pressable style={styles.imageActionBtn} onPress={takePhoto}>
                    <Camera size={18} color={colors.primary} />
                    <Text style={styles.imageActionText}>Camera</Text>
                  </Pressable>
                  <Pressable style={styles.imageActionBtn} onPress={pickImage}>
                    <ImageIcon size={18} color={colors.primary} />
                    <Text style={styles.imageActionText}>Gallery</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter item name"
                  placeholderTextColor={colors.textMuted}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.formChips}>
                    {categories.filter(c => c !== 'All').map((cat) => (
                      <Pressable
                        key={cat}
                        style={[
                          styles.formChip,
                          formData.category === cat && styles.formChipActive,
                        ]}
                        onPress={() => setFormData({ ...formData, category: cat })}
                      >
                        <Text style={[
                          styles.formChipText,
                          formData.category === cat && styles.formChipTextActive,
                        ]}>
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="kg"
                    placeholderTextColor={colors.textMuted}
                    value={formData.unit}
                    onChangeText={(text) => setFormData({ ...formData, unit: text })}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Min Stock</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="5"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={formData.minStock}
                    onChangeText={(text) => setFormData({ ...formData, minStock: text })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Price *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                  />
                </View>
              </View>

              <Pressable 
                style={styles.saveBtn} 
                onPress={handleSaveItem}
                disabled={updateMutation.isPending || createMutation.isPending}
              >
                {(updateMutation.isPending || createMutation.isPending) ? (
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

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.warning,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 50,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  filterBtn: {
    padding: 6,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  inventoryList: {
    paddingHorizontal: 16,
  },
  inventoryCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  lowStockCard: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  stockBadgeLow: {
    backgroundColor: colors.errorLight,
  },
  stockBadgeMedium: {
    backgroundColor: colors.warningLight,
  },
  stockBadgeGood: {
    backgroundColor: colors.successLight,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  itemCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  itemUpdated: {
    fontSize: 11,
    color: colors.textMuted,
  },
  stockProgress: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  stockProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  minStockText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  itemActions: {
    justifyContent: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  imageUploadSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageUploadBtn: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  imageUploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imageActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    gap: 6,
  },
  imageActionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.inputBackground || colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  formChips: {
    flexDirection: 'row',
    gap: 8,
  },
  formChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  formChipTextActive: {
    color: '#fff',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
