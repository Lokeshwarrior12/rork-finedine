import { View, Text, Button, TextInput } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export default function BookingsScreen() {
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');

  const { mutate: createBooking } = useMutation({
    mutationFn: () => apiFetch('/bookings', 'POST', { date, guests: parseInt(guests) }),
  });

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24 }}>Make a Booking</Text>
      <TextInput placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <TextInput placeholder="Number of Guests" value={guests} onChangeText={setGuests} keyboardType="numeric" />
      <Button title="Book" onPress={createBooking} />
    </View>
  );
}
