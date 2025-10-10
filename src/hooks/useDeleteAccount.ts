import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { performAccountCleanup, forceApplicationReset } from '@/utils/accountCleanup';

export const useDeleteAccount = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        method: 'POST',
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to delete account');

      return data;
    },
    onSuccess: async () => {
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Perform comprehensive cleanup of all user-specific data
      await performAccountCleanup();
      
      // Force complete page reload to clear all app state
      forceApplicationReset();
    },
    onError: (error: Error) => {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete your account. Please try again or contact support.",
        variant: "destructive",
      });
    },
  });
};
