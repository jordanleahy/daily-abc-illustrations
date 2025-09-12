/**
 * Create Book Edge Function
 * 
 * This function implements a specialized Book Creation Agent that:
 * - Takes conversation history as context
 * - Uses AI to extract A-Z learning concepts from the conversation
 * - Generates structured book and pages data as JSON
 * - Saves the book and all 26 pages directly to the database
 * - Returns the created book ID for navigation
 * 
 * Purpose:
 * - Convert educational conversations into structured ABC books
 * - Generate age-appropriate content for each letter A-Z
 * - Create consistent, themed learning materials
 * - Provide seamless integration with the chat interface
 * 
 * Usage:
 * POST request with body: {
 *   "conversationHistory": Message[],
 *   "userId": string
 * }
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * 
 * Returns:
 * - Success: { "success": true, "bookId": "uuid", "message": "Book created successfully" }
 * - Error: { "success": false, "error": "Error description" }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationHistory, userId } = await req.json();
    
    console.log('Creating book for user:', userId);
    console.log('Conversation history length:', conversationHistory?.length || 0);

    // Validate required environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare conversation context for the Book Creation Agent
    const conversationContext = conversationHistory
      ?.map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n') || '';

    // Book Creation Agent system prompt
    const bookCreationPrompt = `You are a specialized Book Creation Agent that converts educational conversations into structured ABC books for children.

TASK: Analyze the conversation and create a themed ABC book with exactly 26 pages (A-Z).

CONVERSATION CONTEXT:
${conversationContext}

REQUIREMENTS:
1. Extract the main educational theme from the conversation
2. Create a book title and description based on the theme
3. Generate exactly 26 pages, one for each letter A-Z
4. Each page should be age-appropriate and educational
5. Content should be consistent with the conversation theme

OUTPUT FORMAT (JSON only, no other text):
{
  "book": {
    "book_name": "Creative title based on the conversation theme",
    "category": "Educational category (e.g., Animals, Science, Nature, etc.)",
    "book_description": "Brief description of what children will learn",
    "total_pages": 26
  },
  "pages": [
    {
      "letter": "A",
      "page_number": 1,
      "title": "Creative title starting with A",
      "description": "Brief description of the concept",
      "content": {
        "mainConcept": "Primary learning concept for A",
        "funFact": "Interesting fact about the concept",
        "activity": "Simple activity or question for engagement"
      }
    }
    // ... repeat for all 26 letters A-Z
  ]
}

IMPORTANT: 
- Generate exactly 26 pages (A-Z)
- Keep content age-appropriate for young children
- Make it educational and engaging
- Ensure consistency with the conversation theme
- Return ONLY valid JSON, no additional text`;

    console.log('Calling OpenAI API for book generation...');

    // Call OpenAI API with the Book Creation Agent
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: bookCreationPrompt 
          },
          { 
            role: 'user', 
            content: 'Please create the ABC book based on our conversation.' 
          }
        ],
        max_completion_tokens: 4000,
        top_p: 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;
    
    console.log('AI response received, parsing JSON...');

    // Parse the JSON response
    let bookData;
    try {
      bookData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', generatedContent);
      throw new Error('AI response was not valid JSON');
    }

    // Validate the structure
    if (!bookData.book || !bookData.pages || bookData.pages.length !== 26) {
      console.error('Invalid book data structure:', bookData);
      throw new Error('Generated book data is incomplete or invalid');
    }

    console.log('Book data validated, saving to database...');

    // Save the book to the database
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: bookData.book.book_name,
        category: bookData.book.category,
        book_description: bookData.book.book_description,
        total_pages: bookData.book.total_pages,
        is_published: false,
      })
      .select()
      .single();

    if (bookError) {
      console.error('Error creating book:', bookError);
      throw new Error(`Failed to create book: ${bookError.message}`);
    }

    console.log('Book created with ID:', book.id);

    // Prepare pages data with book_id
    const pagesData = bookData.pages.map((page: any, index: number) => ({
      book_id: book.id,
      letter: page.letter,
      page_number: index + 1,
      title: page.title,
      description: page.description,
      content: page.content,
    }));

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

    console.log('All pages created successfully');

    return new Response(
      JSON.stringify({
        success: true,
        bookId: book.id,
        message: `"${book.book_name}" has been created with 26 pages! You can now view your book.`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in create-book function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});