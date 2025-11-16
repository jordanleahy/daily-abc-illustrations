import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
// Toast notifications removed

interface UpdateProfileData {
  first_name: string;
  last_name: string;
}

export const useUpdateProfile = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: UpdateProfileData) => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      console.log("Your profile has been updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      console.error(error.message);
    }
  });
};