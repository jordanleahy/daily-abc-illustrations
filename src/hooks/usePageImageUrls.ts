import { useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { PageImageUrl, PageImageUrlVersion } from '@/types/pageImageUrl';

export function usePageImageUrls(pageId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch latest image
  const { data: currentImage = null } = useQuery({
    queryKey: ['page-image-latest', pageId],
    queryFn: async (): Promise<PageImageUrl | null> => {
      if (!user || !pageId) return null;

      console.log(`[usePageImageUrls] Fetching current image for page ${pageId}`);

      const { data, error } = await supabase
        .from('page_image_urls')
        .select('*')
        .eq('page_id', pageId)
        .eq('is_latest', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching latest page image:', error);
        throw error;
      }

      console.log(`[usePageImageUrls] Current image result:`, data ? {
        id: data.id,
        version: data.version_number,
        status: data.generation_status,
        hasUrl: !!data.image_url,
        isLatest: data.is_latest
      } : 'No current image found');

      return data as PageImageUrl | null;
    },
    enabled: !!(user && pageId),
  });

  // Fetch all versions
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['page-image-versions', pageId],
    queryFn: async (): Promise<PageImageUrlVersion[]> => {
      if (!user || !pageId) return [];

      const { data, error } = await supabase
        .from('page_image_urls')
        .select('*')
        .eq('page_id', pageId)
        .order('version_number', { ascending: false });

      if (error) {
        console.error('Error fetching page image versions:', error);
        throw error;
      }

      return (data || []) as PageImageUrlVersion[];
    },
    enabled: !!(user && pageId),
  });

  // Create image record mutation
  const createImageMutation = useMutation({
    mutationFn: async ({ bookId, promptUsed }: { bookId: string; promptUsed: string }) => {
      if (!user) throw new Error('User not authenticated');

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

      if (error) throw error;
      return data;
    },
    onSuccess: (newImage) => {
      // Update both latest and versions cache
      queryClient.setQueryData(['page-image-latest', pageId], newImage);
      queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) => 
        [newImage as PageImageUrlVersion, ...old]
      );
    }
  });

  // Update image record mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ recordId, updates }: { recordId: string; updates: Partial<PageImageUrl> }) => {
      const { data, error } = await supabase
        .from('page_image_urls')
        .update(updates)
        .eq('id', recordId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedImage) => {
      // Update latest cache if this is the latest image
      queryClient.setQueryData(['page-image-latest', pageId], (old: PageImageUrl | null) => 
        old?.id === updatedImage.id ? updatedImage : old
      );
      // Update versions cache
      queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) =>
        old.map(img => img.id === updatedImage.id ? updatedImage as PageImageUrlVersion : img)
      );
    }
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!pageId || !user) return;

    console.log(`[usePageImageUrls] Setting up real-time subscription for page ${pageId}`);

    const channel = supabase
      .channel('page_image_urls_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'page_image_urls',
        filter: `page_id=eq.${pageId}`
      }, (payload) => {
        console.log(`[usePageImageUrls] Real-time update received for page ${pageId}:`, payload);
        
        if (payload.eventType === 'INSERT') {
          const newImage = payload.new as PageImageUrl;
          console.log(`[usePageImageUrls] INSERT: New image version ${newImage.version_number}, is_latest: ${newImage.is_latest}`);
          
          queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) => 
            [newImage as PageImageUrlVersion, ...old.filter(img => img.id !== newImage.id)]
          );
          if (newImage.is_latest) {
            console.log(`[usePageImageUrls] Setting new image as current (version ${newImage.version_number})`);
            queryClient.setQueryData(['page-image-latest', pageId], newImage);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedImage = payload.new as PageImageUrl;
          const oldImage = payload.old as PageImageUrl;
          
          console.log(`[usePageImageUrls] UPDATE: Image ${updatedImage.id} updated`, {
            versionNumber: updatedImage.version_number,
            isLatest: updatedImage.is_latest,
            wasLatest: oldImage.is_latest,
            status: updatedImage.generation_status,
            hasImageUrl: !!updatedImage.image_url
          });
          
          // Update versions cache
          queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) =>
            old.map(img => img.id === updatedImage.id ? updatedImage as PageImageUrlVersion : img)
          );
          
          // Update current image cache with enhanced logging
          if (updatedImage.is_latest) {
            console.log(`[usePageImageUrls] ✅ Updated image is now latest (version ${updatedImage.version_number})`);
            // Force update the cache to ensure the UI shows the image
            queryClient.setQueryData(['page-image-latest', pageId], updatedImage);
            
            // If image is complete, make sure we refresh to avoid any stale state
            if (updatedImage.generation_status === 'complete' && updatedImage.image_url) {
              console.log(`[usePageImageUrls] 🔄 Image complete, ensuring fresh cache`);
              // Small delay to ensure database consistency, then refresh
              setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['page-image-latest', pageId] });
              }, 100);
            }
          } else if (oldImage.is_latest && !updatedImage.is_latest) {
            // This image was latest but no longer is - need to find the new latest
            console.log(`[usePageImageUrls] Image was latest but no longer is, refreshing current image`);
            queryClient.invalidateQueries({ queryKey: ['page-image-latest', pageId] });
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          const deletedImage = payload.old as PageImageUrl;
          
          console.log(`[usePageImageUrls] DELETE: Image ${deletedId} deleted (version ${deletedImage.version_number})`);
          
          queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) =>
            old.filter(img => img.id !== deletedId)
          );
          
          if (deletedImage.is_latest) {
            console.log(`[usePageImageUrls] Deleted image was latest, clearing current image`);
            queryClient.setQueryData(['page-image-latest', pageId], null);
            // Also invalidate to refetch in case there's another latest image
            queryClient.invalidateQueries({ queryKey: ['page-image-latest', pageId] });
          }
        }
      })
      .subscribe();

    return () => {
      console.log(`[usePageImageUrls] Cleaning up real-time subscription for page ${pageId}`);
      supabase.removeChannel(channel);
    };
  }, [pageId, user, queryClient]);

  const refreshData = () => {
    console.log(`[usePageImageUrls] Manual refresh requested for page ${pageId}`);
    queryClient.invalidateQueries({ queryKey: ['page-image-latest', pageId] });
    queryClient.invalidateQueries({ queryKey: ['page-image-versions', pageId] });
  };

  return {
    currentImage,
    versions,
    isLoading,
    createImageRecord: (bookId: string, promptUsed: string) => 
      createImageMutation.mutateAsync({ bookId, promptUsed }),
    updateImageRecord: (recordId: string, updates: Partial<PageImageUrl>) =>
      updateImageMutation.mutateAsync({ recordId, updates }),
    refreshData
  };
}