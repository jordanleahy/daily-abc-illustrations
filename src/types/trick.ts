/**
 * Trick type definitions for cumulative progress tracking
 */

export interface VideoData {
  dataUrl: string;
  thumbnail: string;
  duration: number;
}

export interface Trick {
  id: string;
  parent_user_id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  video_urls: string | null;
  points_per_completion: number;
  is_active: boolean;
  display_order: number;
  feature_angle: string | null;
  type: string | null;
  created_at: string;
  updated_at: string;
}

export type TrickStance = 'regular' | 'switch';

export interface TrickGoal {
  id: string;
  trick_id: string;
  kid_profile_id: string;
  parent_user_id: string;
  target_count: number;
  current_count: number;
  is_active: boolean;
  stance: TrickStance;
  goal_started_at: string;
  goal_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrickGoalWithDetails extends TrickGoal {
  tricks?: Trick;
  kid_profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image_url: string | null;
    earned_coins: number;
  };
}

export interface TrickCompletion {
  id: string;
  trick_goal_id: string;
  kid_profile_id: string;
  parent_user_id: string;
  count_increment: number;
  points_awarded: number;
  completed_at: string;
  notes: string | null;
  created_at: string;
}

export interface NewTrick {
  name: string;
  description?: string;
  photo_url?: string;
  video_urls?: string;
  points_per_completion: number;
  feature_angle?: string;
  type?: string;
  assigned_kids: {
    kid_profile_id: string;
    target_count: number;
  }[];
}

export interface UpdateTrickData {
  trickId: string;
  name?: string;
  description?: string;
  photo_url?: string;
  video_urls?: string;
  points_per_completion?: number;
  feature_angle?: string;
  type?: string;
}

export interface AddTrickCompletionParams {
  goalId: string;
  count_increment: number;
  notes?: string;
}
