import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

export default function ModalScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Modal', presentation: 'modal' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Modal</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#333',
  },
});
