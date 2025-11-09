import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAppendPublishDate } from '@/utils/publishQueue';

interface SchedulePublicationParams {
  bookId: string;
  title: string;
  description?: string;
}

export const useScheduleBookPublication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId, title, description }: SchedulePublicationParams) => {
      // Check if book is already scheduled
      const { data: existing, error: checkError } = await supabase
        .from('daily_published')
        .select('id, status')
        .eq('book_id', bookId)
        .in('status', ['queued', 'active'])
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        throw new Error('This book is already scheduled for publication');
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

      if (error) throw error;

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
      queryClient.invalidateQueries({ queryKey: ['daily-published-schedule'] });
    },
    onError: (error) => {
      console.error('Error scheduling book:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to schedule book');
    },
  });
};
