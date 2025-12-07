import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { SafeLocalStorage } from '@/utils/storage';

type AppRole = 'user' | 'teacher' | 'moderator' | 'admin';

const ROLE_CACHE_KEY = 'user_roles_cache';
const ROLE_CACHE_DAYS = 90;

export const useUserRole = () => {
  const { user } = useAuthContext();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [roleData, setRoleData] = useState<{
    roles: AppRole[];
    primaryRole: AppRole;
    isAdmin: boolean;
    isModerator: boolean;
    isTeacher: boolean;
    isUser: boolean;
  } | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');
      
      // Check cache first
      const cached = SafeLocalStorage.get<{
        userId: string;
        data: {
          roles: AppRole[];
          primaryRole: AppRole;
          isAdmin: boolean;
          isModerator: boolean;
          isTeacher: boolean;
          isUser: boolean;
        };
      }>(ROLE_CACHE_KEY);
      
      if (cached && cached.userId === user.id) {
        return cached.data;
      }
      
      // Fetch from database
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .order('role', { ascending: true }); // admin comes first alphabetically
        
      if (error) throw error;
      
      // Return all roles and primary role
      const roles = data.map(r => r.role as AppRole);
      const primaryRole = roles.includes('admin') ? 'admin' as AppRole : 
                         roles.includes('moderator') ? 'moderator' as AppRole :
                         roles.includes('teacher') ? 'teacher' as AppRole : 'user' as AppRole;
      
      const roleData = {
        roles,
        primaryRole,
        isAdmin: roles.includes('admin'),
        isModerator: roles.includes('moderator'),
        isTeacher: roles.includes('teacher'),
        isUser: roles.includes('user')
      };
      
      // Cache for 90 days
      SafeLocalStorage.set(ROLE_CACHE_KEY, {
        userId: user.id,
        data: roleData
      }, ROLE_CACHE_DAYS * 24);
      
      return roleData;
    },
    enabled: !!user?.id,
    staleTime: 90 * 24 * 60 * 60 * 1000, // 90 days - serve cache immediately
    gcTime: 90 * 24 * 60 * 60 * 1000,    // Keep in memory for 90 days
    refetchOnMount: false,                 // Don't refetch on every mount
    refetchOnWindowFocus: false,           // Don't refetch on tab focus
    refetchOnReconnect: false,             // Don't refetch on reconnect
  });

  // Set initial data when query succeeds
  useEffect(() => {
    if (data) {
      setRoles(data.roles);
      setRoleData(data);
    }
  }, [data]);

  // Set up real-time subscription for user roles
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-roles-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User role inserted:', payload.new);
          setRoles(current => {
            const newRole = payload.new.role as AppRole;
            if (!current.includes(newRole)) {
              const updatedRoles = [...current, newRole];
              const primaryRole = updatedRoles.includes('admin') ? 'admin' as AppRole : 
                               updatedRoles.includes('moderator') ? 'moderator' as AppRole :
                               updatedRoles.includes('teacher') ? 'teacher' as AppRole : 'user' as AppRole;
              
              const newRoleData = {
                roles: updatedRoles,
                primaryRole,
                isAdmin: updatedRoles.includes('admin'),
                isModerator: updatedRoles.includes('moderator'),
                isTeacher: updatedRoles.includes('teacher'),
                isUser: updatedRoles.includes('user')
              };
              setRoleData(newRoleData);
              return updatedRoles;
            }
            return current;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('User role deleted:', payload.old);
          setRoles(current => {
            const deletedRole = payload.old.role as AppRole;
            const updatedRoles = current.filter(role => role !== deletedRole);
            const primaryRole = updatedRoles.includes('admin') ? 'admin' as AppRole : 
                             updatedRoles.includes('moderator') ? 'moderator' as AppRole :
                             updatedRoles.includes('teacher') ? 'teacher' as AppRole : 'user' as AppRole;
            
            const newRoleData = {
              roles: updatedRoles,
              primaryRole,
              isAdmin: updatedRoles.includes('admin'),
              isModerator: updatedRoles.includes('moderator'),
              isTeacher: updatedRoles.includes('teacher'),
              isUser: updatedRoles.includes('user')
            };
            setRoleData(newRoleData);
            return updatedRoles;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    data: roleData,
    isLoading,
    error
  };
};