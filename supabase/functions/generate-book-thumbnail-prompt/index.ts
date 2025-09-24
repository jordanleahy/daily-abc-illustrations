import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { appendSafeSpaceRules } from '../_shared/safeSpaceConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Generate Book Thumbnail Prompt Function Started ===');
    
    // Log incoming request details
    const requestBody = await req.json();
    const { bookId, userId } = requestBody;
    console.log('Request parameters:', { bookId, userId, hasAuth: !!req.headers.get('Authorization') });

    // Validate required parameters
    if (!bookId || !userId) {
      console.error('Missing required parameters:', { bookId: !!bookId, userId: !!userId });
      throw new Error('Missing required parameters: bookId, userId');
    }

    // Check OpenAI API key availability (without logging the actual key)
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key available:', !!openAIApiKey);
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured in environment');
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    console.log('Supabase config available:', { url: !!supabaseUrl, key: !!supabaseAnonKey });
    
    const supabase = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    console.log('Fetching book data for bookId:', bookId);
    
    // Fetch book data
    const { data: book, error } = await supabase
      .from('books')
      .select('book_name, category, book_description')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!book) {
      console.error('Book not found or access denied for:', { bookId, userId });
      throw new Error('Book not found or access denied');
    }

    console.log('Book data retrieved:', { 
      name: book.book_name, 
      category: book.category, 
      hasDescription: !!book.book_description 
    });

    // Create simple prompt
    const prompt = `Create a thumbnail image prompt for "${book.book_name}", a ${book.category || 'children\'s book'}. 
${book.book_description ? `Description: ${book.book_description}` : ''}

Focus on visual composition and design elements that work well for social media thumbnails. Ensure the main title text is prominently centered in the middle of the composition. Include clear typography, engaging visuals, and appropriate colors for the target audience. The text should be the focal point positioned in the center of the image. Avoid mentioning specific pixel dimensions.`;

    console.log('Generated prompt length:', prompt.length);

    // Prepare OpenAI request
    const openAIRequest = {
      model: 'gpt-5-nano-2025-08-07',
      max_completion_tokens: 4000,
      messages: [
        { 
          role: 'system', 
          content: 'Generate concise image prompts for book thumbnails. Focus on visual design, composition, and readability at small sizes. Do not include technical specifications or pixel dimensions.' 
        },
        { role: 'user', content: prompt }
      ],
    };

    console.log('Making OpenAI API call with:', { 
      model: openAIRequest.model, 
      max_completion_tokens: openAIRequest.max_completion_tokens,
      messagesCount: openAIRequest.messages.length 
    });

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAIRequest),
    });

    console.log('OpenAI response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('OpenAI API error response:', errorData);
      } catch (parseError) {
        console.error('Failed to parse OpenAI error response:', parseError);
        errorData = { error: { message: `HTTP ${response.status}: ${response.statusText}` } };
      }
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', { 
      hasChoices: !!data.choices, 
      choicesLength: data.choices?.length,
      hasContent: !!data.choices?.[0]?.message?.content 
    });

    const generatedPrompt = data?.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      console.error('No content generated from OpenAI response:', data);
      throw new Error('Failed to generate prompt - no content in response');
    }

    console.log('Generated prompt length:', generatedPrompt.length);

    // Apply safe space rules for 3:2 aspect ratio
    const enhancedPrompt = appendSafeSpaceRules(generatedPrompt, '3:2');
    console.log('Enhanced prompt with safe space rules applied');

    const successResponse = {
      success: true, 
      thumbnailPrompt: enhancedPrompt,
      originalPrompt: generatedPrompt,
      bookId,
      aspectRatio: '3:2'
    };

    console.log('=== Function completed successfully ===');
    
    return new Response(
      JSON.stringify(successResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== Function error ===');
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResponse = { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});