/**
 * @fileoverview Queue Date Utilities
 * 
 * Provides consistent position-based date calculation for the publish queue.
 * Dates are calculated dynamically based on queue position, not stored values.
 */

import { toEasternTime } from '@/utils/timezone';
import { format } from 'date-fns-tz';

/**
 * Calculates the publish date for a given queue position.
 * Position 1 = tomorrow, Position 2 = day after tomorrow, etc.
 * 
 * @param position - 1-indexed queue position
 * @returns Formatted date string
 */
export function getPublishDateForPosition(position: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + position);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Formats a publish date for display based on queue position.
 * Shows "Tomorrow" for position 1, day name for positions 2-6,
 * and full date for positions 7+.
 * 
 * @param position - 1-indexed queue position
 * @returns Human-readable date string
 */
export function formatQueuePosition(position: number): string {
  if (position === 1) {
    return 'Tomorrow';
  }
  
  const date = getPublishDateForPosition(position);
  const easternTime = toEasternTime(date);
  
  if (position <= 6) {
    // Show day name for next week
    return format(easternTime, 'EEEE'); // "Monday", "Tuesday", etc.
  }
  
  // Show full date for further out
  return format(easternTime, 'EEEE, MMMM do'); // "Wednesday, January 15th"
}

/**
 * Formats a publish date with full details for queue position.
 * Always shows the complete date.
 * 
 * @param position - 1-indexed queue position
 * @returns Full formatted date string
 */
export function formatQueuePositionFull(position: number): string {
  const date = getPublishDateForPosition(position);
  const easternTime = toEasternTime(date);
  return format(easternTime, 'EEEE, MMMM do, yyyy'); // "Wednesday, January 15th, 2025"
}

/**
 * Gets a simple placeholder date for database insertion.
 * The actual publish date will be set when the item is activated.
 * 
 * @returns Today's date in YYYY-MM-DD format
 */
export function getPlaceholderPublishDate(): string {
  return new Date().toISOString().split('T')[0];
}
