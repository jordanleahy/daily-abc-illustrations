import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export const useLastFinishedBook = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['last-finished-book', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_book_activity')
        .select('book_id')
        .eq('user_id', user.id)
        .eq('reading_completed', true)
        .order('last_reading_session_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.book_id ?? null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
};
