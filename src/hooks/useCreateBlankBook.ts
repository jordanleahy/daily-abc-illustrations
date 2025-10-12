import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateBlankBookParams {
  bookName: string;
  category?: string;
}

interface CreateBlankBookResponse {
  success: boolean;
  bookId?: string;
  message?: string;
  error?: string;
}

export const useCreateBlankBook = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookName, category }: CreateBlankBookParams): Promise<CreateBlankBookResponse> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('create-blank-book', {
        body: {
          bookName,
          category: category || 'General',
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error creating blank book:', error);
        throw new Error(error.message || 'Failed to create book template');
      }

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || 'Book template created successfully!');
        // Invalidate books query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['books'] });
      } else {
        toast.error(data.error || 'Failed to create book template');
      }
    },
    onError: (error) => {
      console.error('Create blank book error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create book template');
    },
  });
};