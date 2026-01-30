// hooks/useOrderSubscription.ts
// Supabase Realtime subscription for orders (production-safe)

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface UseOrderSubscriptionProps {
  userId?: string;
  restaurantId?: string;
  onUpdate?: (payload: any) => void;
}

/* -------------------------------------------------------------------------- */
/*                             Hook Implementation                              */
/* -------------------------------------------------------------------------- */

export function useOrderSubscription(
  props: UseOrderSubscriptionProps = {}
) {
  const { userId, restaurantId, onUpdate } = props;
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    /**
     * Decide subscription scope
     * Priority:
     * 1. Explicit userId
     * 2. Explicit restaurantId
     * 3. Auth profile (customer or owner)
     */
    let filter: string | undefined;
    let channelScope = 'global';

    if (userId) {
      filter = `user_id=eq.${userId}`;
      channelScope = `user:${userId}`;
    } else if (restaurantId) {
      filter = `restaurant_id=eq.${restaurantId}`;
      channelScope = `restaurant:${restaurantId}`;
    } else if (user?.id) {
      if (user.role === 'restaurant_owner' && user.restaurantId) {
        filter = `restaurant_id=eq.${user.restaurantId}`;
        channelScope = `restaurant:${user.restaurantId}`;
      } else {
        filter = `user_id=eq.${user.id}`;
        channelScope = `user:${user.id}`;
      }
    }

    // 🚫 No context → do not subscribe
    if (!filter) {
      console.warn('[Realtime] No filter available, skipping subscription');
      return;
    }

    const channelName = `orders:${channelScope}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT | UPDATE | DELETE | *
          schema: 'public',
          table: 'orders',
          filter,
        },
        (payload) => {
          console.log('[Realtime] Order event:', payload);

          queryClient.invalidateQueries({ queryKey: ['orders'] });

          const newRecord = payload.new as Record<string, unknown> | undefined;
          if (newRecord?.id) {
            queryClient.invalidateQueries({
              queryKey: ['order', newRecord.id],
            });
          }

          if (onUpdate) {
            onUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${channelName}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      console.log(`[Realtime] Unsubscribed from ${channelName}`);
    };
  }, [
    userId,
    restaurantId,
    user?.id,
    user?.role,
    user?.restaurantId,
    queryClient,
    onUpdate,
  ]);
}
