import { useMemo } from 'react';
import { useAccessResolver } from '@/hooks/useAccessResolver';

/**
 * Feature access control hook (Free Tier Model)
 * 
 * All authenticated users get full access to all features.
 */
export const useFeatureAccess = () => {
  const { isReady, isUnlocked, isPrivileged } = useAccessResolver();
  
  /**
   * All authenticated users have access to Habits & Rewards
   */
  const hasHabitsRewards = useMemo(() => {
    return isUnlocked;
  }, [isUnlocked]);
  
  /**
   * All authenticated users have library access
   */
  const hasLibraryAccess = useMemo(() => {
    return isUnlocked;
  }, [isUnlocked]);
  
  return {
    hasHabitsRewards,
    hasLibraryAccess,
    loading: !isReady,
    currentTier: isUnlocked ? { name: 'Free', features: { library_access: true, habits_rewards: true } } : null,
    isPrivilegedUser: isPrivileged,
  };
};
