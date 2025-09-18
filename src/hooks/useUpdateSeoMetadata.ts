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

      // First, get the actual daily_published entry for this book
      const { data: dailyPublished, error: dailyError } = await supabase
        .from('daily_published')
        .select('id')
        .eq('book_id', bookId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (dailyError) {
        console.error('Error fetching daily published entry:', dailyError);
        throw new Error('Failed to find daily published entry for this book');
      }

      if (!dailyPublished) {
        throw new Error('This book must be daily published before SEO metadata can be updated');
      }

      const dailyPublishedId = dailyPublished.id;
      
      // Check if we already have SEO metadata for this daily publication
      const { data: existingSeo } = await supabase
        .from('seo_metadata')
        .select('daily_published_id')
        .eq('daily_published_id', dailyPublishedId)
        .eq('user_id', user.id)
        .eq('is_latest', true)
        .maybeSingle();

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

      // Get the next version number for this daily publication
      const { data: versionData } = await supabase
        .rpc('get_next_seo_version_number', { p_daily_published_id: dailyPublishedId });
      
      const versionNumber = versionData || 1;

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
          version_number: versionNumber,
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