-- Phase 1: Word Learning Progress Tracking Table
-- Tracks each word learning interaction per kid profile for personalized recommendations

CREATE TABLE word_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  page_id uuid REFERENCES pages(id) ON DELETE SET NULL,
  word_text text NOT NULL,
  word_metadata jsonb DEFAULT '{}'::jsonb,
  sentence_context text,
  status text NOT NULL CHECK (status IN ('difficult', 'understood', 'skipped')),
  marked_at timestamptz NOT NULL DEFAULT now(),
  session_context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_word_progress_kid_word ON word_learning_progress(kid_profile_id, word_text);
CREATE INDEX idx_word_progress_kid_status ON word_learning_progress(kid_profile_id, status);
CREATE INDEX idx_word_progress_parent ON word_learning_progress(parent_user_id);
CREATE INDEX idx_word_progress_marked_at ON word_learning_progress(marked_at DESC);

-- Enable RLS
ALTER TABLE word_learning_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Parents can manage word progress for their kids
CREATE POLICY "Parents can insert word progress for their kids"
  ON word_learning_progress FOR INSERT
  WITH CHECK (
    parent_user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM kid_profiles WHERE id = kid_profile_id AND parent_user_id = auth.uid())
  );

CREATE POLICY "Parents can view word progress for their kids"
  ON word_learning_progress FOR SELECT
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can update word progress for their kids"
  ON word_learning_progress FOR UPDATE
  USING (parent_user_id = auth.uid());

-- Admin policies using correct has_role function
CREATE POLICY "Admins can view all word progress"
  ON word_learning_progress FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_word_learning_progress_updated_at
  BEFORE UPDATE ON word_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();