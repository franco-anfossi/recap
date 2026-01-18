import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabase';

const BUCKET_NAME = 'videos';

interface UploadResult {
  url: string;
  path: string;
}

export async function uploadVideo(
  localUri: string,
  userId: string,
  entryDate: string
): Promise<UploadResult> {
  // Generate unique filename
  const filename = `${userId}/${entryDate}-${Date.now()}.mp4`;

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64',
  });

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, bytes.buffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) throw error;

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
  };
}

export async function uploadThumbnail(
  localUri: string,
  userId: string,
  entryDate: string
): Promise<string> {
  const filename = `${userId}/${entryDate}-thumb-${Date.now()}.jpg`;

  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: 'base64',
  });

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, bytes.buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteVideo(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw error;
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}
