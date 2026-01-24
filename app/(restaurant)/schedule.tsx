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
  Platform,
  Share,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
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
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Employee, Shift, WeeklyAvailability, DayAvailability } from '@/types';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40 - 100) / 7;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROLES = ['Server', 'Chef', 'Host', 'Bartender', 'Manager', 'Busser'];

const defaultAvailability: WeeklyAvailability = {
  monday: { available: true, startTime: '09:00', endTime: '22:00' },
  tuesday: { available: true, startTime: '09:00', endTime: '22:00' },
  wednesday: { available: true, startTime: '09:00', endTime: '22:00' },
  thursday: { available: true, startTime: '09:00', endTime: '22:00' },
  friday: { available: true, startTime: '09:00', endTime: '22:00' },
  saturday: { available: true, startTime: '09:00', endTime: '22:00' },
  sunday: { available: false },
};

const mockEmployees: Employee[] = [
  { id: '1', name: 'John Smith', role: 'Server', availability: defaultAvailability, hourlyRate: 15 },
  { id: '2', name: 'Sarah Johnson', role: 'Chef', availability: { ...defaultAvailability, sunday: { available: true, startTime: '10:00', endTime: '18:00' } }, hourlyRate: 22 },
  { id: '3', name: 'Mike Davis', role: 'Bartender', availability: defaultAvailability, hourlyRate: 18 },
  { id: '4', name: 'Emily Brown', role: 'Host', availability: { ...defaultAvailability, monday: { available: false } }, hourlyRate: 14 },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const scheduleRef = useRef<View>(null);
  
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'Server',
  });
  
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    startTime: '09:00',
    endTime: '17:00',
  });

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

  const formatDate = (date: Date) => {
    return date.getDate().toString();
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const handleAddEmployee = () => {
    setEmployeeForm({ name: '', role: 'Server' });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.name.trim()) {
      Alert.alert('Error', 'Please enter employee name');
      return;
    }

    const newEmployee: Employee = {
      id: `emp_${Date.now()}`,
      name: employeeForm.name,
      role: employeeForm.role,
      availability: defaultAvailability,
    };
    setEmployees(prev => [...prev, newEmployee]);
    setShowEmployeeModal(false);
  };

  const handleDeleteEmployee = (id: string) => {
    Alert.alert('Delete Employee', 'Remove this employee?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          setEmployees(prev => prev.filter(e => e.id !== id));
          setShifts(prev => prev.filter(s => s.employeeId !== id));
        }
      },
    ]);
  };

  const handleAddShift = (dayIndex: number, employeeId: string) => {
    setSelectedDay(DAYS[dayIndex]);
    setShiftForm({ employeeId, startTime: '09:00', endTime: '17:00' });
    setShowShiftModal(true);
  };

  const handleSaveShift = () => {
    const employee = employees.find(e => e.id === shiftForm.employeeId);
    if (!employee) return;

    const dayIndex = DAYS.indexOf(selectedDay);
    const date = weekDates[dayIndex];

    const newShift: Shift = {
      id: `shift_${Date.now()}`,
      employeeId: shiftForm.employeeId,
      employeeName: employee.name,
      date: date.toISOString().split('T')[0],
      dayOfWeek: selectedDay,
      startTime: shiftForm.startTime,
      endTime: shiftForm.endTime,
      role: employee.role,
      status: 'scheduled',
    };
    setShifts(prev => [...prev, newShift]);
    setShowShiftModal(false);
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const getShiftForCell = (employeeId: string, dayIndex: number) => {
    const date = weekDates[dayIndex].toISOString().split('T')[0];
    return shifts.find(s => s.employeeId === employeeId && s.date === date);
  };

  const handleShare = async () => {
    let text = `📅 Weekly Schedule\n\n`;
    
    employees.forEach(emp => {
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

  const handleExport = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Export', 'Export feature is not available on web');
      return;
    }

    try {
      if (scheduleRef.current) {
        const uri = await captureRef(scheduleRef, { format: 'png', quality: 1 });
        
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          const Sharing = await import('expo-sharing');
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('Success', 'Schedule saved');
          }
        }
      }
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('Error', 'Failed to export schedule');
    }
  };

  const autoGenerateSchedule = () => {
    Alert.alert('Auto-Generate', 'Create shifts based on availability?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Generate',
        onPress: () => {
          const newShifts: Shift[] = [];
          const daysLower = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
          
          employees.forEach(employee => {
            daysLower.forEach((day, index) => {
              const availability = employee.availability[day as keyof WeeklyAvailability] as DayAvailability;
              const date = weekDates[index].toISOString().split('T')[0];
              const existingShift = shifts.find(s => s.employeeId === employee.id && s.date === date);
              
              if (availability.available && !existingShift) {
                newShifts.push({
                  id: `shift_${Date.now()}_${employee.id}_${index}`,
                  employeeId: employee.id,
                  employeeName: employee.name,
                  date,
                  dayOfWeek: DAYS[index],
                  startTime: availability.startTime || '09:00',
                  endTime: availability.endTime || '17:00',
                  role: employee.role,
                  status: 'scheduled',
                });
              }
            });
          });
          
          setShifts(prev => [...prev, ...newShifts]);
          Alert.alert('Success', `Generated ${newShifts.length} shifts`);
        }
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Schedule</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={handleShare}>
            <Share2 size={18} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={handleExport}>
            <Download size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.weekNavigation}>
        <Pressable style={styles.navBtn} onPress={() => navigateWeek(-1)}>
          <ChevronLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.weekText}>
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
        <Pressable style={styles.navBtn} onPress={() => navigateWeek(1)}>
          <ChevronRight size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={styles.actionBtn} onPress={handleAddEmployee}>
          <Users size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Add Employee</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={autoGenerateSchedule}>
          <RefreshCw size={16} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Auto-Fill</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View ref={scheduleRef} style={styles.scheduleTable}>
          <View style={styles.tableHeader}>
            <View style={styles.employeeColumn}>
              <Text style={styles.employeeHeaderText}>Employee</Text>
            </View>
            {SHORT_DAYS.map((day, index) => (
              <View key={day} style={styles.dayColumn}>
                <Text style={styles.dayHeaderText}>{day}</Text>
                <Text style={styles.dayDateText}>{formatDate(weekDates[index])}</Text>
              </View>
            ))}
          </View>

          {employees.map((employee) => (
            <View key={employee.id} style={styles.tableRow}>
              <View style={styles.employeeColumn}>
                <View style={styles.employeeInfo}>
                  <View style={styles.employeeAvatar}>
                    <Text style={styles.employeeInitial}>{employee.name[0]}</Text>
                  </View>
                  <View style={styles.employeeDetails}>
                    <Text style={styles.employeeName} numberOfLines={1}>{employee.name}</Text>
                    <Text style={styles.employeeRole}>{employee.role}</Text>
                  </View>
                  <Pressable onPress={() => handleDeleteEmployee(employee.id)}>
                    <Trash2 size={14} color={colors.error} />
                  </Pressable>
                </View>
              </View>
              {SHORT_DAYS.map((day, dayIndex) => {
                const shift = getShiftForCell(employee.id, dayIndex);
                return (
                  <Pressable 
                    key={day} 
                    style={styles.dayColumn}
                    onPress={() => !shift && handleAddShift(dayIndex, employee.id)}
                  >
                    {shift ? (
                      <View style={styles.shiftCell}>
                        <Text style={styles.shiftTime}>{shift.startTime}</Text>
                        <Text style={styles.shiftTime}>{shift.endTime}</Text>
                        <Pressable 
                          style={styles.deleteShiftBtn}
                          onPress={() => handleDeleteShift(shift.id)}
                        >
                          <X size={10} color={colors.error} />
                        </Pressable>
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

        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Week Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{shifts.length}</Text>
              <Text style={styles.summaryLabel}>Shifts</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{employees.length}</Text>
              <Text style={styles.summaryLabel}>Employees</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {shifts.reduce((total, shift) => {
                  const start = parseInt(shift.startTime.split(':')[0]);
                  const end = parseInt(shift.endTime.split(':')[0]);
                  return total + (end - start);
                }, 0)}h
              </Text>
              <Text style={styles.summaryLabel}>Total Hours</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showEmployeeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Employee</Text>
              <Pressable onPress={() => setShowEmployeeModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Employee name"
                placeholderTextColor={colors.placeholder}
                value={employeeForm.name}
                onChangeText={(text) => setEmployeeForm({ ...employeeForm, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.roleChips}>
                  {ROLES.map(role => (
                    <Pressable
                      key={role}
                      style={[styles.roleChip, employeeForm.role === role && styles.roleChipActive]}
                      onPress={() => setEmployeeForm({ ...employeeForm, role })}
                    >
                      <Text style={[styles.roleChipText, employeeForm.role === role && styles.roleChipTextActive]}>
                        {role}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Pressable style={styles.saveBtn} onPress={handleSaveEmployee}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Add Employee</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showShiftModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Shift - {selectedDay}</Text>
              <Pressable onPress={() => setShowShiftModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="09:00"
                  placeholderTextColor={colors.placeholder}
                  value={shiftForm.startTime}
                  onChangeText={(text) => setShiftForm({ ...shiftForm, startTime: text })}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>End Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="17:00"
                  placeholderTextColor={colors.placeholder}
                  value={shiftForm.endTime}
                  onChangeText={(text) => setShiftForm({ ...shiftForm, endTime: text })}
                />
              </View>
            </View>

            <Pressable style={styles.saveBtn} onPress={handleSaveShift}>
              <Check size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Add Shift</Text>
            </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  weekText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
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
  actionBtnSecondary: {
    backgroundColor: colors.primaryLight,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#fff',
  },
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
    width: 100,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: 'center',
  },
  employeeHeaderText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  dayColumn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  dayDateText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 60,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  employeeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeInitial: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.text,
  },
  employeeRole: {
    fontSize: 9,
    color: colors.textSecondary,
  },
  shiftCell: {
    backgroundColor: colors.successLight,
    borderRadius: 6,
    padding: 4,
    margin: 2,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 2,
    borderLeftColor: colors.success,
  },
  shiftTime: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: colors.success,
  },
  deleteShiftBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
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
  summarySection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleChips: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  roleChipTextActive: {
    color: '#fff',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
