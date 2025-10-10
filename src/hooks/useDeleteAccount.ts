import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      // Don't call signOut() - the user no longer exists!
      // Instead, manually clear the session
      await supabase.auth.signOut({ scope: 'local' }); // Only clears local storage, no API call
      
      // Force complete page reload to clear all app state
      window.location.replace('/'); // Use replace() to prevent back button
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
