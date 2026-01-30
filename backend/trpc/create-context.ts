import { supabase } from '@/lib/supabase';

export interface TRPCContext {
  userId: string | null;
  restaurantId: string | null;
  role: string | null;
  [key: string]: unknown;
}

export async function createContext(opts: { req: Request; resHeaders: Headers }): Promise<TRPCContext> {
  const authHeader = opts.req.headers.get('authorization');
  
  let userId: string | null = null;
  let restaurantId: string | null = null;
  let role: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        userId = user.id;
        
        const { data: profile } = await supabase
          .from('users')
          .select('role, restaurant_id')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          role = profile.role;
          restaurantId = profile.restaurant_id;
        }
      }
    } catch (err) {
      console.warn('[tRPC] Auth error:', err);
    }
  }

  return {
    userId,
    restaurantId,
    role,
  };
}
