import { useEffect, useRef, useCallback } from 'react';
import { useGA4 } from './useGA4';
import { useRole } from '@/contexts/RoleContext';
import { useAuth } from './useAuth';

interface ReadingSessionConfig {
  contentType: 'daily_published' | 'library_book';
  contentId: string;
  bookId: string;
  totalPages: number;
  entryPoint: 'direct_link' | 'homepage_redirect' | 'library_card' | 'reading_view_button';
  startingPage?: number;
}

interface ReadingSessionAnalytics {
  startSession: (config: ReadingSessionConfig) => void;
  trackPageView: (pageNumber: number, pageLetter: string, navigationMethod?: string) => void;
  endSession: (exitMethod?: string) => void;
}

export const useReadingSessionAnalytics = (): ReadingSessionAnalytics => {
  const { trackEvent } = useGA4();
  const { primaryRole } = useRole();
  const { user } = useAuth();
  
  const sessionRef = useRef<{
    sessionId: string;
    startTime: number;
    currentPageStartTime: number;
    config: ReadingSessionConfig | null;
    pagesViewed: Set<number>;
    pageSequence: number[];
    highestPageReached: number;
  }>({
    sessionId: '',
    startTime: 0,
    currentPageStartTime: 0,
    config: null,
    pagesViewed: new Set(),
    pageSequence: [],
    highestPageReached: 0,
  });

  const generateSessionId = useCallback(() => {
    return `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const startSession = useCallback((config: ReadingSessionConfig) => {
    const sessionId = generateSessionId();
    const now = Date.now();
    
    sessionRef.current = {
      sessionId,
      startTime: now,
      currentPageStartTime: now,
      config,
      pagesViewed: new Set(),
      pageSequence: [],
      highestPageReached: config.startingPage || 1,
    };

    trackEvent('reading_session_start', {
      session_id: sessionId,
      content_type: config.contentType,
      content_id: config.contentId,
      book_id: config.bookId,
      user_type: user ? 'authenticated' : 'anonymous',
      user_role: user ? primaryRole : null,
      entry_point: config.entryPoint,
      starting_page: config.startingPage || 1,
      total_pages: config.totalPages,
      timestamp: now,
    });
  }, [trackEvent, user, primaryRole, generateSessionId]);

  const trackPageView = useCallback((pageNumber: number, pageLetter: string, navigationMethod = 'next_swipe') => {
    const session = sessionRef.current;
    if (!session.config || !session.sessionId) return;

    const now = Date.now();
    const timeOnPreviousPage = now - session.currentPageStartTime;
    
    // Update session tracking
    session.pagesViewed.add(pageNumber);
    session.pageSequence.push(pageNumber);
    session.highestPageReached = Math.max(session.highestPageReached, pageNumber);
    session.currentPageStartTime = now;

    trackEvent('reading_page_view', {
      session_id: session.sessionId,
      content_type: session.config.contentType,
      content_id: session.config.contentId,
      book_id: session.config.bookId,
      page_number: pageNumber,
      page_letter: pageLetter,
      time_on_previous_page: timeOnPreviousPage,
      navigation_method: navigationMethod,
      page_sequence: session.pageSequence.slice(-5), // Last 5 pages for context
      pages_viewed_so_far: session.pagesViewed.size,
      highest_page_reached: session.highestPageReached,
      timestamp: now,
    });
  }, [trackEvent]);

  const endSession = useCallback((exitMethod = 'navigation_away') => {
    const session = sessionRef.current;
    if (!session.config || !session.sessionId) return;

    const now = Date.now();
    const totalDuration = now - session.startTime;
    const lastPageDuration = now - session.currentPageStartTime;
    const completionPercentage = (session.highestPageReached / session.config.totalPages) * 100;

    trackEvent('reading_session_end', {
      session_id: session.sessionId,
      content_type: session.config.contentType,
      content_id: session.config.contentId,
      book_id: session.config.bookId,
      total_duration: totalDuration,
      pages_viewed: session.pagesViewed.size,
      unique_pages_viewed: Array.from(session.pagesViewed),
      highest_page_reached: session.highestPageReached,
      completion_percentage: Math.round(completionPercentage),
      exit_method: exitMethod,
      last_page_duration: lastPageDuration,
      total_page_views: session.pageSequence.length,
      timestamp: now,
    });

    // Reset session
    sessionRef.current = {
      sessionId: '',
      startTime: 0,
      currentPageStartTime: 0,
      config: null,
      pagesViewed: new Set(),
      pageSequence: [],
      highestPageReached: 0,
    };
  }, [trackEvent]);

  // Clean up session on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current.sessionId) {
        endSession('component_unmount');
      }
    };
  }, [endSession]);

  // Track page visibility changes (browser tab changes, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && sessionRef.current.sessionId) {
        endSession('tab_hidden');
      }
    };

    const handleBeforeUnload = () => {
      if (sessionRef.current.sessionId) {
        endSession('browser_close');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [endSession]);

  return {
    startSession,
    trackPageView,
    endSession,
  };
};