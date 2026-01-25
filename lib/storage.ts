// lib/storage.ts

import { supabase } from '@/lib/supabase';

export async function uploadImage(
  fileUri: string,
  bucket: string,
  path: string
) {
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;
  return data.path;
}
