import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PageImageUrl, PageImageUrlVersion } from '@/types/pageImageUrl';

export function usePageImageUrls(pageId: string) {
  const { user } = useAuth();
  const [currentImage, setCurrentImage] = useState<PageImageUrl | null>(null);
  const [versions, setVersions] = useState<PageImageUrlVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user || !pageId) return;

    try {
      setIsLoading(true);

      // Get latest image
      const { data: latestData, error: latestError } = await supabase
        .from('page_image_urls')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .maybeSingle();

      if (latestError) {
        console.error('Error fetching latest page image:', latestError);
      } else {
        setCurrentImage(latestData as PageImageUrl | null);
      }

      // Get all versions
      const { data: versionsData, error: versionsError } = await supabase
        .from('page_image_urls')
        .select('*')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false });

      if (versionsError) {
        console.error('Error fetching page image versions:', versionsError);
      } else {
        setVersions((versionsData || []) as PageImageUrlVersion[]);
      }
    } catch (error) {
      console.error('Error loading page image data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up real-time subscription
    const channel = supabase
      .channel('page_image_urls_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'page_image_urls',
        filter: `page_id=eq.${pageId}`
      }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, user]);

  const createImageRecord = async (bookId: string, promptUsed: string) => {
    if (!user) return null;

    try {
      const { data: versionData } = await supabase.rpc('get_next_page_image_version_number', {
        p_page_id: pageId
      });

      const versionNumber = versionData || 1;

      const { data, error } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: pageId,
          book_id: bookId,
          user_id: user.id,
          version_number: versionNumber,
          generation_status: 'not_started',
          prompt_used: promptUsed
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating image record:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating image record:', error);
      return null;
    }
  };

  const updateImageRecord = async (recordId: string, updates: Partial<PageImageUrl>) => {
    try {
      const { data, error } = await supabase
        .from('page_image_urls')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Error updating image record:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating image record:', error);
      return null;
    }
  };

  const refreshData = () => {
    loadData();
  };

  return {
    currentImage,
    versions,
    isLoading,
    createImageRecord,
    updateImageRecord,
    refreshData
  };
}