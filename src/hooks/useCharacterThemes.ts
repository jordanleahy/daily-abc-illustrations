import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CharacterTheme {
  id: string;
  display_name: string;
  thumbnail_url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
  is_special: boolean;
  created_at: string;
  updated_at: string;
}

export type CharacterThemeInsert = Omit<CharacterTheme, 'created_at' | 'updated_at'>;
export type CharacterThemeUpdate = Partial<Omit<CharacterTheme, 'created_at' | 'updated_at'>> & { id: string };

const QUERY_KEY = ['character-themes'];

export function useCharacterThemes(includeInactive = false) {
  return useQuery({
    queryKey: [...QUERY_KEY, { includeInactive }],
    queryFn: async (): Promise<CharacterTheme[]> => {
      let query = supabase
        .from('character_themes')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCharacterThemeMutations() {
  const queryClient = useQueryClient();

  const createTheme = useMutation({
    mutationFn: async (theme: CharacterThemeInsert) => {
      const { data, error } = await supabase
        .from('character_themes')
        .insert(theme)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Character theme created');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create theme');
    },
  });

  const updateTheme = useMutation({
    mutationFn: async ({ id, ...updates }: CharacterThemeUpdate) => {
      const { data, error } = await supabase
        .from('character_themes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Character theme updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update theme');
    },
  });

  const deleteTheme = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('character_themes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Character theme deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete theme');
    },
  });

  return {
    createTheme: createTheme.mutate,
    updateTheme: updateTheme.mutate,
    deleteTheme: deleteTheme.mutate,
    isCreating: createTheme.isPending,
    isUpdating: updateTheme.isPending,
    isDeleting: deleteTheme.isPending,
  };
}
