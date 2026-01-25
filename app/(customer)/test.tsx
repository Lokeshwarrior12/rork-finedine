import { View, Text, Button, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function TestScreen() {
  const { session, user, isAuthenticated, login, signup } = useAuth();

  const testSupabase = async () => {
    try {
      if (!isSupabaseConfigured) {
        alert('Supabase not configured - using tRPC auth only');
        return;
      }
      const { data, error } = await supabase.from('restaurants').select('count');
      alert(JSON.stringify({ data, error }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Error: ' + errorMessage);
    }
  };

  const testLogin = async () => {
    try {
      await login({ 
        email: 'test@example.com', 
        password: 'password123',
        role: 'customer'
      });
      alert('Login successful!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Login error: ' + errorMessage);
    }
  };

  const testSignup = async () => {
    try {
      await signup({ 
        email: 'test@example.com', 
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
        address: '123 Main St',
        role: 'customer',
        skipVerification: true
      });
      alert('Signup successful!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert('Signup error: ' + errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Auth Status: {isAuthenticated ? 'Logged in' : 'Not logged in'}</Text>
      <Text style={styles.text}>User: {user?.name || 'None'}</Text>
      <Text style={styles.text}>Supabase Session: {session ? 'Active' : 'None'}</Text>
      <Text style={styles.text}>Supabase Configured: {isSupabaseConfigured ? 'Yes' : 'No'}</Text>
      <View style={styles.buttonContainer}>
        <Button title="Test Supabase" onPress={testSupabase} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Test Login" onPress={testLogin} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Test Signup" onPress={testSignup} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    marginVertical: 5,
    width: '80%',
  },
});
