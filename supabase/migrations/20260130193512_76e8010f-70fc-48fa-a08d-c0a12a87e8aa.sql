-- Remove Text Overlay instructions from all specialized book creation agents
-- Content pages should have clean illustrations with text rendered via CSS

UPDATE agents
SET 
  instructions = regexp_replace(
    instructions,
    '- \*\*Text Overlay:\*\*[^\n]*\n?',
    '',
    'g'
  ),
  updated_at = now(),
  what_changed = 'Removed Text Overlay lines from content page templates - text handled via CSS'
WHERE type IN ('abc', 'shapes', 'colors', 'numbers', 'animals', 'first-words', 'rhyming', 'opposites', 'bedtime', 'manners', 'digraphs', 'dr-seuss')
  AND is_latest = true;