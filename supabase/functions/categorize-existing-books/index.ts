import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { VALID_BOOK_TYPES, normalizeBookType, corsHeaders } from '../_shared/types.ts';

// Mapping rules for common patterns
const CATEGORIZATION_RULES = {
  abc: ['abc', 'alphabet', 'letters', 'a-z'],
  numbers: ['123', 'numbers', 'counting', 'math', '1-10'],
  shapes: ['shapes', 'geometry', 'circle', 'square', 'triangle'],
  colors: ['colors', 'colours', 'rainbow', 'red', 'blue', 'green'],
  rhyming: ['rhyming', 'rhyme', 'poetry', 'verse'],
  opposites: ['opposites', 'opposite', 'antonyms'],
  emotions: ['emotions', 'feelings', 'happy', 'sad', 'angry'],
  animals: ['animals', 'farm', 'zoo', 'pets', 'wildlife', 'creatures'],
  'first-words': ['first words', 'vocabulary', 'words', 'baby words'],
  bedtime: ['bedtime', 'sleep', 'night', 'dreams', 'goodnight'],
  cvc: ['cvc', 'phonics', '3-letter', 'consonant vowel'],
  'sight-words': ['sight words', 'dolch', 'fry words', 'high frequency'],
};

interface CategorizationPreview {
  book_id: string;
  book_name: string;
  current_category: string | null;
  current_book_type: string | null;
  proposed_book_type: string;
  confidence_score: number;
  reasoning: string;
  needs_review: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin role using RLS-safe function
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: hasAdminRole, error: roleError } = await supabaseClient
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !hasAdminRole) {
      throw new Error('Admin access required');
    }

    console.log('[categorize-existing-books] Starting categorization preview...');

    // Fetch all books
    const { data: books, error: booksError } = await supabaseClient
      .from('books')
      .select('id, book_name, book_description, category, metadata')
      .order('created_at', { ascending: false });

    if (booksError) throw booksError;

    const previews: CategorizationPreview[] = [];

    for (const book of books) {
      const currentBookType = book.metadata?.bookType;
      
      // Skip if already has valid bookType
      if (currentBookType && VALID_BOOK_TYPES.includes(currentBookType)) {
        continue;
      }

      // Categorize based on book name and category
      const result = categorizeBook(book.book_name, book.category, book.book_description);
      
      previews.push({
        book_id: book.id,
        book_name: book.book_name,
        current_category: book.category,
        current_book_type: currentBookType || null,
        proposed_book_type: result.bookType,
        confidence_score: result.confidence,
        reasoning: result.reasoning,
        needs_review: result.confidence < 0.9,
      });
    }

    console.log(`[categorize-existing-books] Generated ${previews.length} categorization previews`);

    return new Response(
      JSON.stringify({
        success: true,
        total_books: books.length,
        books_needing_categorization: previews.length,
        high_confidence_count: previews.filter(p => p.confidence_score >= 0.9).length,
        needs_review_count: previews.filter(p => p.needs_review).length,
        previews,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[categorize-existing-books] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function categorizeBook(
  bookName: string, 
  category: string | null, 
  description: string | null
): { bookType: string; confidence: number; reasoning: string } {
  const searchText = `${bookName} ${category || ''} ${description || ''}`.toLowerCase();
  
  // Try pattern matching
  for (const [bookType, patterns] of Object.entries(CATEGORIZATION_RULES)) {
    for (const pattern of patterns) {
      if (searchText.includes(pattern.toLowerCase())) {
        return {
          bookType,
          confidence: 0.95,
          reasoning: `Matched pattern "${pattern}" in book name/description`,
        };
      }
    }
  }
  
  // Default to 'other' with low confidence
  return {
    bookType: 'other',
    confidence: 0.3,
    reasoning: 'No clear pattern match - defaulted to "other"',
  };
}
