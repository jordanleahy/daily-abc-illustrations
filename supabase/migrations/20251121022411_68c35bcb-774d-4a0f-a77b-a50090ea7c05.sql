-- Create YouTube API cache table for persistent caching across sessions
CREATE TABLE youtube_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  cache_type text NOT NULL CHECK (cache_type IN ('channel-search', 'channel-videos', 'video-metadata')),
  data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient cache lookups
CREATE INDEX idx_youtube_cache_key ON youtube_cache(cache_key);
CREATE INDEX idx_youtube_cache_type ON youtube_cache(cache_type);
CREATE INDEX idx_youtube_cache_expires ON youtube_cache(expires_at);

-- Enable RLS
ALTER TABLE youtube_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read cache (shared across all users)
CREATE POLICY "Anyone can read cache" ON youtube_cache
  FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Only service role can write to cache (edge functions)
CREATE POLICY "Service role can manage cache" ON youtube_cache
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE youtube_cache IS 'Caches YouTube API responses to reduce quota usage';
COMMENT ON COLUMN youtube_cache.cache_key IS 'Unique identifier for cached item (e.g., search:kids educational)';
COMMENT ON COLUMN youtube_cache.cache_type IS 'Type of cached data: channel-search, channel-videos, or video-metadata';
COMMENT ON COLUMN youtube_cache.expires_at IS 'When this cache entry expires and should be refreshed';