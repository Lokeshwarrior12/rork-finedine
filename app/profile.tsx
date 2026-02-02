import { View, Text, Button } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch('/profile'),
  });

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24 }}>Profile</Text>
      <Text>Name: {profile?.name}</Text>
      <Text>Points: {profile?.points}</Text>
      <Button title="Logout" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}
