import { View, Text, Button } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function TestScreen() {
  const { session, signIn, signUp } = useAuth();

  const testSupabase = async () => {
    try {
      const { data, error } = await supabase.from('restaurants').select('count');
      alert(JSON.stringify({ data, error }));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Session: {session ? 'Logged in' : 'Not logged in'}</Text>
      <Button title="Test Supabase" onPress={testSupabase} />
      <Button title="Sign In Test" onPress={() => signIn('test@example.com', 'password123')} />
      <Button title="Sign Up Test" onPress={() => signUp('test@example.com', 'password123', 'Test User', '1234567890', '123 Main St')} />
    </View>
  );
}
