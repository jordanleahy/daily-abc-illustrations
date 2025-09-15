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

    const channel = supabase
      .channel('page_image_urls_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'page_image_urls',
        filter: `page_id=eq.${pageId}`
      }, (payload) => {
        console.log('Real-time update received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newImage = payload.new as PageImageUrl;
          queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) => 
            [newImage as PageImageUrlVersion, ...old]
          );
          if (newImage.is_latest) {
            queryClient.setQueryData(['page-image-latest', pageId], newImage);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedImage = payload.new as PageImageUrl;
          queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) =>
            old.map(img => img.id === updatedImage.id ? updatedImage as PageImageUrlVersion : img)
          );
          if (updatedImage.is_latest) {
            queryClient.setQueryData(['page-image-latest', pageId], updatedImage);
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          queryClient.setQueryData(['page-image-versions', pageId], (old: PageImageUrlVersion[] = []) =>
            old.filter(img => img.id !== deletedId)
          );
          queryClient.setQueryData(['page-image-latest', pageId], (old: PageImageUrl | null) =>
            old?.id === deletedId ? null : old
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageId, user]);

  const refreshData = () => {
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