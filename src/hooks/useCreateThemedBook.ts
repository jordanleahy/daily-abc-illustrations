import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateThemedBookParams {
  theme: string;
}

interface CreateThemedBookResponse {
  success: boolean;
  bookId?: string;
  message?: string;
  error?: string;
}

export const useCreateThemedBook = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ theme }: CreateThemedBookParams): Promise<CreateThemedBookResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-themed-book', {
        body: {
          theme,
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error creating themed book:', error);
        throw new Error(error.message || 'Failed to create themed book');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'Themed book created successfully!');
        queryClient.invalidateQueries({ queryKey: ['books'] });
      } else {
        toast.error(data.error || 'Failed to create themed book');
      }
    },
    onError: (error) => {
      console.error('Create themed book error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create themed book');
    },
  });
};
