import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCoinsAsCurrency } from '@/utils/currency';

/**
 * Hook to track total cost of AI-generated images for a specific page
 * Returns cost data including total cost, version count, and history
 */
export function usePageGenerationCost(pageId: string) {
  return useQuery({
    queryKey: ['page-generation-cost', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_image_urls')
        .select('generation_cost_cents, version_number, source_type, created_at')
        .eq('page_id', pageId)
        .eq('source_type', 'ai_generated')
        .order('version_number', { ascending: true });
      
      if (error) throw error;
      
      const totalCents = data.reduce((sum, img) => sum + (img.generation_cost_cents || 0), 0);
      const versionCount = data.length;
      const costHistory = data.map(img => ({
        version: img.version_number,
        cost: img.generation_cost_cents,
        date: img.created_at
      }));
      
      return {
        totalCostCents: totalCents,
        totalCostFormatted: formatCoinsAsCurrency(totalCents),
        versionCount,
        averageCostCents: versionCount > 0 ? Math.round(totalCents / versionCount) : 0,
        costHistory
      };
    },
    enabled: !!pageId,
  });
}
