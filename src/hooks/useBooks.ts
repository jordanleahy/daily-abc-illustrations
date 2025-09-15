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
      
      // First, get all books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (booksError) {
        console.error('Error fetching books:', booksError);
        toast.error('Failed to load books');
        throw booksError;
      }

      if (!booksData || booksData.length === 0) {
        return [];
      }

      // Get the first image for each book
      const bookIds = booksData.map(book => book.id);
      const { data: imagesData, error: imagesError } = await supabase
        .from('page_image_urls')
        .select('book_id, image_url, created_at')
        .in('book_id', bookIds)
        .not('image_url', 'is', null)
        .eq('generation_status', 'complete')
        .order('book_id')
        .order('created_at', { ascending: true });

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
        // Don't throw error here, just continue without images
      }

      // Create a map of book_id to first image URL
      const bookImageMap = new Map<string, string>();
      if (imagesData) {
        imagesData.forEach(image => {
          if (!bookImageMap.has(image.book_id)) {
            bookImageMap.set(image.book_id, image.image_url);
          }
        });
      }

      // Combine books with their first image URLs
      const processedBooks = booksData.map(book => ({
        ...book,
        firstPageImageUrl: bookImageMap.get(book.id) || undefined
      }));
      
      return processedBooks;
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