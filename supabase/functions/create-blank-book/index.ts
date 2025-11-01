/**
 * Create Blank Book Edge Function
 * 
 * This function creates a blank ABC book template with:
 * - Standard 26-page A-Z structure with placeholder content
 * - Immediate editing capability without AI conversation
 * - Safe default content for educational use
 * - Proper database structure matching AI-generated books
 * 
 * Usage:
 * POST request with body: {
 *   "bookName": string,
 *   "category": string (optional),
 *   "userId": string
 * }
 * 
 * Returns:
 * - Success: { "success": true, "bookId": "uuid", "message": "Book template created" }
 * - Error: { "success": false, "error": "Error description" }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

// Generate placeholder content for each letter
function generatePlaceholderContent(letter: string) {
  const examples = {
    'A': { concept: 'Apple', fact: 'Apples are fruits that grow on trees and come in many colors like red, green, and yellow.', activity: 'Draw your favorite apple and name three things that start with A.' },
    'B': { concept: 'Butterfly', fact: 'Butterflies taste with their feet and smell with their antennae.', activity: 'Count how many butterflies you can find in your garden or a book.' },
    'C': { concept: 'Cat', fact: 'Cats can make over 100 different vocal sounds, while dogs can only make about 10.', activity: 'Act like different animals and guess which ones start with C.' },
    'D': { concept: 'Dog', fact: 'Dogs have an amazing sense of smell that is 10,000 times stronger than humans.', activity: 'List five things dogs can do to help people.' },
    'E': { concept: 'Elephant', fact: 'Elephants are the largest land animals and can weigh as much as four cars.', activity: 'Use your arm like an elephant trunk and try to pick up small objects.' },
    'F': { concept: 'Fish', fact: 'Fish breathe underwater using gills instead of lungs like we do.', activity: 'Make fish movements and pretend to swim around the room.' },
    'G': { concept: 'Giraffe', fact: 'Giraffes are the tallest animals in the world and have purple tongues.', activity: 'Stretch up high like a giraffe reaching for leaves in tall trees.' },
    'H': { concept: 'Horse', fact: 'Horses can sleep both lying down and standing up.', activity: 'Practice horse movements like galloping, trotting, and prancing.' },
    'I': { concept: 'Ice Cream', fact: 'Ice cream was first made over 2,000 years ago using snow and fruit.', activity: 'Design your own ice cream flavor and draw what it would look like.' },
    'J': { concept: 'Jellyfish', fact: 'Jellyfish are made of 95% water and have been around for millions of years.', activity: 'Move like a floating jellyfish and practice the letter J motion.' },
    'K': { concept: 'Kangaroo', fact: 'Kangaroos cannot walk backwards and carry their babies in pouches.', activity: 'Hop around like a kangaroo and see how far you can jump.' },
    'L': { concept: 'Lion', fact: 'Lions are called the king of the jungle, but they actually live in grasslands.', activity: 'Practice your loudest lion roar and mane shaking movements.' },
    'M': { concept: 'Mouse', fact: 'Mice are excellent climbers and can jump up to 12 inches high.', activity: 'Move quietly like a mouse and find small spaces to explore.' },
    'N': { concept: 'Nest', fact: 'Birds build nests using twigs, leaves, and sometimes even trash to make homes.', activity: 'Build your own nest using pillows, blankets, or outdoor materials.' },
    'O': { concept: 'Ocean', fact: 'The ocean covers more than 70% of Earth and contains amazing creatures.', activity: 'Pretend to dive deep in the ocean and discover sea creatures.' },
    'P': { concept: 'Penguin', fact: 'Penguins are birds that cannot fly but are excellent swimmers.', activity: 'Waddle like a penguin and slide on your belly across smooth surfaces.' },
    'Q': { concept: 'Queen', fact: 'Queens in history have ruled kingdoms and made important decisions for their people.', activity: 'Create a crown and practice royal waves and kind leadership.' },
    'R': { concept: 'Rainbow', fact: 'Rainbows appear when sunlight shines through water droplets in the air.', activity: 'Name all the colors in a rainbow and find objects of each color.' },
    'S': { concept: 'Sun', fact: 'The Sun is a star that gives us light and warmth every day.', activity: 'Stretch your arms like sun rays and practice sunny, happy movements.' },
    'T': { concept: 'Tree', fact: 'Trees make oxygen for us to breathe and can live for hundreds of years.', activity: 'Stand tall like a tree and sway gently like branches in the wind.' },
    'U': { concept: 'Umbrella', fact: 'Umbrellas protect us from rain and sun, and some are made from bamboo.', activity: 'Open and close an imaginary umbrella and practice walking in pretend rain.' },
    'V': { concept: 'Violin', fact: 'Violins make beautiful music and are played with a special bow.', activity: 'Pretend to play violin and create your own musical movements.' },
    'W': { concept: 'Whale', fact: 'Whales are the largest animals on Earth and sing songs to communicate.', activity: 'Make whale sounds and move like you are swimming through the ocean.' },
    'X': { concept: 'X-ray', fact: 'X-rays help doctors see inside our bodies to check our bones.', activity: 'Point to different bones in your body and practice making X shapes.' },
    'Y': { concept: 'Yo-yo', fact: 'Yo-yos are ancient toys that go up and down on a string.', activity: 'Practice up and down movements and try to balance like a yo-yo.' },
    'Z': { concept: 'Zebra', fact: 'Every zebra has a unique pattern of stripes, just like human fingerprints.', activity: 'Draw zebra stripes and practice galloping like you are in the wild.' }
  };

  const content = examples[letter as keyof typeof examples];
  return {
    mainConcept: content.concept,
    funFact: content.fact,
    activity: content.activity
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookName, category, userId } = await req.json();
    
    console.log('Creating blank book template for user:', userId);
    console.log('Book details:', { bookName, category });

    // Validate required parameters
    if (!userId || !bookName) {
      throw new Error('Missing required parameters: userId and bookName are required');
    }

    // Validate and sanitize inputs
    const sanitizedBookName = bookName.trim();
    const sanitizedCategory = category?.trim() || 'General';

    if (sanitizedBookName.length < 1 || sanitizedBookName.length > 100) {
      throw new Error('Book name must be between 1 and 100 characters');
    }

    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Creating book with template structure...');

    // Create the book record
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: sanitizedBookName,
        category: sanitizedCategory,
        book_description: `An ABC learning book about ${sanitizedBookName.toLowerCase()}. Each page features engaging content and activities for young learners.`,
        total_pages: 27, // Cover + 26 pages
        status: 'draft'
      })
      .select()
      .single();

    if (bookError) {
      console.error('Error creating book:', bookError);
      throw new Error(`Failed to create book: ${bookError.message}`);
    }

    console.log('Book created with ID:', book.id);

    // Create cover page first (page_number 0)
    const coverPage = {
      book_id: book.id,
      letter: 'Cover',
      page_number: 0,
      title: sanitizedBookName,
      description: `An ABC learning book about ${sanitizedBookName.toLowerCase()}. Each page features engaging content and activities for young learners.`,
      content: {
        mainConcept: sanitizedBookName,
        funFact: `An ABC learning book about ${sanitizedBookName.toLowerCase()}`,
        activity: ''
      }
    };

    // Generate 26 pages (A-Z) with empty content for user to fill in
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const pagesData = [
      coverPage,
      ...alphabet.map((letter, index) => {
        return {
          book_id: book.id,
          letter: letter,
          page_number: index + 1,
          title: `${letter}`,
          description: null,
          content: {
            mainConcept: '',
            funFact: '',
            activity: ''
          }
        };
      })
    ];

    // Save all pages to the database
    const { error: pagesError } = await supabase
      .from('pages')
      .insert(pagesData);

    if (pagesError) {
      console.error('Error creating pages:', pagesError);
      // Clean up the book if page creation fails
      await supabase.from('books').delete().eq('id', book.id);
      throw new Error(`Failed to create pages: ${pagesError.message}`);
    }

    console.log('Cover page and 26 content pages created successfully');

    // Create a draft daily_published entry
    console.log('Creating draft daily_published entry for book:', book.id);
    const { data: draftPublication, error: draftError } = await supabase
      .from('daily_published')
      .insert({
        book_id: book.id,
        title: book.book_name,
        description: book.book_description,
        status: 'draft',
        is_active: false,
        queue_position: null,
        published_at: new Date().toISOString(),
        expires_at: null
      })
      .select()
      .single();

    if (draftError) {
      console.error('Error creating draft daily_published entry:', draftError);
      // Continue without failing the book creation
    } else {
      console.log('Draft daily_published entry created:', draftPublication.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookId: book.id,
        message: `"${book.book_name}" template has been created with cover page and 26 content pages! You can now start editing your content.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-blank-book function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});