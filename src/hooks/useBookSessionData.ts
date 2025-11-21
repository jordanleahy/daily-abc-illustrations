import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to fetch session data (qa_page_prompts, qa_page_images) for a book
 * Queries gemini_chat_sessions via books.chat_session_id
 */
export const useBookSessionData = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ['book-session-data', bookId],
    queryFn: async () => {
      if (!bookId) return null;

      // First get the chat_session_id from books table
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('chat_session_id')
        .eq('id', bookId)
        .single();

      if (bookError || !book?.chat_session_id) {
        console.error('Error fetching book session:', bookError);
        return null;
      }

      // Then fetch the session with qa_page_prompts and qa_page_images
      const { data: session, error: sessionError } = await supabase
        .from('gemini_chat_sessions')
        .select('id, qa_page_prompts, qa_page_images')
        .eq('id', book.chat_session_id)
        .single();

      if (sessionError) {
        console.error('Error fetching session data:', sessionError);
        return null;
      }

      return {
        sessionId: session.id,
        qa_page_prompts: session.qa_page_prompts || {},
        qa_page_images: session.qa_page_images || {},
      };
    },
    enabled: !!bookId,
  });
};
