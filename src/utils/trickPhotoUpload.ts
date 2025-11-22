import { supabase } from '@/integrations/supabase/client';

export async function uploadTrickPhoto(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  // Determine content type for videos and images
  const contentType = file.type || (
    ['mp4', 'webm', 'mov', 'avi'].includes(fileExt) 
      ? `video/${fileExt}` 
      : `image/${fileExt}`
  );
  
  const { data, error } = await supabase.storage
    .from('trick-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('trick-photos')
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteTrickPhoto(photoUrl: string): Promise<void> {
  if (!photoUrl) return;
  
  // Extract the file path from the URL
  const path = photoUrl.split('/trick-photos/')[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from('trick-photos')
    .remove([path]);

  if (error) throw error;
}
