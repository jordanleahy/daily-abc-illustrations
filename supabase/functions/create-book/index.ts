/**
 * Create Book Edge Function
 * 
 * This function implements a specialized Book Creation Agent that:
 * - Takes conversation history as context
 * - Uses AI to extract relevant learning concepts from the conversation
 * - Generates structured book and pages data as JSON
 * - Saves the book and appropriate number of pages directly to the database
 * - Returns the created book ID for navigation
 * 
 * Purpose:
 * - Convert educational conversations into structured learning books
 * - Generate age-appropriate content based on conversation themes
 * - Create consistent, themed learning materials with flexible page counts
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
import { corsHeaders, isLegacyModel } from '../_shared/types.ts';

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

    // Fetch the user's Book Creation Agent configuration
    console.log('Fetching Book Creation Agent configuration for user:', userId);
    const { data: agentConfig, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'book-creation')
      .eq('is_latest', true)
      .maybeSingle();

    if (agentError) {
      console.error('Error fetching agent config:', agentError);
      throw new Error(`Failed to fetch Book Creation Agent configuration: ${agentError.message}`);
    }

    if (!agentConfig) {
      throw new Error('No Book Creation Agent configuration found for user. Please configure your agent first.');
    }

    // Validate agent configuration data
    if (!agentConfig.instructions || typeof agentConfig.instructions !== 'string') {
      throw new Error('Invalid agent configuration: missing or invalid instructions');
    }

    if (!agentConfig.model || typeof agentConfig.model !== 'string') {
      throw new Error('Invalid agent configuration: missing or invalid model');
    }

    // Additional security: verify user ownership (defense in depth)
    if (agentConfig.user_id !== userId) {
      throw new Error('Unauthorized: Agent configuration does not belong to user');
    }

    console.log('Using agent configuration:', {
      id: agentConfig.id,
      name: agentConfig.name,
      model: agentConfig.model,
      version: agentConfig.version
    });

    // Prepare conversation context for the Book Creation Agent
    const conversationContext = conversationHistory
      ?.map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n') || '';

    // Append conversation context and JSON output requirements to agent's instructions
    const conversationAndFormatRequirements = `

CONVERSATION CONTEXT:
${conversationContext}

REQUIRED OUTPUT FORMAT (JSON only, no other text):
{
  "book": {
    "book_name": "Creative title based on the conversation theme",
    "category": "Educational category (e.g., Animals, Science, Nature, etc.)",
    "book_description": "Brief description of what children will learn",
    "total_pages": 15
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
    // ... create pages for letters relevant to the conversation theme
  ]
}

IMPORTANT: Analyze the conversation and determine how many letters have meaningful, distinct concepts to teach. Create pages only for letters that have substantial educational content related to the conversation theme. This could be anywhere from 10-26 pages depending on the conversation scope.

CRITICAL: Return ONLY valid JSON, no additional text.`;

    const bookCreationPrompt = agentConfig.instructions + conversationAndFormatRequirements;

    console.log('Calling OpenAI API for book generation with model:', agentConfig.model);

    // Prepare OpenAI API parameters based on model
    const apiParams: any = {
      model: agentConfig.model,
      messages: [
        { 
          role: 'system', 
          content: bookCreationPrompt 
        },
        { 
          role: 'user', 
          content: 'Please create the book based on our conversation.' 
        }
      ],
      response_format: { type: "json_object" }, // Force JSON mode
    };

    // Use correct token parameter based on model
    if (isLegacyModel(agentConfig.model)) {
      apiParams.max_tokens = agentConfig.max_completion_tokens;
    } else {
      apiParams.max_completion_tokens = agentConfig.max_completion_tokens;
    }

    // Add top_p if it's not the default
    if (agentConfig.top_p && agentConfig.top_p !== 1.0) {
      apiParams.top_p = agentConfig.top_p;
    }

    console.log('OpenAI API parameters:', apiParams);

    // Call OpenAI API with the Book Creation Agent's configuration
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiParams),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = await response.json();
    console.log('Full AI response:', JSON.stringify(aiResponse, null, 2));
    
    const generatedContent = aiResponse.choices?.[0]?.message?.content;
    const finishReason = aiResponse.choices?.[0]?.finish_reason;
    
    console.log('AI response received, parsing JSON...');
    console.log('Raw AI response content:', generatedContent);
    console.log('Response length:', generatedContent?.length || 0);
    console.log('Finish reason:', finishReason);

    // Check for empty or null content
    if (!generatedContent || generatedContent.trim().length === 0) {
      console.error('OpenAI returned empty content. Full response:', JSON.stringify(aiResponse, null, 2));
      throw new Error(`OpenAI returned empty content. Finish reason: ${finishReason}. This may be due to content filtering or model issues.`);
    }

    // Parse the JSON response
    let bookData;
    try {
      // Since we forced JSON mode, try direct parsing first
      bookData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying extraction...');
      
      // Try to extract JSON if the response contains other text
      let jsonContent = generatedContent;
      
      // Look for JSON block markers and extract content
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
        console.log('Extracted JSON from markdown block');
      } else {
        // Try to find JSON object boundaries
        const startBrace = generatedContent.indexOf('{');
        const lastBrace = generatedContent.lastIndexOf('}');
        if (startBrace !== -1 && lastBrace !== -1 && lastBrace > startBrace) {
          jsonContent = generatedContent.slice(startBrace, lastBrace + 1);
          console.log('Extracted JSON from object boundaries');
        }
      }
      
      try {
        console.log('Attempting to parse extracted JSON content:', jsonContent.substring(0, 200) + '...');
        bookData = JSON.parse(jsonContent);
      } catch (secondParseError) {
        console.error('Failed to parse AI response as JSON. Full response:', generatedContent);
        console.error('Parse error:', secondParseError.message);
        throw new Error(`AI response was not valid JSON: ${secondParseError.message}. Response: ${generatedContent.substring(0, 500)}`);
      }
    }

    // Validate the structure
    if (!bookData.book || !bookData.pages || !Array.isArray(bookData.pages) || bookData.pages.length === 0) {
      console.error('Invalid book data structure:', bookData);
      throw new Error('Generated book data is incomplete or invalid');
    }

    // Validate that total_pages matches actual pages count
    if (bookData.book.total_pages !== bookData.pages.length) {
      console.error('Page count mismatch:', { declared: bookData.book.total_pages, actual: bookData.pages.length });
      throw new Error('Book total_pages does not match actual number of pages generated');
    }

    console.log('Book data validated, saving to database...');
    console.log('AI determined page count:', bookData.pages.length, 'pages for theme:', bookData.book.book_name);

    // Save the book to the database
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        book_name: bookData.book.book_name,
        category: bookData.book.category,
        book_description: bookData.book.book_description,
        total_pages: bookData.book.total_pages,
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

    // Create a draft daily_published entry for SEO generation
    console.log('Creating draft daily_published entry for book:', book.id);
    const { data: draftPublication, error: draftError } = await supabase
      .from('daily_published')
      .insert({
        book_id: book.id,
        title: book.book_name,
        description: book.book_description || `Educational content featuring ${book.book_name}`,
        status: 'draft',
        is_active: false,
        queue_position: null,
        published_at: new Date().toISOString(), // Set to current time but inactive
        expires_at: null // No expiration for draft entries
      })
      .select()
      .single();

    if (draftError) {
      console.error('Error creating draft daily_published entry:', draftError);
      // Continue without failing the book creation
    } else {
      console.log('Draft daily_published entry created:', draftPublication.id);
    }

    // Generate initial SEO metadata in background (non-blocking) with daily_published_id
    const generateSEOPromise = supabase.functions.invoke('generate-seo-metadata', {
      body: {
        bookId: book.id,
        contentTitle: book.book_name,
        bookDescription: book.book_description,
        userId: userId,
        dailyPublishedId: draftPublication?.id // Pass the draft daily_published_id
      }
    }).then(result => {
      if (result.error) {
        console.error('SEO generation failed:', result.error);
      } else {
        console.log('SEO metadata generated successfully for book:', book.id, 'with daily_published_id:', draftPublication?.id);
      }
    }).catch(error => {
      console.error('SEO generation error:', error);
    });

    // Use EdgeRuntime.waitUntil for background processing
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(generateSEOPromise);
    }

    return new Response(
      JSON.stringify({
        success: true,
        bookId: book.id,
        message: `"${book.book_name}" has been created with ${book.total_pages} pages! You can now view your book.`,
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