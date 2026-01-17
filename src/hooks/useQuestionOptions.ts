import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SupportedTable = 'cities' | 'age_groups' | 'grade_levels' | 'character_themes';

interface AddOptionParams {
  tableName: SupportedTable;
  id: string;
  label: string;
  additionalFields?: Record<string, unknown>;
}

interface DeleteOptionParams {
  tableName: SupportedTable;
  id: string;
}

/**
 * Hook for adding a new option to a question's options table
 */
export function useAddQuestionOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableName, id, label, additionalFields = {} }: AddOptionParams) => {
      // Get max sort_order
      const { data: existing } = await supabase
        .from(tableName)
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

      // Build the insert object based on table type
      let insertData: Record<string, unknown> = {
        id,
        label,
        is_active: true,
        sort_order: nextSortOrder,
        ...additionalFields,
      };

      // Add table-specific required fields
      if (tableName === 'cities') {
        insertData = {
          ...insertData,
          emoji: additionalFields.emoji || '🏙️',
        };
      } else if (tableName === 'age_groups') {
        insertData = {
          ...insertData,
          min_age: additionalFields.min_age ?? 0,
          max_age: additionalFields.max_age ?? 12,
        };
      } else if (tableName === 'character_themes') {
        insertData = {
          ...insertData,
          display_name: label,
          thumbnail_url: additionalFields.thumbnail_url || '',
          alt_text: additionalFields.alt_text || label,
        };
      }

      // Use type assertion for dynamic table insert
      const { error } = await supabase
        .from(tableName)
        .insert(insertData as never);

      if (error) throw error;
    },
    onSuccess: (_, { tableName }) => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Option added successfully');
    },
    onError: (error) => {
      console.error('Error adding option:', error);
      toast.error('Failed to add option');
    },
  });
}

/**
 * Hook for deleting an option (sets is_active to false - soft delete)
 */
export function useDeleteQuestionOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tableName, id }: DeleteOptionParams) => {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      toast.success('Option removed');
    },
    onError: (error) => {
      console.error('Error deleting option:', error);
      toast.error('Failed to remove option');
    },
  });
}
