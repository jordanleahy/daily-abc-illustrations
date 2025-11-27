-- Migration: Update all specialized book creation agents (excluding ABC) to present standardized page count options (5, 10, 15, 20 content pages)

-- Update Numbers agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Numbers book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] content pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'numbers' AND is_latest = true;

-- Update Rhyming agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Rhyming book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] rhyming pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'rhyming' AND is_latest = true;

-- Update Colors agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Colors book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] color pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'colors' AND is_latest = true;

-- Update Shapes agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Shapes book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] shape pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'shapes' AND is_latest = true;

-- Update Opposites agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Opposites book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] opposite pair pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'opposites' AND is_latest = true;

-- Update Emotions agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Emotions book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] emotion pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'emotions' AND is_latest = true;

-- Update Animals agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Animals book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] animal pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'animals' AND is_latest = true;

-- Update First Words agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page First Words book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] word pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'first-words' AND is_latest = true;

-- Update Bedtime agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Bedtime book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] story pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'bedtime' AND is_latest = true;

-- Update CVC agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page CVC book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] CVC word pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'cvc' AND is_latest = true;

-- Update Sight Words agent
UPDATE agents 
SET instructions = instructions || E'

## STEP 4.5: Page Count Selection

After theme/topic selection, present exactly 4 content page options:

{
  "message": "How many content pages would you like for [child name]''s book?\\n\\n📖 **5 pages** – Quick & focused\\n📖 **10 pages** – Standard length\\n📖 **15 pages** – Extended learning\\n📖 **20 pages** – Comprehensive",
  "suggestions": [
    {"id": "pages-5", "label": "📖 5 pages (quick read)"},
    {"id": "pages-10", "label": "📖 10 pages (recommended)"},
    {"id": "pages-15", "label": "📖 15 pages (extended)"},
    {"id": "pages-20", "label": "📖 20 pages (comprehensive)"}
  ],
  "metadata": {
    "currentStep": "page-count-selection"
  }
}

Note: Cover page and Educational Focus page are added automatically:
- 5 content → 7 total pages
- 10 content → 12 total pages
- 15 content → 17 total pages
- 20 content → 22 total pages

## After User Selects Page Count

When user selects pages-N (e.g., pages-10), confirm and proceed:

{
  "message": "Perfect! I''ll create a [N]-page Sight Words book for [child name]!\\n\\n**Book Structure:**\\n• Cover page\\n• Educational focus page\\n• [N] sight word pages\\n\\nNow let me create a title and description...",
  "suggestions": [],
  "metadata": {
    "confirmedPageCount": [N + 2],
    "currentStep": "proceeding-to-title"
  }
}',
  updated_at = NOW()
WHERE type = 'sight-words' AND is_latest = true;