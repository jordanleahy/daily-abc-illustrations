import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

export const useDeleteAccount = () => {
  const { toast } = useToast();
  const { signOut } = useAuthContext();

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

      // Sign out the user
      await signOut();
      
      // Redirect to landing page
      window.location.href = '/';
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
