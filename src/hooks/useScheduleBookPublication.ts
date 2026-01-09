import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getPlaceholderPublishDate } from '@/utils/queueDateUtils';

interface SchedulePublicationParams {
  bookId: string;
  title: string;
  description?: string;
}


// Helper to generate SEO metadata (which also triggers OG image generation)
const generateSeoMetadata = async (
  bookId: string,
  dailyPublishedId: string,
  title: string,
  description?: string
): Promise<void> => {
  try {
    console.log('Generating SEO metadata for book:', bookId);
    
    const { error } = await supabase.functions.invoke('generate-seo-metadata', {
      body: {
        bookId,
        dailyPublishedId,
        contentTitle: title,
        bookDescription: description,
      }
    });

    if (error) {
      console.error('SEO metadata generation failed:', error);
    } else {
      console.log('SEO metadata generated successfully for book:', bookId);
    }
  } catch (err) {
    console.error('Error calling generate-seo-metadata:', err);
  }
};

// Helper to generate blog post for the book
const generateBlogPost = async (
  bookId: string,
  title: string,
  description?: string
): Promise<void> => {
  try {
    console.log('Generating blog post for book:', bookId);
    
    const { error } = await supabase.functions.invoke('generate-blog-post-for-book', {
      body: {
        bookId,
        title,
        description,
      }
    });

    if (error) {
      console.error('Blog post generation failed:', error);
    } else {
      console.log('Blog post generated successfully for book:', bookId);
    }
  } catch (err) {
    console.error('Error calling generate-blog-post-for-book:', err);
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

      // Use placeholder date - actual publish date is set on activation
      const placeholderDate = getPlaceholderPublishDate();

      // Create queued entry (ordered by created_at for FIFO)
      const { data, error } = await supabase
        .from('daily_published')
        .insert({
          book_id: bookId,
          title,
          description,
          status: 'queued',
          is_active: false,
          publish_date: placeholderDate, // Placeholder - updated on activation
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

      // Auto-generate SEO metadata and blog post (fire and forget)
      if (data) {
        // Don't await - let them run in background
        generateSeoMetadata(bookId, data.id, title, description);
        generateBlogPost(bookId, title, description);
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Book added to publication queue', {
        description: 'It will publish in order based on when it was added.',
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
