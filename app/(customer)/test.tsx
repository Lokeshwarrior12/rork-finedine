import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TestScreen() {
  const { session, user, isAuthenticated, signIn, signUp } = useAuth();

  const testLogin = async () => {
    try {
      const result = await signIn('test@example.com', 'password123');
      if (result.error) {
        Alert.alert('Login Error', result.error);
      } else {
        Alert.alert('Success', 'Login successful!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Login Error', errorMessage);
    }
  };

  const testSignup = async () => {
    try {
      const result = await signUp('test@example.com', 'password123', 'Test User');
      if (result.error) {
        Alert.alert('Signup Error', result.error);
      } else {
        Alert.alert('Success', 'Signup successful!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Signup Error', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Auth Status: {isAuthenticated ? 'Logged in' : 'Not logged in'}</Text>
      <Text style={styles.text}>User: {user?.name || 'None'}</Text>
      <Text style={styles.text}>Supabase Session: {session ? 'Active' : 'None'}</Text>
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
