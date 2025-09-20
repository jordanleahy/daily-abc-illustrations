import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveDailyPublished } from './useActiveDailyPublished';
import { supabase } from '@/integrations/supabase/client';

interface UseExpirationTransitionProps {
  currentId?: string;
  expiresAt: string;
}

/**
 * Hook to handle smooth transitions when daily content is about to expire
 * Pre-loads next content and provides seamless switching
 */
export const useExpirationTransition = ({ currentId, expiresAt }: UseExpirationTransitionProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isNearExpiry, setIsNearExpiry] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextContentId, setNextContentId] = useState<string | null>(null);
  
  // Poll for new active content more frequently when near expiry
  const { data: activeContent, refetch: refetchActive } = useActiveDailyPublished();

  const checkExpiryStatus = useCallback(() => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const timeDiff = expiry.getTime() - now.getTime();
    
    // For fixed schedule, consider "near expiry" as within 5 minutes of 11:12 PM UTC
    const nearExpiryThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isCurrentlyNearExpiry = timeDiff <= nearExpiryThreshold && timeDiff > 0;
    
    setIsNearExpiry(isCurrentlyNearExpiry);
    
    // If expired (past 11:12 PM UTC), handle the transition
    if (timeDiff <= 0 && !isTransitioning) {
      handleExpiredContent();
    }
    
    return { timeUntilExpiry: timeDiff, nearExpiry: isCurrentlyNearExpiry };
  }, [expiresAt, isTransitioning]);

  // Handle expired content with smooth transition
  const handleExpiredContent = useCallback(async () => {
    if (isTransitioning) return;
    
    console.log('🔄 Content expired at fixed 11:12 PM UTC, initiating transition...');
    setIsTransitioning(true);
    
    try {
      // Force refresh of active content
      await refetchActive();
      
      // Invalidate all daily published queries to force fresh data
      queryClient.invalidateQueries({ queryKey: ['daily-published'] });
      queryClient.invalidateQueries({ queryKey: ['active-daily-published'] });
      
      // Wait a moment for the new content to be activated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for new active content
      const { data: newActive } = await supabase
        .from('daily_published')
        .select('id')
        .eq('status', 'active')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('queue_position', { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (newActive && newActive.id !== currentId) {
        console.log('✅ New content found, navigating...', newActive.id);
        setNextContentId(newActive.id);
        navigate(`/daily/${newActive.id}`, { replace: true });
      } else {
        console.log('📝 No new content available, redirecting to home');
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('❌ Error during transition:', error);
      navigate('/', { replace: true });
    } finally {
      setIsTransitioning(false);
    }
  }, [currentId, navigate, queryClient, refetchActive, isTransitioning]);

  // Set up polling intervals based on proximity to expiry
  useEffect(() => {
    const { nearExpiry } = checkExpiryStatus();
    
    // More frequent polling when near expiry
    const pollInterval = nearExpiry ? 5000 : 30000; // 5s vs 30s
    
    const interval = setInterval(() => {
      checkExpiryStatus();
      
      // Refetch active content more frequently when near expiry
      if (nearExpiry) {
        refetchActive();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [checkExpiryStatus, refetchActive]);

  // Pre-load next content when near expiry
  useEffect(() => {
    if (isNearExpiry && !nextContentId && activeContent && activeContent.id !== currentId) {
      console.log('🔮 Pre-loading next content:', activeContent.id);
      setNextContentId(activeContent.id);
      
      // Pre-fetch the next content's pages to avoid loading delay
      queryClient.prefetchQuery({
        queryKey: ['daily-published-pages', activeContent.book_id],
        staleTime: 60000 // 1 minute
      });
    }
  }, [isNearExpiry, nextContentId, activeContent, currentId, queryClient]);

  return {
    isNearExpiry,
    isTransitioning,
    nextContentId,
    timeCheck: checkExpiryStatus
  };
};