import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { GRAPHIC_DESIGNER_AGENT_CONFIG } from '../../../src/types/agent.ts';

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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    const { pageId, userId, styleGuide } = await req.json();

    if (!pageId || !userId || !styleGuide) {
      throw new Error('Missing required parameters: pageId, userId, or styleGuide');
    }

    console.log('Generating image prompt for page:', pageId);

    // Fetch the specific page data
    const { data: pageData, error: pageError } = await supabaseClient
      .from('pages')
      .select(`
        id,
        letter,
        title,
        description,
        content,
        book_id,
        books!inner(user_id)
      `)
      .eq('id', pageId)
      .single();

    if (pageError) {
      console.error('Error fetching page:', pageError);
      throw new Error(`Failed to fetch page: ${pageError.message}`);
    }

    if (!pageData || pageData.books.user_id !== userId) {
      throw new Error('Page not found or access denied');
    }

    // Prepare the content for the AI
    const pageContent = `
Letter: ${pageData.letter}
Title: ${pageData.title}
Description: ${pageData.description || 'No description'}
Content: ${JSON.stringify(pageData.content, null, 2)}
    `.trim();

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Calling OpenAI API for image prompt generation...');

    // Call OpenAI API using the Graphic Designer Agent configuration
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GRAPHIC_DESIGNER_AGENT_CONFIG.modelSettings.model,
        max_completion_tokens: GRAPHIC_DESIGNER_AGENT_CONFIG.modelSettings.maxCompletionTokens,
        top_p: GRAPHIC_DESIGNER_AGENT_CONFIG.modelSettings.topP,
        messages: [
          {
            role: 'system',
            content: `${GRAPHIC_DESIGNER_AGENT_CONFIG.instructions}

STYLE GUIDE:
${styleGuide}`
          },
          {
            role: 'user',
            content: `Create a detailed image prompt for this ABC book page:

${pageContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const imagePrompt = data.choices[0].message.content;

    console.log('Image prompt generated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        imagePrompt,
        pageId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-image-prompt function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});