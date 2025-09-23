-- Grant admin role to the current user so they can fix the expiration
INSERT INTO public.user_roles (user_id, role)
VALUES ('bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;