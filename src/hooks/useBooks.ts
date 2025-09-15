import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Book } from '@/types/book';
import { toast } from 'sonner';

export const useBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['books', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching books:', error);
        toast.error('Failed to load books');
        throw error;
      }

      return data || [];
    },
    enabled: !!user?.id,
  });

  // Set initial data when query succeeds
  useEffect(() => {
    if (data) {
      setBooks(data);
    }
  }, [data]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Book inserted:', payload.new);
          setBooks(current => [payload.new as Book, ...current]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Book updated:', payload.new);
          const updatedBook = payload.new as Book;
          setBooks(current => {
            // If book is archived, remove it from the list
            if (updatedBook.status === 'archived') {
              return current.filter(book => book.id !== updatedBook.id);
            }
            // Otherwise update it normally
            return current.map(book =>
              book.id === updatedBook.id ? updatedBook : book
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'books',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Book deleted:', payload.old);
          setBooks(current =>
            current.filter(book => book.id !== payload.old.id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    books,
    loading: isLoading,
    error
  };
};