-- Insert approved YouTube channels for screen time rewards
INSERT INTO public.youtube_channels (parent_user_id, channel_id, channel_title, channel_thumbnail_url, is_active)
VALUES 
  ('d656709d-09c8-4b37-a7bf-e2fa2fa39be1', 'UCdL-r-n3VnbT0oHzY2YgcOQ', 'Burton Snowboards', NULL, true),
  ('d656709d-09c8-4b37-a7bf-e2fa2fa39be1', 'UCblfuW_4rakIf2h6aqANefA', 'Red Bull Snow', NULL, true),
  ('d656709d-09c8-4b37-a7bf-e2fa2fa39be1', 'UC2jYHEpXKZVg6LZ5pU_dMGw', 'The Bomb Hole', NULL, true),
  ('d656709d-09c8-4b37-a7bf-e2fa2fa39be1', 'UCfyAIkAJC5b3qLK3hBB-uAA', 'Nixon', NULL, true)
ON CONFLICT (channel_id) DO NOTHING;