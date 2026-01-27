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
  const { profile } = useAuth();

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
    } else if (profile?.id) {
      if (profile.role === 'restaurant_owner' && profile.restaurant_id) {
        filter = `restaurant_id=eq.${profile.restaurant_id}`;
        channelScope = `restaurant:${profile.restaurant_id}`;
      } else {
        filter = `user_id=eq.${profile.id}`;
        channelScope = `user:${profile.id}`;
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

          /**
           * Invalidate cached queries so UI updates automatically
           * Matches lib/api.ts usage
           */
          queryClient.invalidateQueries({ queryKey: ['orders'] });

          if (payload.new?.id) {
            queryClient.invalidateQueries({
              queryKey: ['order', payload.new.id],
            });
          }

          // Optional callback (toast, sound, navigation, etc.)
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
    profile?.id,
    profile?.role,
    profile?.restaurant_id,
    queryClient,
    onUpdate,
  ]);
}
