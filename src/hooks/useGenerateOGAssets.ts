import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GenerateOGAssetsParams {
  bookId: string;
  title: string;
  description?: string | null;
  dailyPublishedId: string;
}

export const useGenerateOGAssets = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ bookId, title, description, dailyPublishedId }: GenerateOGAssetsParams) => {
      const { data, error } = await supabase.functions.invoke('generate-seo-metadata', {
        body: { 
          bookId, 
          dailyPublishedId, 
          contentTitle: title, 
          bookDescription: description 
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('OG assets generated successfully!', {
        description: data?.seoTitle ? `Title: ${data.seoTitle.substring(0, 50)}...` : undefined
      });
      queryClient.invalidateQueries({ queryKey: ['seo-metadata'] });
    },
    onError: (error: Error) => {
      console.error('Failed to generate OG assets:', error);
      toast.error('Failed to generate OG assets', {
        description: error.message
      });
    }
  });
};
