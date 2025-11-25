import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UpdateTrickParams {
  trickId: string;
  name: string;
  description: string;
  points_per_completion: number;
  photo_url?: string;
  video_urls?: string;
  feature_angle?: string | null;
  type?: string | null;
  assigned_kids: { kid_profile_id: string; target_count: number }[];
}

/**
 * Hook to update an existing trick and its goals
 */
export function useUpdateTrick() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trickId, name, description, points_per_completion, photo_url, video_urls, feature_angle, type, assigned_kids }: UpdateTrickParams) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Update trick
      const { error: trickError } = await supabase
        .from('tricks')
        .update({
          name,
          description,
          points_per_completion,
          photo_url,
          video_urls,
          feature_angle,
          type,
        })
        .eq('id', trickId)
        .eq('parent_user_id', user.id);

      if (trickError) throw trickError;

      // Get existing goals
      const { data: existingGoals } = await supabase
        .from('trick_goals')
        .select('id, kid_profile_id')
        .eq('trick_id', trickId)
        .eq('parent_user_id', user.id);

      const existingKidIds = new Set(existingGoals?.map(g => g.kid_profile_id) || []);
      const newKidIds = new Set(assigned_kids.map(k => k.kid_profile_id));

      // Deactivate goals for kids no longer assigned
      const goalsToDeactivate = existingGoals?.filter(g => !newKidIds.has(g.kid_profile_id)) || [];
      if (goalsToDeactivate.length > 0) {
        const { error: deactivateError } = await supabase
          .from('trick_goals')
          .update({ is_active: false })
          .in('id', goalsToDeactivate.map(g => g.id));
        
        if (deactivateError) throw deactivateError;
      }

      // Update existing goals or create new ones
      for (const kid of assigned_kids) {
        if (existingKidIds.has(kid.kid_profile_id)) {
          // Update existing goal
          const goalId = existingGoals?.find(g => g.kid_profile_id === kid.kid_profile_id)?.id;
          if (goalId) {
            const { error: updateError } = await supabase
              .from('trick_goals')
              .update({ target_count: kid.target_count, is_active: true })
              .eq('id', goalId);
            
            if (updateError) throw updateError;
          }
        } else {
          // Create new goal
          const { error: insertError } = await supabase
            .from('trick_goals')
            .insert({
              trick_id: trickId,
              kid_profile_id: kid.kid_profile_id,
              target_count: kid.target_count,
              parent_user_id: user.id,
            });
          
          if (insertError) throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tricks'] });
      queryClient.invalidateQueries({ queryKey: ['trick-goals'] });
      toast.success('Trick updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update trick:', error);
      toast.error('Failed to update trick');
    },
  });
}
