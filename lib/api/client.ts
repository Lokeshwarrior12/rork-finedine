import { auth } from '@/lib/supabase';
import { API_URL } from '@/lib/config';

export async function apiFetch(path: string, options?: RequestInit) {
  const baseUrl = API_URL || '';
  const url = `${baseUrl}${path}`;

  try {
    const session = await auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string>),
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    console.log('📡 apiFetch:', options?.method || 'GET', path);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`❌ apiFetch Error: ${path}`, error);
    throw error;
  }
}
