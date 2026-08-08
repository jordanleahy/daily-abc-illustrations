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
import { useLocation, useNavigate } from 'react-router-dom';
import { ScreenTimeWarningBanner } from '@/components/video/ScreenTimeWarningBanner';
import { ScreenTimeExpiredModal } from '@/components/video/ScreenTimeExpiredModal';
import { useLastFinishedBook } from '@/hooks/useLastFinishedBook';

const STORAGE_KEY = 'returnHomeAt';
const WARNING_THRESHOLD_MS = 60 * 1000;
const TICK_MS = 1000;

interface ScreenTimeContextValue {
  /** Epoch ms deadline, or null when no screen time was ever granted */
  deadline: number | null;
  /** Milliseconds remaining, or null when no deadline exists */
  timeRemaining: number | null;
  /** A deadline exists and it has passed */
  isExpired: boolean;
  /** A deadline exists and there is still time left */
  hasTime: boolean;
  showWarning: boolean;
  showExpiredModal: boolean;
  /** Re-read the deadline from storage */
  refresh: () => void;
  /** Grant (or extend) screen time by a number of milliseconds */
  grantTime: (durationMs: number) => void;
  /** Show the expired modal (e.g. a blocked play attempt) */
  requestMoreTime: () => void;
  dismissExpiredModal: (action: 'home' | 'habits') => void;
  lastBookId: string | null;
}

const ScreenTimeContext = createContext<ScreenTimeContextValue | null>(null);

function readDeadline(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ScreenTimeProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: lastBookId } = useLastFinishedBook();

  const [deadline, setDeadline] = useState<number | null>(() => readDeadline());
  const [now, setNow] = useState(() => Date.now());
  const [modalDismissed, setModalDismissed] = useState(false);
  const [forceModal, setForceModal] = useState(false);
  const dismissedForDeadline = useRef<number | null>(null);

  const refresh = useCallback(() => {
    const next = readDeadline();
    setDeadline((prev) => (prev === next ? prev : next));
    setNow(Date.now());
  }, []);

  // Re-read the deadline whenever the app regains focus, storage changes in
  // another tab, or the route changes. This keeps enforcement alive even when
  // the video components unmount/remount.
  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  // Single global ticker
  useEffect(() => {
    if (deadline === null) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, [deadline]);

  const timeRemaining = deadline === null ? null : Math.max(0, deadline - now);
  const isExpired = deadline !== null && timeRemaining === 0;
  const hasTime = timeRemaining !== null && timeRemaining > 0;
  const showWarning = hasTime && timeRemaining! <= WARNING_THRESHOLD_MS;

  // A new deadline resets any previous dismissal
  useEffect(() => {
    if (dismissedForDeadline.current !== deadline) {
      dismissedForDeadline.current = null;
      setModalDismissed(false);
      setForceModal(false);
    }
  }, [deadline]);

  const showExpiredModal = forceModal || (isExpired && !modalDismissed);

  const grantTime = useCallback((durationMs: number) => {
    const current = readDeadline();
    const base = current && current > Date.now() ? current : Date.now();
    const next = base + durationMs;
    localStorage.setItem(STORAGE_KEY, next.toString());
    setDeadline(next);
    setNow(Date.now());
  }, []);

  const requestMoreTime = useCallback(() => {
    setModalDismissed(false);
    setForceModal(true);
  }, []);

  const dismissExpiredModal = useCallback(
    (action: 'home' | 'habits') => {
      // Keep the expired deadline in storage so reopening /videos stays blocked
      // until new screen time is purchased.
      dismissedForDeadline.current = deadline;
      setModalDismissed(true);
      setForceModal(false);

      if (action === 'habits' && lastBookId) {
        navigate(`/library/book/${lastBookId}/read`);
      } else {
        navigate('/');
      }
    },
    [deadline, lastBookId, navigate]
  );

  const value = useMemo<ScreenTimeContextValue>(
    () => ({
      deadline,
      timeRemaining,
      isExpired,
      hasTime,
      showWarning,
      showExpiredModal,
      refresh,
      grantTime,
      requestMoreTime,
      dismissExpiredModal,
      lastBookId: lastBookId ?? null,
    }),
    [
      deadline,
      timeRemaining,
      isExpired,
      hasTime,
      showWarning,
      showExpiredModal,
      refresh,
      grantTime,
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
