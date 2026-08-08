import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ScreenTimeWarningBanner } from '@/components/video/ScreenTimeWarningBanner';
import { ScreenTimeExpiredModal } from '@/components/video/ScreenTimeExpiredModal';
import { useLastFinishedBook } from '@/hooks/useLastFinishedBook';
import { useKidProfiles } from '@/hooks/useKidProfiles';

const WARNING_THRESHOLD_MS = 60 * 1000;
const TICK_MS = 1000;
/** How often watched time is debited against the server balance */
const DEBIT_INTERVAL_MS = 30 * 1000;

interface ScreenTimeContextValue {
  /** Milliseconds remaining, or null until the server balance is known */
  timeRemaining: number | null;
  /** Balance is known and exhausted */
  isExpired: boolean;
  /** Balance is known and there is still time left */
  hasTime: boolean;
  showWarning: boolean;
  showExpiredModal: boolean;
  /** Mark playback as started/stopped — time is only consumed while watching */
  setWatching: (watching: boolean) => void;
  /** Re-read the balance from the server */
  refresh: () => void;
  /** Show the expired modal (e.g. a blocked play attempt) */
  requestMoreTime: () => void;
  dismissExpiredModal: (action: 'home' | 'habits') => void;
  lastBookId: string | null;
}

const ScreenTimeContext = createContext<ScreenTimeContextValue | null>(null);

export function ScreenTimeProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: lastBookId } = useLastFinishedBook();
  const { data: kidProfiles } = useKidProfiles();

  // Screen time is tracked against the first active kid profile
  const kidId = kidProfiles?.[0]?.id ?? null;

  const { data: serverBalanceSeconds, refetch } = useQuery({
    queryKey: ['screen-time-balance', kidId],
    enabled: !!kidId,
    staleTime: 15 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kid_profiles')
        .select('screen_time_balance_seconds')
        .eq('id', kidId!)
        .single();
      if (error) throw error;
      return data?.screen_time_balance_seconds ?? 0;
    },
  });

  /**
   * Anchored balance: the remaining milliseconds at a monotonic point in time.
   * `performance.now()` is used instead of `Date.now()` so changing the device
   * clock cannot extend a session.
   */
  const [anchor, setAnchor] = useState<{ ms: number; at: number } | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [, setTick] = useState(0);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [forceModal, setForceModal] = useState(false);
  const hasWatchedRef = useRef(false);
  const lastDebitAtRef = useRef<number | null>(null);

  // Re-anchor whenever the server reports a balance
  useEffect(() => {
    if (serverBalanceSeconds === undefined) return;
    setAnchor({ ms: serverBalanceSeconds * 1000, at: performance.now() });
  }, [serverBalanceSeconds]);

  const elapsedMs = () =>
    isWatching && anchor ? performance.now() - anchor.at : 0;

  const timeRemaining = anchor === null ? null : Math.max(0, anchor.ms - elapsedMs());
  const isExpired = anchor !== null && timeRemaining === 0;
  const hasTime = timeRemaining !== null && timeRemaining > 0;
  const showWarning = isWatching && hasTime && timeRemaining! <= WARNING_THRESHOLD_MS;

  // Countdown ticker only runs while a video is actually playing
  useEffect(() => {
    if (!isWatching) return;
    const interval = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(interval);
  }, [isWatching]);

  /** Debit watched seconds against the server balance and re-anchor */
  const flushConsumption = useCallback(async () => {
    if (!kidId || lastDebitAtRef.current === null) return;
    const seconds = Math.round((performance.now() - lastDebitAtRef.current) / 1000);
    lastDebitAtRef.current = performance.now();
    if (seconds < 1) return;

    try {
      const { data, error } = await supabase.functions.invoke('consume-screen-time', {
        body: { kidProfileId: kidId, secondsWatched: seconds },
      });
      const remaining = (data as { remainingSeconds?: number } | null)?.remainingSeconds;
      if (!error && typeof remaining === 'number') {
        setAnchor({ ms: remaining * 1000, at: performance.now() });
      }
      queryClient.invalidateQueries({ queryKey: ['kid-profiles'] });
    } catch (err) {
      console.error('[ScreenTime] Failed to debit watched time', err);
    }
  }, [kidId, queryClient]);

  // Periodic server debit while watching, plus a final flush when playback stops
  useEffect(() => {
    if (!isWatching) return;
    lastDebitAtRef.current = performance.now();
    const interval = setInterval(flushConsumption, DEBIT_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      void flushConsumption();
      lastDebitAtRef.current = null;
    };
  }, [isWatching, flushConsumption]);

  // Flush when the tab is backgrounded so time isn't lost or over-granted
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') void flushConsumption();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, [flushConsumption]);

  // Stop watching the instant the balance runs out
  useEffect(() => {
    if (isExpired && isWatching) setIsWatching(false);
  }, [isExpired, isWatching]);

  const setWatching = useCallback((watching: boolean) => {
    if (watching) hasWatchedRef.current = true;
    setIsWatching(watching);
  }, []);

  const refresh = useCallback(() => {
    setModalDismissed(false);
    setForceModal(false);
    void refetch();
  }, [refetch]);

  const requestMoreTime = useCallback(() => {
    setModalDismissed(false);
    setForceModal(true);
  }, []);

  const dismissExpiredModal = useCallback(
    (action: 'home' | 'habits') => {
      setModalDismissed(true);
      setForceModal(false);

      if (action === 'habits' && lastBookId) {
        navigate(`/library/book/${lastBookId}/read`);
      } else {
        navigate('/');
      }
    },
    [lastBookId, navigate]
  );

  // Only surface the modal after a play attempt — never on unrelated pages
  const showExpiredModal =
    forceModal || (isExpired && hasWatchedRef.current && !modalDismissed);

  const value = useMemo<ScreenTimeContextValue>(
    () => ({
      timeRemaining,
      isExpired,
      hasTime,
      showWarning,
      showExpiredModal,
      setWatching,
      refresh,
      requestMoreTime,
      dismissExpiredModal,
      lastBookId: lastBookId ?? null,
    }),
    [
      timeRemaining,
      isExpired,
      hasTime,
      showWarning,
      showExpiredModal,
      setWatching,
      refresh,
      requestMoreTime,
      dismissExpiredModal,
      lastBookId,
    ]
  );

  return (
    <ScreenTimeContext.Provider value={value}>
      {showWarning && timeRemaining !== null && (
        <>
          <ScreenTimeWarningBanner timeRemaining={timeRemaining} />
          {/* Spacer so the fixed banner never covers page content */}
          <div aria-hidden className="h-10" />
        </>
      )}
      <ScreenTimeExpiredModal open={showExpiredModal} onDismiss={dismissExpiredModal} />
      {children}
    </ScreenTimeContext.Provider>
  );
}

export function useScreenTime(): ScreenTimeContextValue {
  const ctx = useContext(ScreenTimeContext);
  if (!ctx) {
    throw new Error('useScreenTime must be used within a ScreenTimeProvider');
  }
  return ctx;
}
