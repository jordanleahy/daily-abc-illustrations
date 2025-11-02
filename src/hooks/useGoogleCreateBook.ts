import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PageDetail {
  pageNumber: number;
  title: string;
  description: string;
}

interface CreateBookParams {
  conversationHistory: Message[];
  pageDetails?: PageDetail[];
  qaImages?: Record<number, string>;
  bookType?: string;
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
    mutationFn: async ({ conversationHistory, pageDetails, qaImages, bookType }: CreateBookParams): Promise<CreateBookResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-create-book', {
        body: {
          conversationHistory,
          userId: user.id,
          pageDetails: pageDetails || undefined,
          qaImages: qaImages || undefined,
          bookType: bookType || undefined,
        },
      });

      if (error) {
        console.error('Error creating book:', error);
        // Check for specific error types
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402') || error.message?.includes('Payment required')) {
          throw new Error('AI credits required. Please add credits to continue.');
        }
        throw new Error(error.message || 'Failed to create book');
      }

      // Check for error in response data
      if (data?.error) {
        if (data.error.includes('Rate limit') || data.error.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        } else if (data.error.includes('Payment required') || data.error.includes('402')) {
          throw new Error('AI credits required. Please add credits to continue.');
        }
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create book');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'Book created successfully!');
        queryClient.invalidateQueries({ queryKey: ['books'] });
      }
    },
    onError: (error) => {
      console.error('Create book error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create book');
    },
  });
};
