import { useScreenTime } from "@/contexts/ScreenTimeContext";

interface ScreenTimeTimerState {
  timeRemaining: number | null; // in milliseconds
  showWarning: boolean;
  showExpiredModal: boolean;
  isExpired: boolean;
  hasTime: boolean;
  requestMoreTime: () => void;
  dismissExpiredModal: (action: 'home' | 'habits') => void;
  lastBookId: string | null;
}

/**
 * Thin wrapper over the global ScreenTimeContext.
 *
 * The banner and expired modal are rendered once at the app level, so
 * consumers only need `timeRemaining` / `hasTime` / `isExpired` to gate
 * playback. `showWarning` and `showExpiredModal` are kept for layout offsets.
 */
export const useScreenTimeTimer = (): ScreenTimeTimerState => {
  const {
    timeRemaining,
    showWarning,
    showExpiredModal,
    isExpired,
    hasTime,
    requestMoreTime,
    dismissExpiredModal,
    lastBookId,
  } = useScreenTime();

  return {
    timeRemaining,
    showWarning,
    showExpiredModal,
    isExpired,
    hasTime,
    requestMoreTime,
    dismissExpiredModal,
    lastBookId,
  };
};
