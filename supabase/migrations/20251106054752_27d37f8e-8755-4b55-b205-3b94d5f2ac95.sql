-- Create a function to clean up old page image versions
-- Keeps the latest version plus a configurable number of recent versions per page
CREATE OR REPLACE FUNCTION public.cleanup_old_page_images(
  p_keep_versions INTEGER DEFAULT 5,
  p_older_than_days INTEGER DEFAULT 30,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_current_deleted INTEGER;
  v_freed_storage_urls TEXT[];
  v_page_record RECORD;
  v_image_record RECORD;
  v_versions_to_delete UUID[];
BEGIN
  -- Collect all page IDs with more than p_keep_versions versions
  FOR v_page_record IN 
    SELECT 
      page_id,
      COUNT(*) as total_versions
    FROM page_image_urls
    GROUP BY page_id
    HAVING COUNT(*) > p_keep_versions
  LOOP
    -- For each page, find versions to delete (keeping latest + N recent versions)
    SELECT array_agg(id) INTO v_versions_to_delete
    FROM (
      SELECT id, version_number, created_at, is_latest, image_url
      FROM page_image_urls
      WHERE page_id = v_page_record.page_id
        AND is_latest = false  -- Never delete the latest version
        AND created_at < (NOW() - (p_older_than_days || ' days')::INTERVAL)
      ORDER BY version_number DESC
      OFFSET p_keep_versions - 1  -- Keep p_keep_versions recent versions
    ) old_versions;
    
    -- If we have versions to delete for this page
    IF v_versions_to_delete IS NOT NULL AND array_length(v_versions_to_delete, 1) > 0 THEN
      -- Collect storage URLs for cleanup
      FOR v_image_record IN 
        SELECT image_url 
        FROM page_image_urls 
        WHERE id = ANY(v_versions_to_delete) 
          AND image_url IS NOT NULL
      LOOP
        v_freed_storage_urls := array_append(v_freed_storage_urls, v_image_record.image_url);
      END LOOP;
      
      -- Delete the old versions (if not dry run)
      IF NOT p_dry_run THEN
        DELETE FROM page_image_urls
        WHERE id = ANY(v_versions_to_delete);
        
        GET DIAGNOSTICS v_current_deleted := ROW_COUNT;
        v_deleted_count := v_deleted_count + v_current_deleted;
      ELSE
        v_deleted_count := v_deleted_count + array_length(v_versions_to_delete, 1);
      END IF;
    END IF;
  END LOOP;
  
  -- Return summary report
  RETURN jsonb_build_object(
    'success', true,
    'dry_run', p_dry_run,
    'timestamp', NOW(),
    'parameters', jsonb_build_object(
      'keep_versions', p_keep_versions,
      'older_than_days', p_older_than_days
    ),
    'results', jsonb_build_object(
      'versions_deleted', v_deleted_count,
      'storage_urls_freed', COALESCE(array_length(v_freed_storage_urls, 1), 0),
      'freed_urls_sample', COALESCE(v_freed_storage_urls[1:5], ARRAY[]::TEXT[])
    ),
    'statistics', (
      SELECT jsonb_build_object(
        'total_images_remaining', COUNT(*),
        'total_pages_with_images', COUNT(DISTINCT page_id),
        'total_latest_images', COUNT(*) FILTER (WHERE is_latest = true),
        'ai_generated_images', COUNT(*) FILTER (WHERE source_type = 'ai_generated'),
        'user_uploaded_images', COUNT(*) FILTER (WHERE source_type = 'user_uploaded')
      )
      FROM page_image_urls
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', NOW()
    );
END;
$$;

-- Create a function to analyze page image storage and identify cleanup opportunities
CREATE OR REPLACE FUNCTION public.analyze_page_image_storage()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_analysis jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'overall_stats', (
      SELECT jsonb_build_object(
        'total_image_records', COUNT(*),
        'total_pages_with_images', COUNT(DISTINCT page_id),
        'total_books_with_images', COUNT(DISTINCT book_id),
        'total_users_with_images', COUNT(DISTINCT user_id),
        'latest_images_only', COUNT(*) FILTER (WHERE is_latest = true),
        'old_versions', COUNT(*) FILTER (WHERE is_latest = false),
        'ai_generated', COUNT(*) FILTER (WHERE source_type = 'ai_generated'),
        'user_uploaded', COUNT(*) FILTER (WHERE source_type = 'user_uploaded'),
        'with_urls', COUNT(*) FILTER (WHERE image_url IS NOT NULL),
        'without_urls', COUNT(*) FILTER (WHERE image_url IS NULL)
      )
      FROM page_image_urls
    ),
    'version_distribution', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'versions_count', versions_count,
          'pages_with_count', pages_count
        ) ORDER BY versions_count DESC
      )
      FROM (
        SELECT COUNT(*) as versions_count, COUNT(page_id) as pages_count
        FROM (
          SELECT page_id, COUNT(*) as version_count
          FROM page_image_urls
          GROUP BY page_id
        ) versions_per_page
        GROUP BY versions_count
        ORDER BY versions_count DESC
        LIMIT 20
      ) version_stats
    ),
    'cleanup_opportunities', (
      SELECT jsonb_build_object(
        'pages_with_5plus_versions', COUNT(*) FILTER (WHERE version_count >= 5),
        'pages_with_10plus_versions', COUNT(*) FILTER (WHERE version_count >= 10),
        'pages_with_20plus_versions', COUNT(*) FILTER (WHERE version_count >= 20),
        'estimated_deletable_keeping_5', SUM(CASE WHEN version_count > 5 THEN version_count - 5 ELSE 0 END),
        'estimated_deletable_keeping_10', SUM(CASE WHEN version_count > 10 THEN version_count - 10 ELSE 0 END)
      )
      FROM (
        SELECT page_id, COUNT(*) as version_count
        FROM page_image_urls
        GROUP BY page_id
      ) page_versions
    ),
    'age_analysis', (
      SELECT jsonb_build_object(
        'images_older_than_30_days', COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days'),
        'images_older_than_60_days', COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '60 days'),
        'images_older_than_90_days', COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days'),
        'old_non_latest_images', COUNT(*) FILTER (WHERE is_latest = false AND created_at < NOW() - INTERVAL '30 days')
      )
      FROM page_image_urls
    ),
    'top_pages_by_versions', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'page_id', page_id,
          'version_count', version_count,
          'latest_version_number', latest_version,
          'oldest_created_at', oldest_created,
          'newest_created_at', newest_created
        ) ORDER BY version_count DESC
      )
      FROM (
        SELECT 
          page_id,
          COUNT(*) as version_count,
          MAX(version_number) as latest_version,
          MIN(created_at) as oldest_created,
          MAX(created_at) as newest_created
        FROM page_image_urls
        GROUP BY page_id
        ORDER BY version_count DESC
        LIMIT 10
      ) top_pages
    )
  ) INTO v_analysis;
  
  RETURN v_analysis;
END;
$$;

-- Create a function to clean up orphaned image records (no actual image URL)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_image_records(
  p_older_than_days INTEGER DEFAULT 7,
  p_dry_run BOOLEAN DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
BEGIN
  -- Delete records that have no image_url and are old and not the latest version
  IF NOT p_dry_run THEN
    DELETE FROM page_image_urls
    WHERE image_url IS NULL
      AND is_latest = false
      AND created_at < (NOW() - (p_older_than_days || ' days')::INTERVAL);
    
    GET DIAGNOSTICS v_deleted_count := ROW_COUNT;
  ELSE
    SELECT COUNT(*) INTO v_deleted_count
    FROM page_image_urls
    WHERE image_url IS NULL
      AND is_latest = false
      AND created_at < (NOW() - (p_older_than_days || ' days')::INTERVAL);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'dry_run', p_dry_run,
    'timestamp', NOW(),
    'orphaned_records_deleted', v_deleted_count,
    'parameters', jsonb_build_object(
      'older_than_days', p_older_than_days
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', NOW()
    );
END;
$$;

-- Grant execute permissions to authenticated users (admins only for cleanup functions)
GRANT EXECUTE ON FUNCTION public.analyze_page_image_storage() TO authenticated;

COMMENT ON FUNCTION public.cleanup_old_page_images IS 'Cleans up old page image versions while keeping the latest and N recent versions per page. Use dry_run=true to preview changes before executing.';
COMMENT ON FUNCTION public.analyze_page_image_storage IS 'Analyzes page image storage usage and provides statistics about versions and cleanup opportunities.';
COMMENT ON FUNCTION public.cleanup_orphaned_image_records IS 'Removes old image records that have no actual image URL (failed generations).';