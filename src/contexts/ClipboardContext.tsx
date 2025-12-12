import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface ClipboardContextValue {
  clipboardImage: Blob | null;
  clipboardTimestamp: number | null;
  clearClipboardImage: () => void;
  consumeClipboardImage: () => Promise<File | null>;
  isIOS: boolean;
}

const ClipboardContext = createContext<ClipboardContextValue | null>(null);

const CLIPBOARD_TTL_MS = 60 * 1000; // 60 seconds

// Detect iOS Safari
const detectIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export function ClipboardProvider({ children }: { children: React.ReactNode }) {
  const [clipboardImage, setClipboardImage] = useState<Blob | null>(null);
  const [clipboardTimestamp, setClipboardTimestamp] = useState<number | null>(null);
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIOS = detectIOS();

  // Clear cached image
  const clearClipboardImage = useCallback(() => {
    setClipboardImage(null);
    setClipboardTimestamp(null);
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
  }, []);

  // Set cached image with TTL
  const setCachedImage = useCallback((blob: Blob) => {
    setClipboardImage(blob);
    setClipboardTimestamp(Date.now());
    
    // Auto-clear after TTL
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
    }
    clearTimeoutRef.current = setTimeout(() => {
      clearClipboardImage();
    }, CLIPBOARD_TTL_MS);
  }, [clearClipboardImage]);

  // Consume and clear the cached image
  const consumeClipboardImage = useCallback(async (): Promise<File | null> => {
    // Check if cached image is still valid
    if (clipboardImage && clipboardTimestamp) {
      const age = Date.now() - clipboardTimestamp;
      if (age < CLIPBOARD_TTL_MS) {
        const file = new File([clipboardImage], `clipboard-image-${Date.now()}.png`, { type: clipboardImage.type });
        clearClipboardImage();
        return file;
      }
    }
    return null;
  }, [clipboardImage, clipboardTimestamp, clearClipboardImage]);

  // Global paste handler at document level
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            setCachedImage(file);
            console.log('[ClipboardContext] Image cached from paste event');
            return;
          }
        }
      }
    };

    // Attach global listener
    document.addEventListener('paste', handleGlobalPaste);

    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [setCachedImage]);

  // Visibility change handler - refresh clipboard awareness
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to app - cached image may still be valid
        // No action needed, TTL handles expiry
        console.log('[ClipboardContext] App visible, cached image available:', !!clipboardImage);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clipboardImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ClipboardContext.Provider value={{
      clipboardImage,
      clipboardTimestamp,
      clearClipboardImage,
      consumeClipboardImage,
      isIOS,
    }}>
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
}
