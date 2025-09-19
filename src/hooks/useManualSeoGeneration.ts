import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManualSeoGenerationParams {
  dailyPublishedId: string;
}

interface ManualSeoGenerationResponse {
  success: boolean;
  seoMetadataId?: string;
  message?: string;
  error?: string;
}

export const useManualSeoGeneration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dailyPublishedId }: ManualSeoGenerationParams): Promise<ManualSeoGenerationResponse> => {
      console.log('Triggering manual SEO generation for:', dailyPublishedId);

      const { data, error } = await supabase.functions.invoke('manual-seo-generation', {
        body: { dailyPublishedId }
      });

      if (error) {
        console.error('Manual SEO generation error:', error);
        throw new Error(error.message || 'Failed to generate SEO metadata');
      }

      return data as ManualSeoGenerationResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "SEO Generated Successfully",
          description: data.message || "SEO metadata has been generated for this content",
        });

        // Invalidate related queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['seo-metadata'] });
        queryClient.invalidateQueries({ queryKey: ['daily-published-opengraph'] });
      } else {
        throw new Error(data.error || 'SEO generation failed');
      }
    },
    onError: (error: Error) => {
      console.error('Manual SEO generation failed:', error);
      toast({
        title: "SEO Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};