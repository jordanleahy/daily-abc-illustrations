import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface KidProfile {
  id: string;
  parent_user_id: string;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  is_active: boolean;
  earned_coins: number;
  created_at: string;
  updated_at: string;
}

export const useKidProfiles = () => {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['kid-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('kid_profiles')
        .select('*')
        .eq('parent_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      return data as KidProfile[];
    },
    enabled: !!user?.id,
  });
};