import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a video file to Supabase Storage
 * @param file - Video file or blob
 * @param userId - User ID for organizing files
 * @returns Public URL of the uploaded video
 */
export async function uploadTrickVideo(file: Blob, userId: string): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileName = `${userId}/${timestamp}-${random}.mp4`;
  
  const { data, error } = await supabase.storage
    .from('trick-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'video/mp4',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('trick-photos')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Upload a video thumbnail to Supabase Storage
 * @param blob - Thumbnail image blob
 * @param userId - User ID for organizing files
 * @returns Public URL of the uploaded thumbnail
 */
export async function uploadTrickVideoThumbnail(blob: Blob, userId: string): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileName = `${userId}/${timestamp}-${random}-thumb.jpg`;
  
  const { data, error } = await supabase.storage
    .from('trick-photos')
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg',
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('trick-photos')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete a video or thumbnail from Supabase Storage
 * @param url - Public URL of the file to delete
 */
export async function deleteTrickVideo(url: string): Promise<void> {
  if (!url) return;
  
  // Extract the file path from the URL
  const path = url.split('/trick-photos/')[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from('trick-photos')
    .remove([path]);

  if (error) throw error;
}
