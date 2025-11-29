-- Create function for semantic search on vectorized codebase
CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) as similarity
  FROM embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;