import { memo } from 'react';

/**
 * TrialBanner - No longer needed since app is free
 * Returns null to maintain compatibility with existing imports
 */
export const TrialBanner = memo(({ variant = 'inline' }: { variant?: 'inline' | 'strip' }) => {
  // No trial banner needed - app is free for all users
  return null;
});

TrialBanner.displayName = 'TrialBanner';
