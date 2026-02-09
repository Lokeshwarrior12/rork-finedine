import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LogOut, 
  Save, 
  Camera, 
  Phone, 
  ChevronRight,
  X,
  Plus,
  UtensilsCrossed,
  Trash2,
  Check,
  DollarSign,
  MapPin,
  Mail,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/lib/api';
import { restaurantCategories } from '@/mocks/data';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image?: string;
}

const MENU_CATEGORIES = ['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Specials'];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { colors, isDark } = useTheme();
  const restaurantId = 'restaurant-123'; // Replace with actual restaurant ID from context/auth

  // Fetch restaurant data
  const { data: restaurantData, isLoading } = useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: () => api.getRestaurant(restaurantId),
  });

  const restaurant = restaurantData?.data ?? null;

  // Form state
  const [restaurantName, setRestaurantName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [acceptsBooking, setAcceptsBooking] = useState(true);
  const [bookingTerms, setBookingTerms] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [restaurantImages, setRestaurantImages] = useState<string[]>([]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
  });

  // Update form when restaurant data loads
  useEffect(() => {
    if (restaurant) {
      const r = restaurant as any;
      setRestaurantName(r.name || '');
      setDescription(r.description || '');
      setCuisineType(r.cuisineType || '');
      setAddress(r.address || '');
      setCity(r.city || '');
      setPhone(r.phone || '');
      setEmail(r.email || '');
      setOpeningHours(r.openingHours || '');
      setAcceptsBooking(r.acceptsBooking ?? true);
      setBookingTerms(r.bookingTerms || '');
      setIsActive(r.isActive ?? true);
      setSelectedCategories(r.categories || []);
      setLogoImage(r.logo || null);
      setRestaurantImages(r.images || []);
      setMenuItems(r.menuItems || []);
    }
  }, [restaurant]);

  // Update restaurant mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateRestaurant(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      Alert.alert('Success', 'Settings saved successfully!');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update settings');
    },
  });

  const styles = createStyles(colors, isDark);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoImage(result.assets[0].uri);
    }
  };

  const takeLogo = async () => {
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
      setLogoImage(result.assets[0].uri);
    }
  };

  const pickRestaurantImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setRestaurantImages([...restaurantImages, result.assets[0].uri]);
    }
  };

  const takeRestaurantPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setRestaurantImages([...restaurantImages, result.assets[0].uri]);
    }
  };

  const removeRestaurantImage = (index: number) => {
    Alert.alert('Remove Image', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const newImages = [...restaurantImages];
          newImages.splice(index, 1);
          setRestaurantImages(newImages);
        },
      },
    ]);
  };

  const showImageOptions = (type: 'logo' | 'restaurant') => {
    Alert.alert('Add Image', 'Choose an option', [
      { text: 'Take Photo', onPress: type === 'logo' ? takeLogo : takeRestaurantPhoto },
      { text: 'Choose from Library', onPress: type === 'logo' ? pickLogo : pickRestaurantImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddMenuItem = () => {
    setEditingMenuItem(null);
    setMenuForm({ name: '', description: '', price: '', category: 'Main Course' });
    setShowMenuModal(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
    });
    setShowMenuModal(true);
  };

  const handleSaveMenuItem = () => {
    if (!menuForm.name || !menuForm.price) {
      Alert.alert('Error', 'Please enter name and price');
      return;
    }

    if (editingMenuItem) {
      setMenuItems(prev => prev.map(item => 
        item.id === editingMenuItem.id 
          ? { ...item, ...menuForm }
          : item
      ));
    } else {
      const newItem: MenuItem = {
        id: `menu_${Date.now()}`,
        ...menuForm,
      };
      setMenuItems(prev => [...prev, newItem]);
    }
    setShowMenuModal(false);
  };

  const handleDeleteMenuItem = (id: string) => {
    Alert.alert('Delete Item', 'Remove this menu item?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setMenuItems(prev => prev.filter(item => item.id !== id)) },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleSave = () => {
    const formData = {
      name: restaurantName,
      description,
      cuisineType,
      address,
      city,
      phone,
      email,
      openingHours,
      acceptsBooking,
      bookingTerms,
      isActive,
      categories: selectedCategories,
      logo: logoImage,
      images: restaurantImages,
      menuItems,
    };

    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.formLabel, { marginTop: 16 }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Pressable 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Restaurant Logo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Logo</Text>
          <View style={styles.logoSection}>
            <Pressable style={styles.logoContainer} onPress={() => showImageOptions('logo')}>
              {logoImage ? (
                <Image source={{ uri: logoImage }} style={styles.logoImage} contentFit="cover" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Camera size={32} color={colors.textMuted} />
                  <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                </View>
              )}
              <View style={styles.logoEditBadge}>
                <Camera size={14} color="#fff" />
              </View>
            </Pressable>
            <View style={styles.logoInfo}>
              <Text style={styles.logoInfoTitle}>Restaurant Logo</Text>
              <Text style={styles.logoInfoDesc}>
                Upload a square logo for your restaurant.
              </Text>
              <Pressable style={styles.changeLogoBtn} onPress={() => showImageOptions('logo')}>
                <Text style={styles.changeLogoBtnText}>
                  {logoImage ? 'Change Logo' : 'Upload Logo'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Restaurant Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Photos</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScrollContent}
          >
            {restaurantImages.map((image, index) => (
              <View key={index} style={styles.restaurantImageWrapper}>
                <Image source={{ uri: image }} style={styles.restaurantImage} contentFit="cover" />
                <Pressable style={styles.removeImageBtn} onPress={() => removeRestaurantImage(index)}>
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.addImageBtn} onPress={() => showImageOptions('restaurant')}>
              <Plus size={28} color={colors.primary} />
              <Text style={styles.addImageText}>Add Photo</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UtensilsCrossed size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Menu Items</Text>
          </View>
          <Pressable style={styles.addMenuBtn} onPress={handleAddMenuItem}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addMenuBtnText}>Add Menu Item</Text>
          </Pressable>

          {MENU_CATEGORIES.map(category => {
            const categoryItems = menuItems.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;
            return (
              <View key={category} style={styles.menuCategory}>
                <Text style={styles.menuCategoryTitle}>{category}</Text>
                {categoryItems.map(item => (
                  <Pressable 
                    key={item.id} 
                    style={styles.menuItem}
                    onPress={() => handleEditMenuItem(item)}
                  >
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName}>{item.name}</Text>
                      <Text style={styles.menuItemDesc} numberOfLines={1}>{item.description}</Text>
                    </View>
                    <Text style={styles.menuItemPrice}>${item.price}</Text>
                    <Pressable onPress={() => handleDeleteMenuItem(item.id)}>
                      <Trash2 size={16} color={colors.error} />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Restaurant Name</Text>
              <TextInput
                style={styles.formInput}
                value={restaurantName}
                onChangeText={setRestaurantName}
                placeholder="Enter restaurant name"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Tell customers about your restaurant..."
                placeholderTextColor={colors.placeholder}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Cuisine Type</Text>
              <TextInput
                style={styles.formInput}
                value={cuisineType}
                onChangeText={setCuisineType}
                placeholder="e.g., Italian, Chinese, American"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>
        </View>

        {/* Location & Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Contact</Text>
          <View style={styles.card}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Street Address</Text>
              <View style={styles.inputIcon}>
                <MapPin size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.inputWithIcon}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="123 Main Street"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>City</Text>
              <TextInput
                style={styles.formInput}
                value={city}
                onChangeText={setCity}
                placeholder="City name"
                placeholderTextColor={colors.placeholder}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone</Text>
              <View style={styles.inputIcon}>
                <Phone size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.inputWithIcon}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 234 567 8900"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <View style={styles.inputIcon}>
                <Mail size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.inputWithIcon}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="info@restaurant.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Opening Hours</Text>
              <TextInput
                style={styles.formInput}
                value={openingHours}
                onChangeText={setOpeningHours}
                placeholder="11:00 AM - 11:00 PM"
                placeholderTextColor={colors.placeholder}
              />
            </View>
          </View>
        </View>

        {/* Restaurant Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Categories</Text>
          <View style={styles.categoriesGrid}>
            {restaurantCategories.map((category) => (
              <Pressable
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(category) && styles.categoryChipActive,
                ]}
                onPress={() => toggleCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategories.includes(category) && styles.categoryChipTextActive,
                ]}>
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Operations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operations</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Restaurant Active</Text>
                <Text style={styles.switchSubtext}>Accept new orders and bookings</Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Table Booking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Table Booking</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Accept Table Reservations</Text>
                <Text style={styles.switchSubtext}>Allow customers to book tables</Text>
              </View>
              <Switch
                value={acceptsBooking}
                onValueChange={setAcceptsBooking}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
            {acceptsBooking && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Booking Terms</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  value={bookingTerms}
                  onChangeText={setBookingTerms}
                  placeholder="e.g., Cancellation must be made 2 hours before..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
            )}
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Pressable 
            style={styles.supportCard}
            onPress={() => router.push('/(restaurant)/book-call' as Href)}
          >
            <View style={styles.supportIcon}>
              <Phone size={24} color={colors.primary} />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Book a Call</Text>
              <Text style={styles.supportDesc}>Schedule a call with our support team</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color={colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Menu Item Modal */}
      <Modal visible={showMenuModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </Text>
              <Pressable onPress={() => setShowMenuModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Item name"
                  placeholderTextColor={colors.placeholder}
                  value={menuForm.name}
                  onChangeText={(text) => setMenuForm({ ...menuForm, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextarea]}
                  placeholder="Brief description"
                  placeholderTextColor={colors.placeholder}
                  value={menuForm.description}
                  onChangeText={(text) => setMenuForm({ ...menuForm, description: text })}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Price *</Text>
                <View style={styles.priceInput}>
                  <DollarSign size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.formInput, { flex: 1, marginBottom: 0, borderWidth: 0 }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="decimal-pad"
                    value={menuForm.price}
                    onChangeText={(text) => setMenuForm({ ...menuForm, price: text })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryOptions}>
                  {MENU_CATEGORIES.map(cat => (
                    <Pressable
                      key={cat}
                      style={[
                        styles.categoryOption,
                        menuForm.category === cat && styles.categoryOptionActive,
                      ]}
                      onPress={() => setMenuForm({ ...menuForm, category: cat })}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        menuForm.category === cat && styles.categoryOptionTextActive,
                      ]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable style={styles.saveMenuBtn} onPress={handleSaveMenuItem}>
                <Check size={18} color="#fff" />
                <Text style={styles.saveMenuBtnText}>
                  {editingMenuItem ? 'Update Item' : 'Add Item'}
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
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  scrollContent: {
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  logoSection: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 20,
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  logoEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  logoInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  logoInfoDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  changeLogoBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  changeLogoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  imagesScrollContent: {
    gap: 12,
  },
  restaurantImageWrapper: {
    position: 'relative',
  },
  restaurantImage: {
    width: 140,
    height: 100,
    borderRadius: 12,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 140,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    marginTop: 4,
  },
  addMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  addMenuBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  menuCategory: {
    marginBottom: 16,
  },
  menuCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  menuItemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTextarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  switchSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportContent: {
    flex: 1,
    marginLeft: 14,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  supportDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  saveMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  saveMenuBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
