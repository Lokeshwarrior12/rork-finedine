import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />  // Maps to home.tsx
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Add more tabs */}
    </Tabs>
  );
}
