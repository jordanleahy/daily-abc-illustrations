import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLastFinishedBook } from "./useLastFinishedBook";

const WARNING_THRESHOLD_MS = 60 * 1000; // Show warning at 1 minute remaining

interface ScreenTimeTimerState {
  timeRemaining: number | null; // in milliseconds
  showWarning: boolean;
  showExpiredModal: boolean;
  dismissExpiredModal: (action: 'home' | 'habits') => void;
  lastBookId: string | null;
}

export const useScreenTimeTimer = (): ScreenTimeTimerState => {
  const navigate = useNavigate();
  const { data: lastBookId } = useLastFinishedBook();
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const dismissExpiredModal = useCallback((action: 'home' | 'habits') => {
    localStorage.removeItem('returnHomeAt');
    setShowExpiredModal(false);
    
    if (action === 'habits' && lastBookId) {
      navigate(`/library/book/${lastBookId}/read`);
    } else {
      navigate('/');
    }
  }, [navigate, lastBookId]);

  useEffect(() => {
    const returnHomeAt = localStorage.getItem('returnHomeAt');
    if (!returnHomeAt) {
      setTimeRemaining(null);
      return;
    }

    const returnTime = parseInt(returnHomeAt, 10);

    // Check immediately if already expired
    const initialRemaining = returnTime - Date.now();
    if (initialRemaining <= 0) {
      setShowExpiredModal(true);
      return;
    }

    setTimeRemaining(initialRemaining);
    if (initialRemaining <= WARNING_THRESHOLD_MS) {
      setShowWarning(true);
    }

    // Update every second
    const interval = setInterval(() => {
      const remaining = returnTime - Date.now();

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeRemaining(0);
        setShowWarning(false);
        setShowExpiredModal(true);
        return;
      }

      setTimeRemaining(remaining);

      if (remaining <= WARNING_THRESHOLD_MS && !showWarning) {
        setShowWarning(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    timeRemaining,
    showWarning,
    showExpiredModal,
    dismissExpiredModal,
    lastBookId: lastBookId ?? null,
  };
};
