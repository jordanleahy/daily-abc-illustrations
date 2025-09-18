import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UpdateSeoMetadataParams {
  bookId: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string | null;
}

export const useUpdateSeoMetadata = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ bookId, seoTitle, seoDescription, ogImageUrl }: UpdateSeoMetadataParams) => {
      if (!user) throw new Error('User not authenticated');

      // Create a temporary daily_published entry for book-level SEO if needed
      // This allows us to use the existing seo_metadata table structure
      let dailyPublishedId = `book-seo-${bookId}`;
      
      // First, check if we already have a daily_published entry for this book's SEO
      const { data: existingSeo } = await supabase
        .from('seo_metadata')
        .select('daily_published_id')
        .contains('source_data', { bookId })
        .eq('user_id', user.id)
        .eq('is_latest', true)
        .maybeSingle();

      if (existingSeo) {
        dailyPublishedId = existingSeo.daily_published_id;
      }

      // Prepare source data
      const sourceData = {
        bookId,
        contentType: 'book',
        updatedAt: new Date().toISOString(),
      };

      // If we have existing SEO data, mark it as not latest
      if (existingSeo) {
        await supabase
          .from('seo_metadata')
          .update({ is_latest: false })
          .eq('daily_published_id', dailyPublishedId)
          .eq('user_id', user.id);
      }

      // Insert new SEO metadata
      const { data, error } = await supabase
        .from('seo_metadata')
        .insert({
          user_id: user.id,
          daily_published_id: dailyPublishedId,
          seo_title: seoTitle,
          seo_description: seoDescription,
          og_image_url: ogImageUrl,
          optimization_status: 'complete',
          is_latest: true,
          is_active: true,
          version_number: 1,
          source_data: sourceData,
          generation_metadata: {
            type: 'manual',
            updatedBy: user.id,
            updatedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating SEO metadata:', error);
        throw error;
      }

      return data;
    },
  });
};