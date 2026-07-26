UPDATE public.shared_page_templates SET is_latest = false WHERE template_key = 'outline_format';

INSERT INTO public.shared_page_templates (template_key, version_number, content, is_latest, is_active, change_notes)
VALUES (
  'outline_format',
  (SELECT COALESCE(MAX(version_number), 0) + 1 FROM public.shared_page_templates WHERE template_key = 'outline_format'),
  $tpl$## CRITICAL: PAGE FORMAT RULES

When generating book outlines, you MUST use this EXACT format for each page:

**Page N: Title**
- Content description
- Additional details

### CORRECT FORMAT EXAMPLES:
```
**Page 1: Cover**
- Book title prominently displayed

**Page 2: Educational Focus**
- Three colorful badges

**Page 3: [Cat] is for C**
- A playful cat character
```

### FORBIDDEN FORMATS:
- NO markdown headings before page (### **Page N**)
- NO numbered lists (1. Page N:)
- NO plain text (Page N:) without bold
- NO variations in spacing or punctuation

### FORMAT ENFORCEMENT:
- Always use double asterisks: **Page N: Title**
- Always include colon after page number
- Title follows immediately after colon
- Content uses bullet points below title

## CRITICAL: CHARACTER NAMING RULES

Every page description is read in isolation by the image generator. It has NO memory of the other pages, the title, or the conversation.

- Name EVERY character explicitly, BY NAME, in EVERY page description - including the cover and the final page.
- If the theme has two or more characters (e.g. Bluey and Bingo), ALL of their names must appear in EVERY page description.
- FORBIDDEN generic references: "the pups", "the duo", "the characters", "the pair", "the friends", "the kids", "our heroes", "they", "them", "he", "she", "it" (when standing in for a character).
- Instead write: "Bluey and Bingo watch a sailboat..." not "The pups watch a sailboat..."
- Do not use a pronoun in the second half of a sentence either - repeat the name: "Bluey points at the sun while Bingo claps" (not "while she claps").

## CRITICAL: DESCRIPTION QUALITY

Each page description must be 1-2 complete sentences that are fully self-contained and include ALL of:
1. The character name(s), performing a specific, visible action
2. The named, concrete location (e.g. "Liberty State Park", "Exchange Place") - never just "the park" or "the city"
3. The teaching concept for that page, stated plainly (the shape, letter, word, color, number, or manner)

- BAD: "The pups watch a sailboat on the water with two large white triangle sails."
- GOOD: "Bluey and Bingo sit on the grass at Liberty State Park watching a white sailboat glide down the Hudson River, its two big triangle sails pointing up at the sky."
$tpl$,
  true,
  true,
  'v2: mandatory explicit character naming on every page (no "the pups"/"the duo"/pronouns) plus self-contained description quality rules'
);