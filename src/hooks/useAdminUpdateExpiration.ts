import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface UpdateExpirationRequest {
  dailyPublishedId: string;
  newExpiresAt: string;
}

interface UpdateExpirationResponse {
  success: boolean;
  message?: string;
  error?: string;
  daily_published_id?: string;
  new_expires_at?: string;
  updated_at?: string;
}

export const useAdminUpdateExpiration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({ dailyPublishedId, newExpiresAt }: UpdateExpirationRequest): Promise<UpdateExpirationResponse> => {
      console.log('Calling admin-update-expiration function...', { dailyPublishedId, newExpiresAt });
      
      if (!session?.access_token) {
        throw new Error('No valid session found');
      }
      
      const { data, error } = await supabase.functions.invoke('admin-update-expiration', {
        body: { 
          dailyPublishedId,
          newExpiresAt
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Error calling admin update expiration function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to update expiration');
      }

      return data;
    },
    onSuccess: (data) => {
      console.log('Admin update expiration response:', data);
      
      toast({
        title: 'Expiration Updated',
        description: data.message || 'Successfully updated expiration time',
      });

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
    },
    onError: (error) => {
      console.error('Failed to update expiration:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update expiration time. Please try again.',
      });
    },
  });
};