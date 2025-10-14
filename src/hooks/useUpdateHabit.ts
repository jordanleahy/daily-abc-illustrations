import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

interface UpdateHabitData {
  habitId: string;
  title: string;
  description?: string;
  photo_url?: string;
  coin_amount: number;
  frequency: string;
  deadline_time?: string;
}

/**
 * Hook to update an existing habit
 */
export function useUpdateHabit() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateHabitData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { habitId, ...updateData } = data;

      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .update({
          title: updateData.title,
          description: updateData.description || null,
          photo_url: updateData.photo_url || null,
          coin_amount: updateData.coin_amount,
          frequency: updateData.frequency,
          deadline_time: updateData.deadline_time || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('parent_user_id', user.id)
        .select()
        .single();

      if (habitError) throw habitError;
      return habitData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast({
        title: 'Success',
        description: 'Habit updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update habit: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}
