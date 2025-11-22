import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { NewTrick } from '@/types/trick';

/**
 * Hook to create a new trick and assign it to kids with goals
 */
export function useCreateTrick() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewTrick) => {
      if (!user?.id) throw new Error('User not authenticated');

      // 1. Create the trick
      const { data: trick, error: trickError } = await supabase
        .from('tricks')
        .insert({
          parent_user_id: user.id,
          name: data.name,
          description: data.description || null,
          photo_url: data.photo_url || null,
          points_per_completion: data.points_per_completion,
        })
        .select()
        .single();

      if (trickError) throw trickError;

      // 2. Create trick goals for each assigned kid
      if (data.assigned_kids.length > 0) {
        const goals = data.assigned_kids.map((kid) => ({
          trick_id: trick.id,
          kid_profile_id: kid.kid_profile_id,
          parent_user_id: user.id,
          target_count: kid.target_count,
        }));

        const { error: goalsError } = await supabase
          .from('trick_goals')
          .insert(goals);

        if (goalsError) throw goalsError;
      }

      return trick;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tricks'] });
      queryClient.invalidateQueries({ queryKey: ['trick-goals'] });
      toast.success('Trick created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create trick:', error);
      toast.error('Failed to create trick');
    },
  });
}
