import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface HabitCreationResult {
  success: boolean;
  message?: string;
  timestamp?: string;
  results?: {
    success: boolean;
    date?: string;
    timestamp?: string;
    completions_created: number;
    total_coins_deposited: number;
  };
  error?: string;
}

export function useTestHabitCreation() {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<HabitCreationResult>(
        'test-habit-creation'
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.results?.success) {
        const { completions_created, total_coins_deposited } = data.results;
        
        if (completions_created > 0) {
          toast({
            title: "✨ Success!",
            description: `Created ${completions_created} habit completion(s) and deposited ${total_coins_deposited} coins!`,
          });
        } else {
          toast({
            title: "ℹ️ Info",
            description: "Habits already created for today (0 new completions)",
          });
        }

        // Invalidate queries to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['today-habits', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['kid-profiles', user?.id] });
      } else {
        toast({
          title: "❌ Error",
          description: data?.error || "Failed to create habits",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error('Test habit creation error:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to create habits",
        variant: "destructive",
      });
    },
  });

  return {
    testCreateHabits: mutation.mutate,
    isPending: mutation.isPending,
  };
}
