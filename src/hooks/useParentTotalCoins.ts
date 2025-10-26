import { useKidProfiles } from './useKidProfiles';

/**
 * Calculate total earned coins across all kid profiles for the authenticated parent
 * Leverages existing useKidProfiles hook with realtime subscription
 */
export const useParentTotalCoins = () => {
  const { data: kidProfiles, isLoading } = useKidProfiles();
  
  const totalCoins = kidProfiles?.reduce((sum, kid) => sum + (kid.earned_coins || 0), 0) || 0;
  
  return {
    totalCoins,
    isLoading
  };
};
