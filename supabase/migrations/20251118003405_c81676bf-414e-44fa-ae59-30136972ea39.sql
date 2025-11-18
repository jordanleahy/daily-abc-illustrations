-- Create book categorization log table for tracking all categorization changes
CREATE TABLE IF NOT EXISTS public.book_categorization_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  old_category text,
  old_book_type text,
  new_book_type text NOT NULL,
  confidence_score numeric,
  applied_by uuid REFERENCES auth.users(id),
  applied_at timestamp with time zone DEFAULT now(),
  can_rollback boolean DEFAULT true,
  rollback_at timestamp with time zone,
  notes text
);

-- Enable RLS
ALTER TABLE public.book_categorization_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_book_categorization_log_book_id ON public.book_categorization_log(book_id);
CREATE INDEX idx_book_categorization_log_applied_at ON public.book_categorization_log(applied_at DESC);

-- RLS Policies
CREATE POLICY "Admins can view all categorization logs"
  ON public.book_categorization_log
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert categorization logs"
  ON public.book_categorization_log
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categorization logs"
  ON public.book_categorization_log
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment
COMMENT ON TABLE public.book_categorization_log IS 'Tracks all book categorization changes for audit trail and rollback capability';