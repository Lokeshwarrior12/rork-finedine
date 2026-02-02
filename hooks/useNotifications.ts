import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const channel = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
        setNotifications((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  return notifications;
}
