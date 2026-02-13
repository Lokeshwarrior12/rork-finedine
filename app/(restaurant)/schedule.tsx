// app/(restaurant)/schedule.tsx
// INTELLIGENT STAFF SCHEDULING - Excel-like Grid with Real Database
// Features: Drag-drop shifts, Role-based filtering, Auto-fill, Export

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Share,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Users,
  Calendar,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Trash2,
  RefreshCw,
  User,
  ArrowLeft,
  Edit2,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = Math.max((width - 140) / 7, 80); // Dynamic column width
const ROW_HEIGHT = 70;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROLES = ['Server', 'Chef', 'Host', 'Bartender', 'Manager', 'Busser', 'Kitchen Staff', 'Delivery'];
const SHIFT_COLORS: Record<string, string> = {
  Server: '#3b82f6',
  Chef: '#ef4444',
  Host: '#8b5cf6',
  Bartender: '#f59e0b',
  Manager: '#10b981',
  Busser: '#6366f1',
  'Kitchen Staff': '#ec4899',
  Delivery: '#14b8a6',
};

interface Employee {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  hourlyRate?: number;
  availability: Record<string, { available: boolean; startTime?: string; endTime?: string }>;
}

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: 'scheduled' | 'confirmed' | 'cancelled';
  notes?: string;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const scheduleRef = useRef<View>(null);

  const restaurantId = user?.restaurantId || '';

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; dayIndex: number } | null>(null);

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'Server',
    email: '',
    phone: '',
    hourlyRate: '',
  });

  const [shiftForm, setShiftForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    notes: '',
  });

  // REAL DATA: Fetch employees
  const {
    data: employeesData,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ['employees', restaurantId],
    queryFn: () => api.getRestaurantEmployees(restaurantId),
    enabled: !!restaurantId,
  });

  // REAL DATA: Fetch shifts for current week
  const weekStart = currentWeekStart.toISOString().split('T')[0];
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const {
    data: shiftsData,
    isLoading: shiftsLoading,
    error: shiftsError,
    refetch: refetchShifts,
  } = useQuery({
    queryKey: ['shifts', restaurantId, weekStart],
    queryFn: () => api.getRestaurantShifts(restaurantId, { startDate: weekStart, endDate: weekEndStr }),
    enabled: !!restaurantId,
  });

  // REAL DATA: Create employee
  const createEmployeeMutation = useMutation({
    mutationFn: (data: any) => api.createEmployee(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', restaurantId] });
      setShowEmployeeModal(false);
      resetEmployeeForm();
      Alert.alert('Success', 'Employee added');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Update employee
  const updateEmployeeMutation = useMutation({
    mutationFn: (data: any) => api.updateEmployee(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', restaurantId] });
      setShowEmployeeModal(false);
      resetEmployeeForm();
      Alert.alert('Success', 'Employee updated');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Delete employee
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', restaurantId] });
      queryClient.invalidateQueries({ queryKey: ['shifts', restaurantId] });
      Alert.alert('Success', 'Employee deleted');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Create shift
  const createShiftMutation = useMutation({
    mutationFn: (data: any) => api.createShift(restaurantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', restaurantId, weekStart] });
      setShowShiftModal(false);
      setSelectedCell(null);
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  // REAL DATA: Delete shift
  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => api.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', restaurantId, weekStart] });
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const employees = (employeesData?.data || []) as Employee[];
  const shifts = (shiftsData?.data || []) as Shift[];

  const filteredEmployees =
    selectedRole === 'All' ? employees : employees.filter((e) => e.role === selectedRole);

  const styles = createStyles(colors, isDark);

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({ name: '', role: 'Server', email: '', phone: '', hourlyRate: '' });
    setEditingEmployee(null);
  };

  const handleAddEmployee = () => {
    resetEmployeeForm();
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      role: employee.role,
      email: employee.email || '',
      phone: employee.phone || '',
      hourlyRate: employee.hourlyRate?.toString() || '',
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.name.trim()) {
      Alert.alert('Error', 'Employee name is required');
      return;
    }

    const data = {
      name: employeeForm.name,
      role: employeeForm.role,
      email: employeeForm.email || undefined,
      phone: employeeForm.phone || undefined,
      hourlyRate: employeeForm.hourlyRate ? parseFloat(employeeForm.hourlyRate) : undefined,
    };

    if (editingEmployee) {
      updateEmployeeMutation.mutate({ id: editingEmployee.id, ...data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    Alert.alert('Delete Employee', 'This will also delete all their shifts. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEmployeeMutation.mutate(id) },
    ]);
  };

  const handleCellPress = (employeeId: string, dayIndex: number) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;

    const existingShift = getShiftForCell(employeeId, dayIndex);
    if (existingShift) {
      Alert.alert('Shift Exists', 'This shift is already scheduled', [
        { text: 'OK', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteShiftMutation.mutate(existingShift.id),
        },
      ]);
    } else {
      setSelectedCell({ employeeId, dayIndex });
      setShiftForm({ startTime: '09:00', endTime: '17:00', notes: '' });
      setShowShiftModal(true);
    }
  };

  const handleSaveShift = () => {
    if (!selectedCell) return;

    const employee = employees.find((e) => e.id === selectedCell.employeeId);
    if (!employee) return;

    const date = weekDates[selectedCell.dayIndex];
    const dateStr = date.toISOString().split('T')[0];

    const data = {
      employeeId: employee.id,
      date: dateStr,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      notes: shiftForm.notes || undefined,
    };

    createShiftMutation.mutate(data);
  };

  const getShiftForCell = (employeeId: string, dayIndex: number): Shift | undefined => {
    const date = weekDates[dayIndex].toISOString().split('T')[0];
    return shifts.find((s) => s.employeeId === employeeId && s.date === date);
  };

  const autoGenerateSchedule = () => {
    Alert.alert('Auto-Generate', 'Generate shifts based on employee availability?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Generate',
        onPress: async () => {
          const newShifts: any[] = [];

          employees.forEach((employee) => {
            weekDates.forEach((date, dayIndex) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayName = DAYS[dayIndex].toLowerCase();
              const availability = employee.availability?.[dayName];

              if (availability?.available) {
                const existingShift = shifts.find(
                  (s) => s.employeeId === employee.id && s.date === dateStr
                );

                if (!existingShift) {
                  newShifts.push({
                    employeeId: employee.id,
                    date: dateStr,
                    startTime: availability.startTime || '09:00',
                    endTime: availability.endTime || '17:00',
                  });
                }
              }
            });
          });

          // Create all shifts
          try {
            for (const shift of newShifts) {
              await api.createShift(restaurantId, shift);
            }
            queryClient.invalidateQueries({ queryKey: ['shifts', restaurantId, weekStart] });
            Alert.alert('Success', `Generated ${newShifts.length} shifts`);
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleExport = async () => {
    let text = `📅 Weekly Schedule - ${weekDates[0].toLocaleDateString()} to ${weekDates[6].toLocaleDateString()}\n\n`;

    filteredEmployees.forEach((emp) => {
      text += `${emp.name} (${emp.role}):\n`;
      DAYS.forEach((day, index) => {
        const shift = getShiftForCell(emp.id, index);
        if (shift) {
          text += `  ${day.slice(0, 3)}: ${shift.startTime} - ${shift.endTime}\n`;
        }
      });
      text += '\n';
    });

    try {
      await Share.share({ message: text, title: 'Weekly Schedule' });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const totalHours = shifts.reduce((sum, shift) => {
    const start = parseInt(shift.startTime.split(':')[0]);
    const end = parseInt(shift.endTime.split(':')[0]);
    return sum + (end - start);
  }, 0);

  const isLoading = employeesLoading || shiftsLoading;
  const error = employeesError || shiftsError;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Schedule</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Failed to Load Schedule</Text>
          <Text style={styles.errorMessage}>
            {error instanceof Error ? error.message : 'Something went wrong'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              refetchEmployees();
              refetchShifts();
            }}
          >
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
        <View style={styles.headerLeft}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Schedule</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={handleExport}>
            <Share2 size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <Pressable style={styles.navBtn} onPress={() => navigateWeek(-1)}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.weekText}>
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
          {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Pressable style={styles.navBtn} onPress={() => navigateWeek(1)}>
          <ChevronRight size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Role Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roleFilter}
      >
        <Pressable
          style={[styles.roleChip, selectedRole === 'All' && styles.roleChipActive]}
          onPress={() => setSelectedRole('All')}
        >
          <Text style={[styles.roleChipText, selectedRole === 'All' && styles.roleChipTextActive]}>
            All ({employees.length})
          </Text>
        </Pressable>
        {ROLES.map((role) => {
          const count = employees.filter((e) => e.role === role).length;
          if (count === 0) return null;
          return (
            <Pressable
              key={role}
              style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
              onPress={() => setSelectedRole(role)}
            >
              <View
                style={[styles.roleIndicator, { backgroundColor: SHIFT_COLORS[role] || colors.primary }]}
              />
              <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                {role} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable style={styles.actionBtn} onPress={handleAddEmployee}>
          <Users size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Add Employee</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={autoGenerateSchedule}
        >
          <RefreshCw size={16} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Auto-Fill</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Schedule Grid */}
        <View ref={scheduleRef} style={styles.scheduleTable}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.employeeColumn}>
                  <Text style={styles.employeeHeaderText}>Employee</Text>
                </View>
                {SHORT_DAYS.map((day, index) => (
                  <View key={day} style={[styles.dayColumn, { width: COLUMN_WIDTH }]}>
                    <Text style={styles.dayHeaderText}>{day}</Text>
                    <Text style={styles.dayDateText}>
                      {weekDates[index].getDate()}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Table Rows */}
              {filteredEmployees.map((employee) => (
                <View key={employee.id} style={[styles.tableRow, { height: ROW_HEIGHT }]}>
                  {/* Employee Info Column */}
                  <View style={styles.employeeColumn}>
                    <View style={styles.employeeInfo}>
                      <View
                        style={[
                          styles.employeeAvatar,
                          { backgroundColor: SHIFT_COLORS[employee.role] || colors.primary },
                        ]}
                      >
                        <Text style={styles.employeeInitial}>{employee.name[0]}</Text>
                      </View>
                      <View style={styles.employeeDetails}>
                        <Text style={styles.employeeName} numberOfLines={1}>
                          {employee.name}
                        </Text>
                        <Text style={styles.employeeRole}>{employee.role}</Text>
                      </View>
                      <Pressable onPress={() => handleEditEmployee(employee)}>
                        <Edit2 size={14} color={colors.primary} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteEmployee(employee.id)}>
                        <Trash2 size={14} color={colors.error} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Shift Cells */}
                  {SHORT_DAYS.map((day, dayIndex) => {
                    const shift = getShiftForCell(employee.id, dayIndex);
                    return (
                      <Pressable
                        key={day}
                        style={[styles.dayColumn, { width: COLUMN_WIDTH }]}
                        onPress={() => handleCellPress(employee.id, dayIndex)}
                      >
                        {shift ? (
                          <View
                            style={[
                              styles.shiftCell,
                              {
                                backgroundColor: `${SHIFT_COLORS[employee.role] || colors.primary}15`,
                                borderLeftColor: SHIFT_COLORS[employee.role] || colors.primary,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.shiftTime,
                                { color: SHIFT_COLORS[employee.role] || colors.primary },
                              ]}
                            >
                              {shift.startTime}
                            </Text>
                            <Text
                              style={[
                                styles.shiftTime,
                                { color: SHIFT_COLORS[employee.role] || colors.primary },
                              ]}
                            >
                              {shift.endTime}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.emptyCell}>
                            <Plus size={14} color={colors.textMuted} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Week Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{shifts.length}</Text>
              <Text style={styles.summaryLabel}>Shifts</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{filteredEmployees.length}</Text>
              <Text style={styles.summaryLabel}>Employees</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{totalHours}h</Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Employee Modal */}
      <Modal visible={showEmployeeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowEmployeeModal(false);
                  resetEmployeeForm();
                }}
              >
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Employee name"
                  placeholderTextColor={colors.textMuted}
                  value={employeeForm.name}
                  onChangeText={(text) => setEmployeeForm({ ...employeeForm, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.roleChips}>
                    {ROLES.map((role) => (
                      <Pressable
                        key={role}
                        style={[
                          styles.roleOptionChip,
                          employeeForm.role === role && styles.roleOptionChipActive,
                        ]}
                        onPress={() => setEmployeeForm({ ...employeeForm, role })}
                      >
                        <View
                          style={[
                            styles.roleIndicatorSmall,
                            { backgroundColor: SHIFT_COLORS[role] || colors.primary },
                          ]}
                        />
                        <Text
                          style={[
                            styles.roleOptionText,
                            employeeForm.role === role && styles.roleOptionTextActive,
                          ]}
                        >
                          {role}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={employeeForm.email}
                  onChangeText={(text) => setEmployeeForm({ ...employeeForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="+1 234 567 8900"
                  placeholderTextColor={colors.textMuted}
                  value={employeeForm.phone}
                  onChangeText={(text) => setEmployeeForm({ ...employeeForm, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hourly Rate ($)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="15.00"
                  placeholderTextColor={colors.textMuted}
                  value={employeeForm.hourlyRate}
                  onChangeText={(text) => setEmployeeForm({ ...employeeForm, hourlyRate: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <Pressable
                style={styles.saveBtn}
                onPress={handleSaveEmployee}
                disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
              >
                {createEmployeeMutation.isPending || updateEmployeeMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>
                      {editingEmployee ? 'Update' : 'Add'} Employee
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Shift Modal */}
      <Modal visible={showShiftModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add Shift - {selectedCell ? DAYS[selectedCell.dayIndex] : ''}
              </Text>
              <Pressable
                onPress={() => {
                  setShowShiftModal(false);
                  setSelectedCell(null);
                }}
              >
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="09:00"
                  placeholderTextColor={colors.textMuted}
                  value={shiftForm.startTime}
                  onChangeText={(text) => setShiftForm({ ...shiftForm, startTime: text })}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="17:00"
                  placeholderTextColor={colors.textMuted}
                  value={shiftForm.endTime}
                  onChangeText={(text) => setShiftForm({ ...shiftForm, endTime: text })}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder="Any special notes..."
                placeholderTextColor={colors.textMuted}
                value={shiftForm.notes}
                onChangeText={(text) => setShiftForm({ ...shiftForm, notes: text })}
                multiline
                numberOfLines={2}
              />
            </View>

            <Pressable
              style={styles.saveBtn}
              onPress={handleSaveShift}
              disabled={createShiftMutation.isPending}
            >
              {createShiftMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Add Shift</Text>
                </>
              )}
            </Pressable>
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
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    headerActions: { flexDirection: 'row', gap: 8 },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
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
    weekNavigation: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.backgroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekText: { fontSize: 15, fontWeight: '600', color: colors.text },
    roleFilter: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    roleChipTextActive: { color: '#fff' },
    roleIndicator: { width: 8, height: 8, borderRadius: 4 },
    actionButtons: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 10,
      gap: 6,
    },
    actionBtnSecondary: { backgroundColor: colors.primaryLight },
    actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
    scheduleTable: {
      margin: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: colors.primaryLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    employeeColumn: {
      width: 140,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      justifyContent: 'center',
    },
    employeeHeaderText: { fontSize: 12, fontWeight: '700', color: colors.primary },
    dayColumn: { paddingVertical: 8, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.border },
    dayHeaderText: { fontSize: 11, fontWeight: '700', color: colors.primary },
    dayDateText: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    employeeInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    employeeAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    employeeInitial: { fontSize: 12, fontWeight: '700', color: '#fff' },
    employeeDetails: { flex: 1 },
    employeeName: { fontSize: 11, fontWeight: '600', color: colors.text },
    employeeRole: { fontSize: 9, color: colors.textSecondary },
    shiftCell: {
      borderRadius: 6,
      padding: 4,
      margin: 2,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderLeftWidth: 2,
    },
    shiftTime: { fontSize: 9, fontWeight: '600' },
    emptyCell: {
      flex: 1,
      margin: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summarySection: { paddingHorizontal: 16, marginTop: 8 },
    summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
    summaryGrid: { flexDirection: 'row', gap: 10 },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    summaryValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
    summaryLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
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
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    formGroup: { marginBottom: 16 },
    formLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
    formInput: {
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    formRow: { flexDirection: 'row', gap: 12 },
    formTextarea: { minHeight: 60, textAlignVertical: 'top' },
    roleChips: { flexDirection: 'row', gap: 8 },
    roleOptionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    roleOptionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleIndicatorSmall: { width: 8, height: 8, borderRadius: 4 },
    roleOptionText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    roleOptionTextActive: { color: '#fff' },
    saveBtn: {
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
    saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  });
