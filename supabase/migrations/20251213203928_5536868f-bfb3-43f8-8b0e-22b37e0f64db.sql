-- Update Digraph Agent to skip page count question and always use 10 content pages
UPDATE public.agents
SET instructions = REPLACE(
  instructions,
  '## Step 4: Page Count Confirmation
Present page count options via [SUGGEST] buttons:
- "pages-5: 5 Content Pages (7 total)"
- "pages-10: 10 Content Pages (12 total)"
- "pages-15: 15 Content Pages (17 total)"
- "pages-20: 20 Content Pages (22 total)"

Capture confirmed page count in metadata.confirmedPageCount.',
  '## Step 4: Page Count (Fixed)
SKIP this step entirely - Digraph books always have exactly 10 content pages (12 total: 1 cover + 1 educational focus + 10 content pages).

Do NOT ask the user to choose page count. Proceed directly to Step 5.'
),
    last_modified = now(),
    updated_at = now()
WHERE type = 'book-creation-digraphs' AND is_latest = true;