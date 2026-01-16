/**
 * Video Storage Service
 * 
 * Handles uploading generated videos to Supabase storage
 */

import { supabase } from '@/integrations/supabase/client';

export interface VideoUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload a video blob to Supabase storage
 */
export async function uploadVideoToStorage(
  blob: Blob,
  filename: string,
  bookId?: string
): Promise<VideoUploadResult> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'You must be logged in to save videos',
      };
    }

    // Create path: userId/bookId/filename or userId/filename
    const path = bookId 
      ? `${user.id}/${bookId}/${filename}`
      : `${user.id}/${filename}`;

    // Upload to storage
    const { data, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(path, blob, {
        contentType: blob.type,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Video upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('videos')
      .getPublicUrl(path);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Video storage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Save video and open in new tab
 */
export async function saveAndOpenVideo(
  blob: Blob,
  filename: string,
  bookId?: string
): Promise<VideoUploadResult> {
  const result = await uploadVideoToStorage(blob, filename, bookId);
  
  if (result.success && result.publicUrl) {
    // Open the saved video in a new tab
    window.open(result.publicUrl, '_blank');
  }
  
  return result;
}
