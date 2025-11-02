import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TextOverlayConfig } from '@/types/textOverlay';
import { DEFAULT_TEXT_OVERLAY_CONFIG } from '@/types/textOverlay';

/**
 * Hook to manage user's default text overlay configuration
 */
export const useUserTextOverlayDefaults = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch user's default config
  const { data: userDefaults, isLoading } = useQuery({
    queryKey: ['user-text-overlay-defaults', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('user_text_overlay_defaults')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Get effective defaults (user's custom or system defaults)
  const effectiveDefaults: TextOverlayConfig = {
    ...DEFAULT_TEXT_OVERLAY_CONFIG,
    ...(userDefaults?.config as Partial<TextOverlayConfig> || {}),
  };

  // Save defaults
  const saveDefaults = useMutation({
    mutationFn: async (config: TextOverlayConfig) => {
      if (!userId) throw new Error('User ID required');

      // Remove text field from saved defaults (text is instance-specific)
      const { text, ...configWithoutText } = config;

      const { data, error } = await supabase
        .from('user_text_overlay_defaults')
        .upsert({
          user_id: userId,
          config: configWithoutText,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-text-overlay-defaults', userId] });
      toast.success('Default text overlay settings saved!');
    },
    onError: (error: any) => {
      console.error('Error saving default text overlay:', error);
      toast.error('Failed to save defaults');
    },
  });

  // Reset to system defaults
  const resetDefaults = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User ID required');

      const { error } = await supabase
        .from('user_text_overlay_defaults')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-text-overlay-defaults', userId] });
      toast.success('Reset to system defaults');
    },
    onError: (error: any) => {
      console.error('Error resetting defaults:', error);
      toast.error('Failed to reset defaults');
    },
  });

  return {
    effectiveDefaults,
    hasCustomDefaults: !!userDefaults,
    isLoading,
    saveDefaults: saveDefaults.mutate,
    resetDefaults: resetDefaults.mutate,
    isSaving: saveDefaults.isPending,
  };
};
