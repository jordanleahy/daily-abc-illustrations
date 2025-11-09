import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFavorites } from './useFavorites';
import { useLibraryBooks } from './useLibraryBooks';
import { DailyPublishedWithBook } from '@/types/dailyPublished';
import { Page } from '@/types/book';

/**
 * Predictive prefetch hook that anticipates which books users will view next
 * Based on viewing history, favorites, and current context
 */
export function usePredictivePrefetch(currentBookId?: string) {
  const queryClient = useQueryClient();
  const { favorites, favoriteIds } = useFavorites();
  const { data: libraryBooks = [] } = useLibraryBooks();

  // Calculate the top 3 most likely books the user will view next
  const predictedBooks = useMemo(() => {
    if (!libraryBooks || libraryBooks.length === 0) return [];

    // Score each book based on multiple signals
    const scoredBooks = libraryBooks
      .filter(book => book.id !== currentBookId) // Exclude current book
      .map(book => {
        let score = 0;

        // Signal 1: Favorited books (highest priority)
        if (favoriteIds.has(book.id)) {
          score += 100;
          
          // Boost if recently favorited (within last 7 days)
          const favorite = favorites.find(f => f.daily_published_id === book.id);
          if (favorite) {
            const daysSinceFavorited = (Date.now() - new Date(favorite.created_at).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceFavorited < 7) {
              score += 50;
            }
          }
        }

        // Signal 2: Recently viewed (strong signal)
        if (book.last_viewed_at) {
          const hoursSinceView = (Date.now() - new Date(book.last_viewed_at).getTime()) / (1000 * 60 * 60);
          
          // Recently viewed books get high scores, decaying over time
          if (hoursSinceView < 24) {
            score += 80; // Viewed in last 24 hours
          } else if (hoursSinceView < 72) {
            score += 50; // Viewed in last 3 days
          } else if (hoursSinceView < 168) {
            score += 30; // Viewed in last week
          } else if (hoursSinceView < 720) {
            score += 10; // Viewed in last month
          }
        }

        // Signal 3: View count (engagement signal)
        if (book.view_count > 0) {
          score += Math.min(book.view_count * 2, 40); // Cap at 40 points
        }

        // Signal 4: Recency of publication (users like new content)
        if (book.book?.created_at) {
          const daysSinceCreated = (Date.now() - new Date(book.book.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceCreated < 7) {
            score += 25; // Published in last week
          } else if (daysSinceCreated < 30) {
            score += 10; // Published in last month
          }
        }

        // Signal 5: Currently active daily published (users gravitate to active content)
        if (book.status === 'active') {
          score += 30;
        }

        return {
          book,
          score
        };
      })
      .sort((a, b) => b.score - a.score) // Highest score first
      .slice(0, 3) // Top 3 predictions
      .map(item => item.book);

    console.log('[PredictivePrefetch] Top 3 predicted books:', 
      predictedBooks.map(b => ({ 
        title: b.seo_title || b.title, 
        isFavorite: favoriteIds.has(b.id),
        lastViewed: b.last_viewed_at,
        viewCount: b.view_count
      }))
    );

    return predictedBooks;
  }, [libraryBooks, currentBookId, favoriteIds, favorites]);

  // Background prefetch the predicted books
  useEffect(() => {
    if (predictedBooks.length === 0) return;

    // Use a small delay to avoid prefetching during initial page load
    const prefetchTimer = setTimeout(() => {
      predictedBooks.forEach((book, index) => {
        // Stagger prefetches slightly to avoid overwhelming the network
        setTimeout(() => {
          prefetchBook(book);
        }, index * 100); // 100ms delay between each prefetch
      });
    }, 1000); // Start prefetching after 1 second of idle time

    return () => clearTimeout(prefetchTimer);
  }, [predictedBooks]);

  const prefetchBook = async (book: DailyPublishedWithBook) => {
    try {
      console.log('[PredictivePrefetch] Prefetching:', book.seo_title || book.title);

      // Prefetch library book metadata
      await queryClient.prefetchQuery({
        queryKey: ['library-book', book.id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('daily_published')
            .select(`
              *,
              book:books(
                total_pages
              )
            `)
            .eq('id', book.id)
            .maybeSingle();

          if (error) throw error;
          return data;
        },
        staleTime: 60 * 60 * 1000,
      });

      // Prefetch pages data
      if (book.book_id) {
        await queryClient.prefetchQuery({
          queryKey: ['daily-published-pages', book.book_id],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('pages')
              .select('*')
              .eq('book_id', book.book_id)
              .order('page_number', { ascending: true });

            if (error) throw error;
            return data as Page[] || [];
          },
          staleTime: 60 * 60 * 1000,
        });
      }

      // Prefetch SEO metadata
      await queryClient.prefetchQuery({
        queryKey: ['seo-metadata', book.id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('seo_metadata')
            .select('*')
            .eq('daily_published_id', book.id)
            .eq('is_latest', true)
            .eq('is_active', true)
            .eq('optimization_status', 'complete')
            .maybeSingle();

          if (error) return null;
          return data;
        },
        staleTime: 60 * 60 * 1000,
      });

      console.log('[PredictivePrefetch] ✅ Prefetched:', book.seo_title || book.title);
    } catch (error) {
      console.error('[PredictivePrefetch] Error prefetching book:', error);
    }
  };

  return {
    predictedBooks,
  };
}
