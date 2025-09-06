-- Assign moderator and admin roles to the specified user
-- (user role should already exist from signup trigger)
INSERT INTO public.user_roles (user_id, role) 
VALUES 
  ('bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c', 'moderator'),
  ('bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;