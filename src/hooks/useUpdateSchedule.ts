import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateScheduleData {
  dailyPublishedId: string;
  start_date?: string;
  start_time?: string;
  expire_date?: string;
  expire_time?: string;
}

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateScheduleData) => {
      const updateData: any = {};
      
      if (data.start_date) updateData.start_date = data.start_date;
      if (data.start_time) updateData.start_time = data.start_time;
      if (data.expire_date) updateData.expire_date = data.expire_date;
      if (data.expire_time) updateData.expire_time = data.expire_time;
      
      // Also update the legacy publish_date if start_date is provided
      if (data.start_date) {
        updateData.publish_date = data.start_date;
      }
      
      const { data: result, error } = await supabase
        .from('daily_published')
        .update(updateData)
        .eq('id', data.dailyPublishedId)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating schedule:', error);
        throw error;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      toast.success('Schedule updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update schedule:', error);
      toast.error('Failed to update schedule');
    },
  });
};