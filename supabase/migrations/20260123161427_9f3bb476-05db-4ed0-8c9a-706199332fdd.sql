UPDATE agents 
SET 
  instructions = REPLACE(
    instructions,
    '## 🚨 CRITICAL: IMAGE PROMPT FORMATTING 🚨

**Image Prompt MUST contain ONLY visual scene description. NO rhyme text, NO words, NO quotes.**

### Page Format for Rhyming Pages',
    '## 🚨 CRITICAL: IMAGE PROMPT FORMATTING 🚨

**Image Prompt MUST contain ONLY visual scene description. NO rhyme text, NO words, NO quotes.**

### Page 2: Educational Focus Format
**Page 2: Educational Focus**
- **Image Prompt:** Three colorful educational badges on a themed background matching the book''s setting. A teal oval badge shows "[Age Group]", a coral rounded badge shows "Rhyming & Phonemic Awareness", and a golden yellow badge shows "[Theme/Value from book]". Badges have soft shadows and playful styling with [seasonal/environmental elements]. Full frame. No text overlays. Clean illustration only.

### Page Format for Rhyming Pages (Pages 3-12)'
  ),
  what_changed = 'Added explicit educational focus page format with three-badge layout',
  last_modified = now()
WHERE type = 'book-creation-rhyming' AND is_latest = true;