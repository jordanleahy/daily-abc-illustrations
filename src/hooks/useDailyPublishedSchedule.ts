/**
 * Schedule hook - delegates to Queue hook for consistent behavior
 * This hook is kept for backward compatibility with existing consumers.
 * The Queue hook has real-time subscriptions for updates.
 */
import { useDailyPublishedQueue } from './useDailyPublishedQueue';

/**
 * @deprecated Use useDailyPublishedQueue directly for new code
 */
export const useDailyPublishedSchedule = () => {
  return useDailyPublishedQueue();
};
