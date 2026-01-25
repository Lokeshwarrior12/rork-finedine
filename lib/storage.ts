// lib/storage.ts
import { supabase } from './supabase';

export async function uploadImage(
  bucket: string,
  path: string,
  file: any
) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true
    });

  if (error) throw error;

  return path;
}

export function getPublicImageUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
