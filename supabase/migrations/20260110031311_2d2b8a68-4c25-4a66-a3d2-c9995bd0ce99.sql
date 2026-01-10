-- Update Sight Words agent to use sentence case instead of all caps for sight words
UPDATE agents 
SET 
  instructions = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              instructions,
              'The title includes:
1. The sight word (capitalized for emphasis)
2. A simple sentence using the word in context',
              'The title includes:
1. The sight word (in sentence case, not all caps)
2. A simple sentence using the word in context'
            ),
            '**Page 3: THE - "Look at THE big red ball!"**',
            '**Page 3: The - "Look at the big red ball!"**'
          ),
          '**Page 4: SEE - "I SEE a fluffy white cloud!"**',
          '**Page 4: See - "I see a fluffy white cloud!"**'
        ),
        '**Page 5: CAN - "I CAN jump so high!"**',
        '**Page 5: Can - "I can jump so high!"**'
      ),
      'sight word (capitalized for emphasis)',
      'sight word (in sentence case, not all caps)'
    ),
    'The sight word should be naturally highlighted in the page title',
    'The sight word should appear naturally in sentence case (not all caps)'
  ),
  last_modified = NOW()
WHERE type = 'book-creation-sight-words' AND is_latest = true;