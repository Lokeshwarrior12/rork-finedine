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
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minStock: number;
  price: number;
  image?: string;
  lastUpdated: string;
}

const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Chicken Breast',
    category: 'Meat',
    quantity: 25,
    unit: 'kg',
    minStock: 10,
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200',
    lastUpdated: '2026-01-22',
  },
  {
    id: '2',
    name: 'Olive Oil',
    category: 'Oils & Sauces',
    quantity: 8,
    unit: 'bottles',
    minStock: 5,
    price: 12.50,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200',
    lastUpdated: '2026-01-21',
  },
  {
    id: '3',
    name: 'Pasta (Spaghetti)',
    category: 'Dry Goods',
    quantity: 3,
    unit: 'kg',
    minStock: 15,
    price: 3.99,
    image: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=200',
    lastUpdated: '2026-01-20',
  },
  {
    id: '4',
    name: 'Tomatoes',
    category: 'Vegetables',
    quantity: 18,
    unit: 'kg',
    minStock: 10,
    price: 2.49,
    image: 'https://images.unsplash.com/photo-1546470427-227c7b5f08c8?w=200',
    lastUpdated: '2026-01-22',
  },
  {
    id: '5',
    name: 'Mozzarella Cheese',
    category: 'Dairy',
    quantity: 12,
    unit: 'kg',
    minStock: 8,
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200',
    lastUpdated: '2026-01-21',
  },
  {
    id: '6',
    name: 'Fresh Basil',
    category: 'Herbs',
    quantity: 2,
    unit: 'bunches',
    minStock: 5,
    price: 1.99,
    image: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=200',
    lastUpdated: '2026-01-22',
  },
];

const categories = ['All', 'Meat', 'Vegetables', 'Dairy', 'Dry Goods', 'Oils & Sauces', 'Herbs'];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory);
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

  const styles = createStyles(colors, isDark);

  const lowStockItems = inventory.filter(item => item.quantity < item.minStock);
  const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      minStock: item.minStock.toString(),
      price: item.price.toString(),
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
          onPress: () => setInventory(prev => prev.filter(item => item.id !== id))
        },
      ]
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

    const newItem: InventoryItem = {
      id: editingItem?.id || `item_${Date.now()}`,
      name: formData.name,
      category: formData.category,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      minStock: parseFloat(formData.minStock) || 5,
      price: parseFloat(formData.price),
      image: formData.image || undefined,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    if (editingItem) {
      setInventory(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
    } else {
      setInventory(prev => [newItem, ...prev]);
    }

    setModalVisible(false);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity < item.minStock) return 'low';
    if (item.quantity < item.minStock * 1.5) return 'medium';
    return 'good';
  };

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
            placeholderTextColor={colors.placeholder}
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
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <View key={item.id} style={styles.inventoryCard}>
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
                    <Text style={styles.itemPrice}>${item.price.toFixed(2)}/{item.unit}</Text>
                    <Text style={styles.itemUpdated}>Updated {item.lastUpdated}</Text>
                  </View>
                  <View style={styles.stockProgress}>
                    <View 
                      style={[
                        styles.stockProgressBar,
                        { 
                          width: `${Math.min((item.quantity / (item.minStock * 2)) * 100, 100)}%`,
                          backgroundColor: stockStatus === 'low' ? colors.error : 
                            stockStatus === 'medium' ? colors.warning : colors.success,
                        },
                      ]} 
                    />
                  </View>
                  <Text style={styles.minStockText}>Min stock: {item.minStock} {item.unit}</Text>
                </View>
                <View style={styles.itemActions}>
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
                  placeholderTextColor={colors.placeholder}
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
                    placeholderTextColor={colors.placeholder}
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
                    placeholderTextColor={colors.placeholder}
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
                    placeholderTextColor={colors.placeholder}
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
                    placeholderTextColor={colors.placeholder}
                    keyboardType="decimal-pad"
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                  />
                </View>
              </View>

              <Pressable style={styles.saveBtn} onPress={handleSaveItem}>
                <Check size={20} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </Text>
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
    backgroundColor: colors.inputBackground,
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
