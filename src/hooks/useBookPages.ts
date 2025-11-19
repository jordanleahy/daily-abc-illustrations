import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';
import { toast } from 'sonner';
import { queryKeys } from '@/hooks/queryKeys';

export const useBookPages = (bookId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading, error } = useQuery({
    queryKey: queryKeys.pages.byBook(bookId || ''),
    queryFn: async () => {
      if (!bookId) return [];
      
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('book_id', bookId)
        .order('page_number', { ascending: true });

      if (error) {
        console.error('Error fetching pages:', error);
        toast.error('Failed to load pages');
        throw error;
      }

      return (data || []).map(page => ({
        ...page,
        content: page.content as Page['content']
      }));
    },
    enabled: !!bookId,
  });

  // Set up real-time subscription for pages
  useEffect(() => {
    if (!bookId) return;

    const channel = supabase
      .channel(`pages-${bookId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pages',
          filter: `book_id=eq.${bookId}`
        },
        (payload) => {
          console.log('Page inserted:', payload.new);
          queryClient.setQueryData(queryKeys.pages.byBook(bookId), (old: Page[] = []) => {
            const newPage = {
              ...payload.new,
              content: payload.new.content as Page['content']
            } as Page;
            // Insert in correct order by page_number
            return [...old, newPage].sort((a, b) => a.page_number - b.page_number);
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pages',
          filter: `book_id=eq.${bookId}`
        },
        (payload) => {
          console.log('Page updated:', payload.new);
          queryClient.setQueryData(queryKeys.pages.byBook(bookId), (old: Page[] = []) =>
            old.map(page =>
              page.id === payload.new.id ? {
                ...payload.new,
                content: payload.new.content as Page['content']
              } as Page : page
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'pages',
          filter: `book_id=eq.${bookId}`
        },
        (payload) => {
          console.log('Page deleted:', payload.old);
          queryClient.setQueryData(queryKeys.pages.byBook(bookId), (old: Page[] = []) =>
            old.filter(page => page.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookId]);

  return {
    pages,
    loading: isLoading,
    error
  };
};