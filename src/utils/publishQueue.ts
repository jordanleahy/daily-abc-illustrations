/**
 * @fileoverview Publication Queue Utilities
 * 
 * Utilities for managing the daily publication queue with strict FIFO (First In, First Out) scheduling.
 * Ensures new and republished items always append to the end of the schedule.
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Gets the next publish date by appending to the end of the queue (FIFO)
 * 
 * This function implements strict First In, First Out scheduling:
 * - Finds the latest publish_date among queued/active items
 * - Returns the next day after that date
 * - Uses today as a floor (never schedules in the past)
 * 
 * Example:
 * - If latest queued item is Nov 5, returns Nov 6
 * - If no items exist, returns tomorrow
 * - If latest is yesterday (edge case), returns tomorrow
 * 
 * @param supabase - Supabase client instance
 * @returns Promise resolving to date string in YYYY-MM-DD format
 */
export async function getAppendPublishDate(supabase: SupabaseClient): Promise<string> {
  // Fetch the latest publish_date from queued or active items
  const { data } = await supabase
    .from('daily_published')
    .select('publish_date')
    .in('status', ['queued', 'active'])
    .order('publish_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Start with today as the floor (never schedule in the past)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let base = today;

  // If there's an existing latest date, use it if it's after today
  if (data?.publish_date) {
    // Parse date string (YYYY-MM-DD) into Date object
    const [year, month, day] = data.publish_date.split('-').map(Number);
    const latestDate = new Date(year, month - 1, day); // Month is 0-indexed
    latestDate.setHours(0, 0, 0, 0);
    
    // Use the later of today or latest queued date
    if (latestDate > base) {
      base = latestDate;
    }
  }

  // Add one day to get the next available slot
  const nextDate = new Date(base);
  nextDate.setDate(base.getDate() + 1);

  // Format as YYYY-MM-DD for database storage
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
