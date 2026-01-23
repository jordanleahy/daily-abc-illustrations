UPDATE agents 
SET 
  instructions = REPLACE(
    REPLACE(
      instructions,
      '**Page N: [Title]**
- **Rhyme Pair:** [word1] / [word2]
- **Rhyme Text:**',
      '**Page N: [Word1] rhymes with [Word2]**
- **Rhyme Text:**'
    ),
    '**Page 3: The Cozy Cat**
- **Rhyme Pair:** mat / hat
- **Rhyme Text:**',
    '**Page 3: Mat rhymes with Hat**
- **Rhyme Text:**'
  ),
  what_changed = 'Changed page title format to "[Word1] rhymes with [Word2]" - rhyme pair now in title',
  last_modified = now()
WHERE type = 'book-creation-rhyming' AND is_latest = true;