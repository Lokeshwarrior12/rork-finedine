import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  QrCode,
  CheckCircle,
  XCircle,
  Keyboard,
  X,
  DollarSign,
  Percent,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { userCoupons } from '@/mocks/data';
import { Coupon, Transaction } from '@/types';

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.7;

type PaymentMethod = 'cash' | 'card' | 'upi';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [scanned, setScanned] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [validatedCoupon, setValidatedCoupon] = useState<Coupon | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [billingForm, setBillingForm] = useState({
    originalAmount: '',
    paymentMethod: 'card' as PaymentMethod,
    customerName: '',
  });
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  const styles = createStyles(colors, isDark);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    validateCoupon(data);
  };

  const validateCoupon = (code: string) => {
    console.log('Validating coupon:', code);
    
    const coupon = userCoupons.find(c => c.code === code);
    
    if (!coupon) {
      Alert.alert('Invalid Coupon', 'This coupon code is not valid.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
      return;
    }
    
    if (coupon.status === 'used') {
      Alert.alert('Already Used', 'This coupon has already been redeemed.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
      return;
    }
    
    if (coupon.status === 'expired') {
      Alert.alert('Expired', 'This coupon has expired.', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
      return;
    }
    
    setValidatedCoupon(coupon);
    setShowBillingModal(true);
  };

  const handleManualEntry = () => {
    if (!couponCode.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }
    validateCoupon(couponCode.trim());
  };

  const calculateDiscount = () => {
    if (!validatedCoupon || !billingForm.originalAmount) return 0;
    const amount = parseFloat(billingForm.originalAmount);
    return (amount * validatedCoupon.discountPercent) / 100;
  };

  const calculateFinal = () => {
    if (!billingForm.originalAmount) return 0;
    const amount = parseFloat(billingForm.originalAmount);
    return amount - calculateDiscount();
  };

  const handleCompleteBilling = () => {
    if (!billingForm.originalAmount || parseFloat(billingForm.originalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bill amount');
      return;
    }

    if (!billingForm.customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    const newTransaction: Transaction = {
      id: `txn_${Date.now()}`,
      restaurantId: '1',
      customerId: 'customer_1',
      customerName: billingForm.customerName,
      couponId: validatedCoupon?.id,
      couponCode: validatedCoupon?.code,
      originalAmount: parseFloat(billingForm.originalAmount),
      discountAmount: calculateDiscount(),
      finalAmount: calculateFinal(),
      paymentMethod: billingForm.paymentMethod,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    setTransaction(newTransaction);
    setShowBillingModal(false);
    setShowSuccessModal(true);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    console.log('Transaction completed:', newTransaction);
  };

  const handleNewScan = () => {
    setScanned(false);
    setValidatedCoupon(null);
    setCouponCode('');
    setBillingForm({ originalAmount: '', paymentMethod: 'card', customerName: '' });
    setTransaction(null);
    setShowSuccessModal(false);
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan & Bill</Text>
        </View>
        
        <View style={styles.webContainer}>
          <View style={styles.webIconContainer}>
            <QrCode size={80} color={colors.primary} />
          </View>
          <Text style={styles.webTitle}>QR Scanner</Text>
          <Text style={styles.webSubtitle}>
            Camera scanning is not available on web.{'\n'}
            Please use manual code entry.
          </Text>
          
          <View style={styles.manualEntrySection}>
            <Text style={styles.manualLabel}>Enter Coupon Code:</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="e.g., FD-ABC123XY"
              placeholderTextColor={colors.placeholder}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <Pressable style={styles.validateBtn} onPress={handleManualEntry}>
              <CheckCircle size={20} color="#fff" />
              <Text style={styles.validateBtnText}>Validate Coupon</Text>
            </Pressable>
          </View>
          
          <View style={styles.testCodes}>
            <Text style={styles.testCodesTitle}>Test Codes:</Text>
            {userCoupons.slice(0, 3).map(c => (
              <Pressable 
                key={c.id} 
                style={styles.testCodeBtn}
                onPress={() => setCouponCode(c.code)}
              >
                <Text style={styles.testCodeText}>{c.code}</Text>
                <Text style={styles.testCodeStatus}>({c.status})</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Modal visible={showBillingModal} animationType="slide" transparent>
          <BillingModal
            colors={colors}
            isDark={isDark}
            validatedCoupon={validatedCoupon}
            billingForm={billingForm}
            setBillingForm={setBillingForm}
            calculateDiscount={calculateDiscount}
            calculateFinal={calculateFinal}
            onClose={() => { setShowBillingModal(false); setScanned(false); }}
            onComplete={handleCompleteBilling}
          />
        </Modal>

        <Modal visible={showSuccessModal} animationType="fade" transparent>
          <SuccessModal
            colors={colors}
            transaction={transaction}
            onNewScan={handleNewScan}
          />
        </Modal>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Camera size={64} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan QR codes on customer coupons.
        </Text>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Bill</Text>
        <Pressable 
          style={styles.manualBtn}
          onPress={() => setManualEntry(!manualEntry)}
        >
          <Keyboard size={20} color={colors.primary} />
          <Text style={styles.manualBtnText}>Manual Entry</Text>
        </Pressable>
      </View>

      {manualEntry ? (
        <View style={styles.manualContainer}>
          <View style={styles.manualIconContainer}>
            <QrCode size={60} color={colors.primary} />
          </View>
          <Text style={styles.manualTitle}>Enter Coupon Code</Text>
          <TextInput
            style={styles.manualInputLarge}
            placeholder="Enter coupon code"
            placeholderTextColor={colors.placeholder}
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
            autoFocus
          />
          <Pressable style={styles.validateBtnLarge} onPress={handleManualEntry}>
            <CheckCircle size={22} color="#fff" />
            <Text style={styles.validateBtnTextLarge}>Validate</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.scanHint}>
                  {scanned ? 'Processing...' : 'Point camera at QR code'}
                </Text>
              </View>
            </View>
          </CameraView>
        </View>
      )}

      <Modal visible={showBillingModal} animationType="slide" transparent>
        <BillingModal
          colors={colors}
          isDark={isDark}
          validatedCoupon={validatedCoupon}
          billingForm={billingForm}
          setBillingForm={setBillingForm}
          calculateDiscount={calculateDiscount}
          calculateFinal={calculateFinal}
          onClose={() => { setShowBillingModal(false); setScanned(false); }}
          onComplete={handleCompleteBilling}
        />
      </Modal>

      <Modal visible={showSuccessModal} animationType="fade" transparent>
        <SuccessModal
          colors={colors}
          transaction={transaction}
          onNewScan={handleNewScan}
        />
      </Modal>
    </View>
  );
}

const BillingModal = ({
  colors,
  isDark,
  validatedCoupon,
  billingForm,
  setBillingForm,
  calculateDiscount,
  calculateFinal,
  onClose,
  onComplete,
}: any) => {
  const styles = createStyles(colors, isDark);
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Complete Billing</Text>
          <Pressable onPress={onClose}>
            <X size={24} color={colors.text} />
          </Pressable>
        </View>

        {validatedCoupon && (
          <View style={styles.couponInfo}>
            <View style={styles.couponBadge}>
              <Percent size={18} color="#fff" />
              <Text style={styles.couponBadgeText}>{validatedCoupon.discountPercent}% OFF</Text>
            </View>
            <Text style={styles.couponTitle}>{validatedCoupon.dealTitle}</Text>
            <Text style={styles.couponCode}>Code: {validatedCoupon.code}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Customer Name *</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Enter customer name"
            placeholderTextColor={colors.placeholder}
            value={billingForm.customerName}
            onChangeText={(text) => setBillingForm({ ...billingForm, customerName: text })}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Bill Amount *</Text>
          <View style={styles.amountInput}>
            <DollarSign size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.amountInputField}
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={billingForm.originalAmount}
              onChangeText={(text) => setBillingForm({ ...billingForm, originalAmount: text })}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {[
              { key: 'card', label: 'Card', icon: CreditCard },
              { key: 'cash', label: 'Cash', icon: Banknote },
              { key: 'upi', label: 'UPI', icon: Smartphone },
            ].map(method => (
              <Pressable
                key={method.key}
                style={[
                  styles.paymentMethod,
                  billingForm.paymentMethod === method.key && styles.paymentMethodActive,
                ]}
                onPress={() => setBillingForm({ ...billingForm, paymentMethod: method.key as PaymentMethod })}
              >
                <method.icon 
                  size={20} 
                  color={billingForm.paymentMethod === method.key ? '#fff' : colors.text} 
                />
                <Text style={[
                  styles.paymentMethodText,
                  billingForm.paymentMethod === method.key && styles.paymentMethodTextActive,
                ]}>
                  {method.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.billSummary}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>${billingForm.originalAmount || '0.00'}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.success }]}>
              Discount ({validatedCoupon?.discountPercent || 0}%)
            </Text>
            <Text style={[styles.billValue, { color: colors.success }]}>
              -${calculateDiscount().toFixed(2)}
            </Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total</Text>
            <Text style={styles.billTotalValue}>${calculateFinal().toFixed(2)}</Text>
          </View>
        </View>

        <Pressable style={styles.completeBtn} onPress={onComplete}>
          <Receipt size={20} color="#fff" />
          <Text style={styles.completeBtnText}>Complete Transaction</Text>
        </Pressable>
      </View>
    </View>
  );
};

const SuccessModal = ({ colors, transaction, onNewScan }: any) => {
  return (
    <View style={[successStyles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <View style={[successStyles.container, { backgroundColor: colors.surface }]}>
        <View style={[successStyles.iconContainer, { backgroundColor: colors.success }]}>
          <CheckCircle size={48} color="#fff" />
        </View>
        
        <Text style={[successStyles.title, { color: colors.text }]}>Transaction Complete!</Text>
        
        {transaction && (
          <View style={successStyles.details}>
            <Text style={[successStyles.detailLabel, { color: colors.textSecondary }]}>
              Customer: {transaction.customerName}
            </Text>
            <Text style={[successStyles.detailLabel, { color: colors.textSecondary }]}>
              Original: ${transaction.originalAmount.toFixed(2)}
            </Text>
            <Text style={[successStyles.detailLabel, { color: colors.success }]}>
              Saved: ${transaction.discountAmount.toFixed(2)}
            </Text>
            <Text style={[successStyles.finalAmount, { color: colors.text }]}>
              Paid: ${transaction.finalAmount.toFixed(2)}
            </Text>
          </View>
        )}
        
        <Pressable 
          style={[successStyles.button, { backgroundColor: colors.primary }]}
          onPress={onNewScan}
        >
          <QrCode size={20} color="#fff" />
          <Text style={successStyles.buttonText}>Scan New Coupon</Text>
        </Pressable>
      </View>
    </View>
  );
};

const successStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 20,
  },
  details: {
    width: '100%',
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  finalAmount: {
    fontSize: 28,
    fontWeight: '700' as const,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    gap: 6,
  },
  manualBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  permissionBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddle: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scanFrame: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 30,
  },
  scanHint: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500' as const,
  },
  manualContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 20,
  },
  manualInputLarge: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  validateBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    gap: 10,
    width: '100%',
  },
  validateBtnTextLarge: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#fff',
  },
  webContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  manualEntrySection: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    letterSpacing: 1,
  },
  validateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  validateBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  testCodes: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testCodesTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  testCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  testCodeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  testCodeStatus: {
    fontSize: 12,
    color: colors.textSecondary,
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
  couponInfo: {
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: 'center',
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  couponBadgeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  amountInputField: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.text,
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentMethod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  paymentMethodActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
  },
  paymentMethodTextActive: {
    color: '#fff',
  },
  billSummary: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    borderRadius: 14,
    marginVertical: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  billTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
  },
  billTotalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 20,
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
