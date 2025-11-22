export interface TrickMediaUpload {
  id: string;
  trick_id: string;
  trick_goal_id: string | null;
  kid_profile_id: string;
  parent_user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  uploaded_at: string;
  location_latitude: number | null;
  location_longitude: number | null;
  location_accuracy: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreateTrickMediaUpload {
  trick_id: string;
  trick_goal_id?: string;
  kid_profile_id: string;
  media_file: File;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}
