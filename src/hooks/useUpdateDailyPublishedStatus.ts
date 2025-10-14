import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DailyPublishedStatus } from '@/types/dailyPublished';

interface UpdateStatusParams {
  id: string;
  status: DailyPublishedStatus;
}

export const useUpdateDailyPublishedStatus = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateStatusParams) => {
      const updates: any = { status };
      
      // Set appropriate fields based on status
      if (status === 'active') {
        updates.is_active = true;
        updates.published_at = new Date().toISOString();
        // Set expires_at to tomorrow at 7:01 AM ET
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const month = tomorrow.getMonth() + 1;
        // Check if we're in Daylight Saving Time (March to November roughly)
        if (month >= 3 && month <= 11) {
          tomorrow.setHours(11, 1, 0, 0); // EDT = UTC-4, so 7:01 AM = 11:01 UTC
        } else {
          tomorrow.setHours(12, 1, 0, 0); // EST = UTC-5, so 7:01 AM = 12:01 UTC
        }
        updates.expires_at = tomorrow.toISOString();
      } else if (status === 'queued') {
        updates.is_active = false;
        // Calculate next available publish date
        const { data: queuedItems } = await supabase
          .from('daily_published')
          .select('publish_date')
          .eq('status', 'queued')
          .order('publish_date', { ascending: false })
          .limit(1);
        
        const lastDate = queuedItems?.[0]?.publish_date;
        const nextDate = new Date(lastDate || new Date());
        nextDate.setDate(nextDate.getDate() + 1);
        updates.publish_date = nextDate.toISOString().split('T')[0];
      } else if (status === 'expired') {
        updates.is_active = false;
      }

      const { data, error } = await supabase
        .from('daily_published')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Status Updated',
        description: `Item status changed to ${variables.status}`,
      });

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-queue'] });
      queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
    },
    onError: (error) => {
      console.error('Failed to update status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
      });
    },
  });
};
