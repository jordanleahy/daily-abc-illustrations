import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConsumeScreenTimeParams {
  kidId: string;
  seconds: number;
  videoId: string;
}

export const useConsumeScreenTime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ kidId, seconds, videoId }: ConsumeScreenTimeParams) => {
      const { data, error } = await supabase.functions.invoke('consume-screen-time', {
        body: { 
          kidProfileId: kidId, 
          secondsWatched: seconds, 
          videoId 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kid-screen-time'] });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
    },
    onError: (error) => {
      console.error('Failed to consume screen time:', error);
    }
  });
};
