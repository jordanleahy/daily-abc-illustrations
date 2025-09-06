import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'user' | 'moderator' | 'admin';

export const useUserRole = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true }); // admin comes first alphabetically
        
      if (error) throw error;
      
      // Return all roles and primary role
      const roles = data.map(r => r.role as AppRole);
      const primaryRole = roles.includes('admin') ? 'admin' : 
                         roles.includes('moderator') ? 'moderator' : 'user';
      
      return {
        roles,
        primaryRole,
        isAdmin: roles.includes('admin'),
        isModerator: roles.includes('moderator'),
        isUser: roles.includes('user')
      };
    },
    enabled: !!user?.id,
  });
};

export const useHasRole = (role: AppRole) => {
  const { data: userRole } = useUserRole();
  return userRole?.roles.includes(role) ?? false;
};