import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from './use-toast';

interface CreateKidProfileData {
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  profile_image_url?: string;
}

interface UpdateKidProfileData {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string | null;
  profile_image_url?: string;
}

export const useCreateKidProfile = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (kidData: CreateKidProfileData) => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('kid_profiles')
        .insert({
          parent_user_id: user.id,
          first_name: kidData.first_name,
          last_name: kidData.last_name,
          date_of_birth: kidData.date_of_birth,
          profile_image_url: kidData.profile_image_url,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Kid profile created",
        description: "The kid profile has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useUpdateKidProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (kidData: UpdateKidProfileData) => {
      const { data, error } = await supabase
        .from('kid_profiles')
        .update({
          first_name: kidData.first_name,
          last_name: kidData.last_name,
          date_of_birth: kidData.date_of_birth,
          profile_image_url: kidData.profile_image_url,
        })
        .eq('id', kidData.id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Kid profile updated",
        description: "The kid profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};

export const useDeleteKidProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (kidId: string) => {
      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from('kid_profiles')
        .update({ is_active: false })
        .eq('id', kidId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Kid profile removed",
        description: "The kid profile has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Removal failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
};