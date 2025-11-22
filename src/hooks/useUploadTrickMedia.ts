import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CreateTrickMediaUpload } from '@/types/trickMedia';
import { uploadTrickPhoto } from '@/utils/trickPhotoUpload';

export function useUploadTrickMedia() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTrickMediaUpload) => {
      if (!user?.id) throw new Error('User not authenticated');

      // 1. Upload the file to storage
      const mediaUrl = await uploadTrickPhoto(data.media_file, user.id);

      // 2. Determine media type
      const mediaType = data.media_file.type.startsWith('image/') ? 'image' : 'video';

      // 3. Create database record
      const { data: upload, error } = await supabase
        .from('trick_media_uploads')
        .insert({
          trick_id: data.trick_id,
          trick_goal_id: data.trick_goal_id || null,
          kid_profile_id: data.kid_profile_id,
          parent_user_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          captured_at: data.captured_at?.toISOString() || null,
          location_latitude: data.location?.latitude || null,
          location_longitude: data.location?.longitude || null,
          location_accuracy: data.location?.accuracy || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      return upload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trick-media-uploads'] });
      toast.success('Media uploaded successfully!');
    },
    onError: (error) => {
      console.error('Failed to upload media:', error);
      toast.error('Failed to upload media');
    },
  });
}
