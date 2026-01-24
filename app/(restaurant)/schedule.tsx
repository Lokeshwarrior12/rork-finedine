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
  AlertCircle,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Employee, Shift, WeeklyAvailability, DayAvailability } from '@/types';


const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ROLES = ['Server', 'Chef', 'Host', 'Bartender', 'Manager', 'Busser', 'Dishwasher'];

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
  { id: '5', name: 'Alex Wilson', role: 'Server', availability: defaultAvailability, hourlyRate: 15 },
];

export default function ScheduleScreen() {
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
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('');
  
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'Server',
    phone: '',
    email: '',
    hourlyRate: '',
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({ name: '', role: 'Server', phone: '', email: '', hourlyRate: '' });
    setShowEmployeeModal(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      role: employee.role,
      phone: employee.phone || '',
      email: employee.email || '',
      hourlyRate: employee.hourlyRate?.toString() || '',
    });
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = () => {
    if (!employeeForm.name.trim()) {
      Alert.alert('Error', 'Please enter employee name');
      return;
    }

    if (editingEmployee) {
      setEmployees(prev => prev.map(e => 
        e.id === editingEmployee.id 
          ? { ...e, ...employeeForm, hourlyRate: parseFloat(employeeForm.hourlyRate) || 0 }
          : e
      ));
    } else {
      const newEmployee: Employee = {
        id: `emp_${Date.now()}`,
        name: employeeForm.name,
        role: employeeForm.role,
        phone: employeeForm.phone,
        email: employeeForm.email,
        hourlyRate: parseFloat(employeeForm.hourlyRate) || 0,
        availability: defaultAvailability,
      };
      setEmployees(prev => [...prev, newEmployee]);
    }
    setShowEmployeeModal(false);
  };

  const handleDeleteEmployee = (id: string) => {
    Alert.alert('Delete Employee', 'Are you sure you want to remove this employee?', [
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

  const handleAddShift = (dayIndex: number) => {
    setSelectedDay(DAYS[dayIndex]);
    setEditingShift(null);
    setShiftForm({ employeeId: '', startTime: '09:00', endTime: '17:00' });
    setShowShiftModal(true);
  };

  const handleSaveShift = () => {
    if (!shiftForm.employeeId) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }

    const employee = employees.find(e => e.id === shiftForm.employeeId);
    if (!employee) return;

    const dayIndex = DAYS.indexOf(selectedDay);
    const date = weekDates[dayIndex];

    if (editingShift) {
      setShifts(prev => prev.map(s => 
        s.id === editingShift.id 
          ? { ...s, ...shiftForm, employeeName: employee.name, role: employee.role }
          : s
      ));
    } else {
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
    }
    setShowShiftModal(false);
  };

  const handleDeleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  const handleRequestSwap = (shift: Shift) => {
    setEditingShift(shift);
    setShowSwapModal(true);
  };

  const handleConfirmSwap = (targetEmployeeId: string) => {
    if (!editingShift) return;
    
    const targetEmployee = employees.find(e => e.id === targetEmployeeId);
    if (!targetEmployee) return;

    setShifts(prev => prev.map(s => 
      s.id === editingShift.id 
        ? { ...s, status: 'swapRequested', swapRequestedWith: targetEmployee.name }
        : s
    ));
    setShowSwapModal(false);
    Alert.alert('Swap Requested', `Swap request sent to ${targetEmployee.name}`);
  };

  const getShiftsForDay = (dayIndex: number) => {
    const date = weekDates[dayIndex].toISOString().split('T')[0];
    return shifts.filter(s => s.date === date);
  };

  const calculateTotalHours = (employeeId: string) => {
    const employeeShifts = shifts.filter(s => s.employeeId === employeeId);
    return employeeShifts.reduce((total, shift) => {
      const start = parseInt(shift.startTime.split(':')[0]);
      const end = parseInt(shift.endTime.split(':')[0]);
      return total + (end - start);
    }, 0);
  };

  const handleExport = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Export', 'Export feature is not available on web');
      return;
    }

    try {
      if (scheduleRef.current) {
        const uri = await captureRef(scheduleRef, {
          format: 'png',
          quality: 1,
        });
        
        if ((Platform.OS as string) !== 'web') {
          const Sharing = await import('expo-sharing');
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri);
          } else {
            Alert.alert('Success', 'Schedule saved to: ' + uri);
          }
        } else {
          Alert.alert('Success', 'Schedule captured successfully');
        }
      }
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('Error', 'Failed to export schedule');
    }
  };

  const handleShare = async () => {
    const scheduleText = generateScheduleText();
    
    try {
      await Share.share({
        message: scheduleText,
        title: 'Weekly Schedule',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const generateScheduleText = () => {
    let text = `📅 Weekly Schedule\n${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}\n\n`;
    
    DAYS.forEach((day, index) => {
      const dayShifts = getShiftsForDay(index);
      text += `${day} (${formatDate(weekDates[index])}):\n`;
      if (dayShifts.length === 0) {
        text += '  No shifts scheduled\n';
      } else {
        dayShifts.forEach(shift => {
          text += `  • ${shift.employeeName} (${shift.role}): ${shift.startTime} - ${shift.endTime}\n`;
        });
      }
      text += '\n';
    });
    
    return text;
  };

  const autoGenerateSchedule = () => {
    Alert.alert(
      'Auto-Generate Schedule',
      'This will create shifts based on employee availability. Existing shifts will be kept.',
      [
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
            Alert.alert('Success', `Generated ${newShifts.length} new shifts`);
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Schedule</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={handleShare}>
            <Share2 size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={handleExport}>
            <Download size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={styles.weekNavigation}>
          <Pressable style={styles.navBtn} onPress={() => navigateWeek(-1)}>
            <ChevronLeft size={24} color={colors.text} />
          </Pressable>
          <View style={styles.weekDisplay}>
            <Calendar size={18} color={colors.primary} />
            <Text style={styles.weekText}>
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </Text>
          </View>
          <Pressable style={styles.navBtn} onPress={() => navigateWeek(1)}>
            <ChevronRight size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.actionButtons}>
          <Pressable style={styles.actionBtn} onPress={handleAddEmployee}>
            <Users size={18} color="#fff" />
            <Text style={styles.actionBtnText}>Add Employee</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={autoGenerateSchedule}>
            <RefreshCw size={18} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Auto-Generate</Text>
          </Pressable>
        </View>

        <View style={styles.employeesSection}>
          <Text style={styles.sectionTitle}>Employees ({employees.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.employeesList}>
              {employees.map(employee => (
                <Pressable 
                  key={employee.id} 
                  style={styles.employeeCard}
                  onPress={() => handleEditEmployee(employee)}
                >
                  <View style={styles.employeeAvatar}>
                    <User size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.employeeName} numberOfLines={1}>{employee.name}</Text>
                  <Text style={styles.employeeRole}>{employee.role}</Text>
                  <Text style={styles.employeeHours}>{calculateTotalHours(employee.id)}h this week</Text>
                  <Pressable 
                    style={styles.deleteEmployeeBtn}
                    onPress={() => handleDeleteEmployee(employee.id)}
                  >
                    <Trash2 size={14} color={colors.error} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View ref={scheduleRef} style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.scheduleGrid}>
              <View style={styles.scheduleHeader}>
                {SHORT_DAYS.map((day, index) => (
                  <View key={day} style={styles.dayColumn}>
                    <Text style={styles.dayName}>{day}</Text>
                    <Text style={styles.dayDate}>{formatDate(weekDates[index])}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.scheduleBody}>
                {SHORT_DAYS.map((day, dayIndex) => (
                  <View key={day} style={styles.dayColumn}>
                    {getShiftsForDay(dayIndex).map(shift => (
                      <View 
                        key={shift.id} 
                        style={[
                          styles.shiftCard,
                          shift.status === 'swapRequested' && styles.shiftCardSwap,
                        ]}
                      >
                        <Text style={styles.shiftName} numberOfLines={1}>{shift.employeeName}</Text>
                        <Text style={styles.shiftTime}>{shift.startTime} - {shift.endTime}</Text>
                        <Text style={styles.shiftRole}>{shift.role}</Text>
                        {shift.status === 'swapRequested' && (
                          <View style={styles.swapBadge}>
                            <RefreshCw size={10} color={colors.warning} />
                          </View>
                        )}
                        <View style={styles.shiftActions}>
                          <Pressable onPress={() => handleRequestSwap(shift)}>
                            <RefreshCw size={12} color={colors.textSecondary} />
                          </Pressable>
                          <Pressable onPress={() => handleDeleteShift(shift.id)}>
                            <X size={12} color={colors.error} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                    <Pressable 
                      style={styles.addShiftBtn}
                      onPress={() => handleAddShift(dayIndex)}
                    >
                      <Plus size={16} color={colors.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Week Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{shifts.length}</Text>
              <Text style={styles.summaryLabel}>Total Shifts</Text>
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
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>
                {shifts.filter(s => s.status === 'swapRequested').length}
              </Text>
              <Text style={styles.summaryLabel}>Swap Requests</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showEmployeeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEmployee ? 'Edit Employee' : 'Add Employee'}
              </Text>
              <Pressable onPress={() => setShowEmployeeModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter name"
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
                        style={[
                          styles.roleChip,
                          employeeForm.role === role && styles.roleChipActive,
                        ]}
                        onPress={() => setEmployeeForm({ ...employeeForm, role })}
                      >
                        <Text style={[
                          styles.roleChipText,
                          employeeForm.role === role && styles.roleChipTextActive,
                        ]}>
                          {role}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Phone number"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="phone-pad"
                  value={employeeForm.phone}
                  onChangeText={(text) => setEmployeeForm({ ...employeeForm, phone: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Hourly Rate ($)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                  value={employeeForm.hourlyRate}
                  onChangeText={(text) => setEmployeeForm({ ...employeeForm, hourlyRate: text })}
                />
              </View>

              <Pressable style={styles.saveBtn} onPress={handleSaveEmployee}>
                <Check size={20} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {editingEmployee ? 'Update Employee' : 'Add Employee'}
                </Text>
              </Pressable>
            </ScrollView>
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

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Employee *</Text>
                <View style={styles.employeeSelect}>
                  {employees.map(employee => (
                    <Pressable
                      key={employee.id}
                      style={[
                        styles.employeeOption,
                        shiftForm.employeeId === employee.id && styles.employeeOptionActive,
                      ]}
                      onPress={() => setShiftForm({ ...shiftForm, employeeId: employee.id })}
                    >
                      <User size={16} color={shiftForm.employeeId === employee.id ? '#fff' : colors.text} />
                      <Text style={[
                        styles.employeeOptionText,
                        shiftForm.employeeId === employee.id && styles.employeeOptionTextActive,
                      ]}>
                        {employee.name}
                      </Text>
                      <Text style={[
                        styles.employeeOptionRole,
                        shiftForm.employeeId === employee.id && { color: 'rgba(255,255,255,0.7)' },
                      ]}>
                        {employee.role}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
                <Check size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Add Shift</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSwapModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Swap</Text>
              <Pressable onPress={() => setShowSwapModal(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>

            {editingShift && (
              <View style={styles.swapInfo}>
                <AlertCircle size={20} color={colors.warning} />
                <Text style={styles.swapInfoText}>
                  Swap {editingShift.employeeName}&apos;s shift on {editingShift.dayOfWeek}
                </Text>
              </View>
            )}

            <Text style={styles.swapLabel}>Select employee to swap with:</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {employees
                .filter(e => e.id !== editingShift?.employeeId)
                .map(employee => (
                  <Pressable
                    key={employee.id}
                    style={styles.swapOption}
                    onPress={() => handleConfirmSwap(employee.id)}
                  >
                    <View style={styles.swapOptionAvatar}>
                      <User size={18} color={colors.primary} />
                    </View>
                    <View style={styles.swapOptionInfo}>
                      <Text style={styles.swapOptionName}>{employee.name}</Text>
                      <Text style={styles.swapOptionRole}>{employee.role}</Text>
                    </View>
                    <RefreshCw size={18} color={colors.textSecondary} />
                  </Pressable>
                ))}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnSecondary: {
    backgroundColor: colors.primaryLight,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  employeesSection: {
    marginBottom: 24,
  },
  employeesList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  employeeCard: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  employeeName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.text,
    textAlign: 'center',
  },
  employeeRole: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  employeeHours: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  deleteEmployeeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
  },
  scheduleSection: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    paddingVertical: 16,
  },
  scheduleGrid: {
    paddingHorizontal: 20,
  },
  scheduleHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayColumn: {
    width: 85,
    marginRight: 8,
  },
  dayName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.text,
    textAlign: 'center',
  },
  dayDate: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  scheduleBody: {
    flexDirection: 'row',
  },
  shiftCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  shiftCardSwap: {
    borderLeftColor: colors.warning,
    backgroundColor: colors.warningLight,
  },
  shiftName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.text,
  },
  shiftTime: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shiftRole: {
    fontSize: 9,
    color: colors.primary,
    marginTop: 2,
  },
  swapBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  shiftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  addShiftBtn: {
    width: '100%',
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 12,
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
    maxHeight: '85%',
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
  employeeSelect: {
    gap: 8,
  },
  employeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  employeeOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  employeeOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    flex: 1,
  },
  employeeOptionTextActive: {
    color: '#fff',
  },
  employeeOptionRole: {
    fontSize: 12,
    color: colors.textSecondary,
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
  swapInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  swapInfoText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
  swapLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  swapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    marginBottom: 8,
    gap: 12,
  },
  swapOptionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapOptionInfo: {
    flex: 1,
  },
  swapOptionName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  swapOptionRole: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
