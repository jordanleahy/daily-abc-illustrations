-- Create word_assessments table for tracking word knowledge per kid
CREATE TABLE word_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID REFERENCES auth.users NOT NULL,
  kid_profile_id UUID REFERENCES kid_profiles NOT NULL,
  book_id UUID REFERENCES books NOT NULL,
  page_id UUID REFERENCES pages NOT NULL,
  word TEXT NOT NULL,
  word_index INTEGER NOT NULL,
  knows_word BOOLEAN NOT NULL,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE word_assessments ENABLE ROW LEVEL SECURITY;

-- Parents can view their kids' word assessments
CREATE POLICY "Parents can view their kids' word assessments"
  ON word_assessments FOR SELECT
  USING (parent_user_id = auth.uid());

-- Parents can create their kids' word assessments
CREATE POLICY "Parents can create their kids' word assessments"
  ON word_assessments FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

-- Create indexes for efficient queries
CREATE INDEX idx_word_assessments_kid ON word_assessments(kid_profile_id);
CREATE INDEX idx_word_assessments_page ON word_assessments(page_id);
CREATE INDEX idx_word_assessments_word ON word_assessments(word);