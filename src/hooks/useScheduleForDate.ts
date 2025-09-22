import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ScheduleForDateRequest {
  dailyPublishedId: string;
  publishDate: string; // ISO date string (YYYY-MM-DD)
}

export const useScheduleForDate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dailyPublishedId, publishDate }: ScheduleForDateRequest) => {
      const { data, error } = await supabase
        .from('daily_published')
        .update({ 
          publish_date: publishDate,
          status: 'queued',
          updated_at: new Date().toISOString()
        })
        .eq('id', dailyPublishedId)
        .select()
        .single();

      if (error) {
        console.error('Error scheduling for date:', error);
        throw new Error(error.message || 'Failed to schedule for date');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      
      toast({
        title: "Scheduled successfully",
        description: `Content scheduled for ${new Date(data.publish_date).toLocaleDateString()}`,
      });
    },
    onError: (error) => {
      console.error('Schedule error:', error);
      toast({
        title: "Scheduling failed", 
        description: error.message || "Failed to schedule content. Please try again.",
        variant: "destructive"
      });
    }
  });
};