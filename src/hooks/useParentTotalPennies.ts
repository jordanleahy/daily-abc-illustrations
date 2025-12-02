import { useKidProfiles } from './useKidProfiles';

/**
 * Calculate total earned pennies across all kid profiles for the authenticated parent
 * Leverages existing useKidProfiles hook with realtime subscription
 */
export const useParentTotalPennies = () => {
  const { data: kidProfiles, isLoading } = useKidProfiles();
  
  const totalPennies = kidProfiles?.reduce((sum, kid) => sum + (kid.earned_coins || 0), 0) || 0;
  
  return {
    totalPennies,
    isLoading
  };
};

/**
 * @deprecated Use useParentTotalPennies instead
 */
export const useParentTotalCoins = useParentTotalPennies;
