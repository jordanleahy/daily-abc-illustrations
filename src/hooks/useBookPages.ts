import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Page } from '@/types/book';
import { toast } from 'sonner';

export const useBookPages = (bookId: string | undefined) => {
  const [pages, setPages] = useState<Page[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['book-pages', bookId],
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
        content: page.content as {
          mainConcept: string;
          funFact: string;
          activity: string;
        }
      }));
    },
    enabled: !!bookId,
  });

  // Set initial data when query succeeds
  useEffect(() => {
    if (data) {
      setPages(data);
    }
  }, [data]);

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
          setPages(current => {
            const newPage = {
              ...payload.new,
              content: payload.new.content as {
                mainConcept: string;
                funFact: string;
                activity: string;
              }
            } as Page;
            // Insert in correct order by page_number
            const newPages = [...current, newPage].sort((a, b) => a.page_number - b.page_number);
            return newPages;
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
          setPages(current =>
            current.map(page =>
              page.id === payload.new.id ? {
                ...payload.new,
                content: payload.new.content as {
                  mainConcept: string;
                  funFact: string;
                  activity: string;
                }
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
          setPages(current =>
            current.filter(page => page.id !== payload.old.id)
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