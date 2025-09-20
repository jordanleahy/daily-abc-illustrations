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
    const { bookId, userId } = await req.json();

    if (!bookId || !userId) {
      throw new Error('Missing required parameters: bookId, userId');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Fetch book data
    const { data: book, error } = await supabase
      .from('books')
      .select('book_name, category, book_description')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (error || !book) {
      throw new Error('Book not found or access denied');
    }

    // Create simple prompt
    const prompt = `Create a thumbnail image prompt for "${book.book_name}", a ${book.category || 'children\'s book'}. 
${book.book_description ? `Description: ${book.book_description}` : ''}

Focus on visual composition and design elements that work well for social media thumbnails. Ensure the main title text is prominently centered in the middle of the composition. Include clear typography, engaging visuals, and appropriate colors for the target audience. The text should be the focal point positioned in the center of the image. Avoid mentioning specific pixel dimensions.`;

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 1000,
        messages: [
          { 
            role: 'system', 
            content: 'Generate concise image prompts for book thumbnails. Focus on visual design, composition, and readability at small sizes. Do not include technical specifications or pixel dimensions.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const generatedPrompt = data?.choices?.[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      throw new Error('Failed to generate prompt');
    }

    // Apply safe space rules for 3:2 aspect ratio
    const enhancedPrompt = appendSafeSpaceRules(generatedPrompt, '3:2');

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailPrompt: enhancedPrompt,
        originalPrompt: generatedPrompt,
        bookId,
        aspectRatio: '3:2'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});