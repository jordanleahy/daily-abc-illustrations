-- Create admin_ideas table for storing marketing content and strategies
CREATE TABLE admin_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT, -- e.g., 'persona', 'messaging', 'strategy', 'campaign'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_ideas ENABLE ROW LEVEL SECURITY;

-- Admins can manage their own ideas
CREATE POLICY "Admins can view their own ideas"
  ON admin_ideas FOR SELECT
  USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create their own ideas"
  ON admin_ideas FOR INSERT
  WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update their own ideas"
  ON admin_ideas FOR UPDATE
  USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete their own ideas"
  ON admin_ideas FOR DELETE
  USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_admin_ideas_updated_at
  BEFORE UPDATE ON admin_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();