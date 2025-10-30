import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CreateBookParams {
  conversationHistory: Message[];
}

interface CreateBookResponse {
  success: boolean;
  bookId?: string;
  message?: string;
  error?: string;
}

export const useGoogleCreateBook = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationHistory }: CreateBookParams): Promise<CreateBookResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-create-book', {
        body: {
          conversationHistory,
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error creating book with Google:', error);
        throw new Error(error.message || 'Failed to create book');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'Book created successfully with Google Gemini!');
        queryClient.invalidateQueries({ queryKey: ['books'] });
      } else {
        toast.error(data.error || 'Failed to create book');
      }
    },
    onError: (error) => {
      console.error('Create book error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create book');
    },
  });
};
