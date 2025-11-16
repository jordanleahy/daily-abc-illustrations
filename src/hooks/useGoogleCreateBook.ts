import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { parseEducationalFocus } from '@/utils/chatHelpers';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PageDetail {
  pageNumber: number;
  title: string;
  description: string;
}

export interface CreateBookParams {
  conversationHistory: Message[];
  pageDetails?: PageDetail[];
  bookType?: string;
  characterTheme?: string;
  textOverlayPreference?: 'with-text' | 'without-text';
  referenceBookId?: string;
  qaImages?: Record<string, string>;
  targetWords?: string[]; // Target words for vocabulary practice (from recommendations)
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
    mutationFn: async (params: CreateBookParams): Promise<CreateBookResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Parse educational focus from conversation
      const educationalFocus = parseEducationalFocus(params.conversationHistory);

      // Extract full prompts from conversation for storage
      const fullPrompts: Record<number, string> = {};
      const conversationText = params.conversationHistory
        .filter(m => m.role === 'assistant')
        .map(m => m.content)
        .join('\n');
      
      // Extract cover prompt
      const coverMatch = conversationText.match(/\*\*Cover:[^\n*]*\*\*\s*([\s\S]*?)(?=\n\*\*Educational Focus:|\n\*\*Page\s+\d+|$)/i);
      if (coverMatch) {
        fullPrompts[1] = coverMatch[0];
      }
      
      // Extract educational focus prompt
      const eduMatch = conversationText.match(/\*\*Educational Focus:[^\n*]*\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+|$)/i);
      if (eduMatch) {
        fullPrompts[2] = eduMatch[0];
      }
      
      // Extract numbered page prompts
      const pageMatches = conversationText.matchAll(/\*\*Page\s+(\d+):[^\n*]*\*\*\s*([\s\S]*?)(?=\n\*\*Page\s+\d+:|$)/gi);
      for (const match of pageMatches) {
        const pageNum = parseInt(match[1]) + 2; // +2 because cover=1, edu=2
        fullPrompts[pageNum] = match[0];
      }

      const { data, error } = await supabase.functions.invoke('google-create-book', {
        body: {
          conversationHistory: params.conversationHistory,
          userId: user.id,
          pageDetails: params.pageDetails || undefined,
          qaImages: params.qaImages || undefined,
          bookType: params.bookType || undefined,
          textOverlayPreference: params.textOverlayPreference || undefined,
          referenceBookId: params.referenceBookId || undefined,
          educationalFocus: educationalFocus || undefined,
          fullPrompts: fullPrompts,
          targetWords: params.targetWords || undefined,
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
        console.log('Book created successfully!', data.message);
        queryClient.invalidateQueries({ queryKey: ['books'] });
      }
    },
    onError: (error) => {
      console.error('Create book error:', error);
    },
  });
};
