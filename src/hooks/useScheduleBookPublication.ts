import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAppendPublishDate } from '@/utils/publishQueue';

interface SchedulePublicationParams {
  bookId: string;
  title: string;
  description?: string;
}

// Helper to get book cover image URL
const getBookCoverUrl = async (bookId: string): Promise<string | null> => {
  const { data } = await supabase
    .from('page_image_urls')
    .select('image_url, pages!inner(page_type)')
    .eq('book_id', bookId)
    .eq('is_latest', true)
    .eq('pages.page_type', 'cover')
    .maybeSingle();
  
  return data?.image_url || null;
};

// Helper to generate OG image for a daily published entry
const generateOgImage = async (
  coverImageUrl: string,
  bookId: string,
  dailyPublishedId: string
): Promise<void> => {
  try {
    console.log('Generating OG image for book:', bookId);
    
    const { data, error } = await supabase.functions.invoke('generate-og-image', {
      body: {
        coverImageUrl,
        bookId,
        dailyPublishedId,
      }
    });

    if (error) {
      console.error('OG image generation failed:', error);
      return;
    }

    if (data?.success) {
      console.log('OG image generated successfully:', data.ogImageUrl);
    } else {
      console.error('OG image generation returned error:', data?.error);
    }
  } catch (err) {
    console.error('Error calling generate-og-image:', err);
  }
};

export const useScheduleBookPublication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, title, description }: SchedulePublicationParams) => {
      // Check if book is already scheduled (queued or active)
      const { data: existing, error: checkError } = await supabase
        .from('daily_published')
        .select('id, status, publish_date')
        .eq('book_id', bookId)
        .in('status', ['queued', 'active'])
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        if (existing.status === 'active') {
          throw new Error('This book is currently the active daily publication');
        }
        if (existing.status === 'queued') {
          const date = new Date(existing.publish_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          });
          throw new Error(`This book is already scheduled for ${date}`);
        }
      }

      // Get next available publish date using FIFO logic
      const publishDate = await getAppendPublishDate(supabase);

      // Create queued entry
      const { data, error } = await supabase
        .from('daily_published')
        .insert({
          book_id: bookId,
          title,
          description,
          status: 'queued',
          is_active: false,
          publish_date: publishDate,
        })
        .select()
        .single();

      if (error) {
        // Handle unique constraint violation gracefully
        if (error.code === '23505' && error.message.includes('daily_published_unique_queued_book')) {
          throw new Error('This book is already scheduled. Please refresh the page.');
        }
        throw error;
      }

      // Mark the book as a library book so it appears in the Library view
      const { error: bookUpdateError } = await supabase
        .from('books')
        .update({ 
          is_library_book: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookId);

      if (bookUpdateError) {
        console.error('Failed to mark book as library book:', bookUpdateError);
      }

      // Auto-generate OG image for social media thumbnails (fire and forget)
      const coverUrl = await getBookCoverUrl(bookId);
      if (coverUrl && data) {
        // Don't await - let it run in background
        generateOgImage(coverUrl, bookId, data.id);
      }

      return { ...data, publish_date: publishDate };
    },
    onSuccess: (data) => {
      toast.success('Book scheduled for publication', {
        description: `Will publish on ${new Date(data.publish_date).toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })}`,
      });
      queryClient.invalidateQueries({ queryKey: ['book'] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book-publication-status'] });
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
    },
    onError: (error) => {
      console.error('Error scheduling book:', error);
      toast.error(error instanceof Error ? error.message : 'Need more images');
    },
  });
};
