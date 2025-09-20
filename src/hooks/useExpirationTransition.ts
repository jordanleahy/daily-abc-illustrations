import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

interface UseExpirationTransitionProps {
  currentId?: string;
  expiresAt: string;
}

/**
 * Simplified hook for handling content expiration with fixed 11:12 PM UTC schedule
 */
export const useExpirationTransition = ({ currentId, expiresAt }: UseExpirationTransitionProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentId || !expiresAt) {
      setIsTransitioning(false);
      return;
    }

    const expiry = new Date(expiresAt);
    const now = new Date();

    // Simple check: if content is expired, navigate to home
    if (now > expiry && !isTransitioning) {
      setIsTransitioning(true);
      
      // Clear cached data and navigate
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000); // Brief delay for user feedback
    }
  }, [expiresAt, currentId, navigate, queryClient, isTransitioning]);

  return {
    isTransitioning
  };
};