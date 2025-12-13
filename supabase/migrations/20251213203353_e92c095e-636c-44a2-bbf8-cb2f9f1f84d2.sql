-- Update Digraph Agent page title format to include full sentence
UPDATE public.agents
SET instructions = REPLACE(
  instructions,
  '## Page Title Format
For specific digraph books: "[Digraph] is for [Word]" (e.g., "ch is for chair")
For mixed digraph books: Include the digraph in each title',
  '## Page Title Format
CRITICAL: Each content page title MUST include the digraph AND the full educational sentence.
Format: "[digraph] - [Full sentence featuring a word with that digraph]"

Examples:
- "ch - The cheerful chicken chose some cheese"
- "sh - She sells seashells by the seashore"
- "th - The thoughtful thief thought twice"
- "wh - The whale whistled while swimming"

For mixed digraph books: Each page highlights one digraph with its full sentence.'
),
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-digraphs' AND is_latest = true;