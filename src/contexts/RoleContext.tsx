import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

type AppRole = 'user' | 'teacher' | 'moderator' | 'admin';

interface RoleContextValue {
  roles: AppRole[];
  primaryRole: AppRole;
  isAdmin: boolean;
  isModerator: boolean;
  isTeacher: boolean;
  isUser: boolean;
  isLoading: boolean;
  error: Error | null;
  hasRole: (role: AppRole) => boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider = ({ children }: RoleProviderProps) => {
  const { data, isLoading, error } = useUserRole();

  const contextValue = useMemo<RoleContextValue>(() => {
    const defaultRoleData = {
      roles: ['user'] as AppRole[],
      primaryRole: 'user' as AppRole,
      isAdmin: false,
      isModerator: false,
      isTeacher: false,
      isUser: true,
    };

    const roleData = data || defaultRoleData;

    return {
      ...roleData,
      isLoading,
      error: error as Error | null,
      hasRole: (role: AppRole) => roleData.roles.includes(role),
    };
  }, [data, isLoading, error]);

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Convenience hooks for common role checks (memoized)
export const useIsAdmin = () => {
  const { isAdmin } = useRole();
  return isAdmin;
};

export const useIsModerator = () => {
  const { isModerator } = useRole();
  return isModerator;
};

export const useIsTeacher = () => {
  const { isTeacher } = useRole();
  return isTeacher;
};

export const useIsUser = () => {
  const { isUser } = useRole();
  return isUser;
};

export const useHasRole = (role: AppRole) => {
  const { hasRole } = useRole();
  return useMemo(() => hasRole(role), [hasRole, role]);
};