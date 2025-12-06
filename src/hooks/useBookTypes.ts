import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BOOK_TYPES } from '@/config/bookTypes';

export interface DatabaseBookType {
  id: string;
  label: string;
  description: string | null;
  prompt: string | null;
  icon_name: string;
  color: string | null;
  expected_page_count: number | null;
  needs_clarification: boolean;
  clarification_context: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useBookTypes() {
  return useQuery({
    queryKey: ['book-types'],
    queryFn: async (): Promise<DatabaseBookType[]> => {
      const { data, error } = await supabase
        .from('book_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data || [];
    },
    // Use hardcoded types as placeholder for instant display
    placeholderData: BOOK_TYPES.map((bt, index) => ({
      id: bt.id,
      label: bt.label,
      description: bt.description,
      prompt: bt.prompt,
      icon_name: bt.icon?.displayName || 'Package',
      color: bt.color,
      expected_page_count: bt.expectedPageCount || null,
      needs_clarification: bt.needsClarification || false,
      clarification_context: bt.clarificationContext || null,
      sort_order: index,
      is_active: true,
    })),
    staleTime: 5 * 60 * 1000, // 5-minute cache
  });
}
