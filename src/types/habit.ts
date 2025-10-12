/**
 * Habit type definitions for the Daily Habits feature
 */

export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface Habit {
  id: string;
  parent_user_id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  coin_amount: number;
  frequency: HabitFrequency;
  deadline_time: string | null; // '21:00:00' format
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitAssignment {
  id: string;
  habit_id: string;
  kid_profile_id: string;
  parent_user_id: string;
  is_active: boolean;
  assigned_at: string;
  habits?: Habit;
  kid_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
    earned_coins: number;
  };
}

export interface HabitCompletion {
  id: string;
  habit_assignment_id: string;
  kid_profile_id: string;
  parent_user_id: string;
  completion_date: string; // 'YYYY-MM-DD' format
  status: 'pending' | 'completed' | 'declined';
  coins_deposited: number;
  coins_retained: number;
  marked_at: string | null;
  deadline_at: string | null;
  created_at: string;
  updated_at: string;
  habit_assignments?: HabitAssignment;
}

export interface HabitCompletionWithDetails extends Omit<HabitCompletion, 'habit_assignments'> {
  habit_assignments: {
    habit_id: string;
    kid_profile_id: string;
    habits: Habit;
    kid_profiles: {
      id: string;
      first_name: string;
      last_name: string;
      profile_image_url?: string;
      earned_coins: number;
    };
  };
}

export interface NewHabit {
  title: string;
  description?: string;
  photo_url?: string;
  coin_amount: number;
  frequency: HabitFrequency;
  deadline_time?: string;
  assignedKidIds: string[];
}
