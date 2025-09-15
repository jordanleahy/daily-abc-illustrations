-- Create function to ensure only one image per page has is_latest = true
CREATE OR REPLACE FUNCTION manage_page_image_latest()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new record is being set to is_latest = true
  IF NEW.is_latest = true THEN
    -- Set all other images for this page to is_latest = false
    UPDATE page_image_urls 
    SET is_latest = false, updated_at = now()
    WHERE page_id = NEW.page_id 
    AND id != NEW.id 
    AND is_latest = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically manage is_latest flag
DROP TRIGGER IF EXISTS trigger_manage_page_image_latest ON page_image_urls;
CREATE TRIGGER trigger_manage_page_image_latest
  BEFORE INSERT OR UPDATE ON page_image_urls
  FOR EACH ROW
  EXECUTE FUNCTION manage_page_image_latest();

-- Function to get next version number for a page
CREATE OR REPLACE FUNCTION get_next_page_image_version_number(p_page_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM page_image_urls
  WHERE page_id = p_page_id;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;