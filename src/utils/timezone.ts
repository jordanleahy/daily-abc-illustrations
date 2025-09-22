import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';

export const EASTERN_TIMEZONE = 'America/New_York';
export const PUBLISH_TIME = { hours: 7, minutes: 1 }; // 7:01 AM

/**
 * Convert a date to Eastern Time
 */
export function toEasternTime(date: Date): Date {
  return toZonedTime(date, EASTERN_TIMEZONE);
}

/**
 * Convert an Eastern Time date to UTC
 */
export function fromEasternTime(easternDate: Date): Date {
  return fromZonedTime(easternDate, EASTERN_TIMEZONE);
}

/**
 * Format a date in Eastern timezone
 */
export function formatEasternTime(date: Date, formatString: string = 'yyyy-MM-dd HH:mm:ss zzz'): string {
  const easternDate = toEasternTime(date);
  return format(easternDate, formatString);
}

/**
 * Format a timestamp for schedule display (e.g., "Sep 23 at 7:01 AM ET")
 */
export function formatScheduleTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const easternDate = toEasternTime(date);
  
  return format(easternDate, 'MMM d \'at\' h:mm aa \'ET\'');
}

/**
 * Create a publish date at 7:01 AM Eastern Time for a given date
 * Properly converts Eastern Time to UTC for storage
 */
export function createEasternPublishDate(dateString: string): Date {
  // Create a date object representing 7:01 AM in Eastern Time on the given date
  const easternDateTime = new Date(dateString + 'T07:01:00');
  
  // Convert from Eastern Time to UTC for proper database storage
  return fromEasternTime(easternDateTime);
}

/**
 * Check if current time is within the publishing window (7:01-7:03 AM Eastern)
 */
export function isPublishingTime(tolerance: number = 3): boolean {
  const now = new Date();
  const easternTime = toEasternTime(now);
  const hour = easternTime.getHours();
  const minute = easternTime.getMinutes();
  
  return hour === PUBLISH_TIME.hours && minute >= 0 && minute <= tolerance;
}