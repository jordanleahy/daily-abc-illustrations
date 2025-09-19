import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { pageId, userId } = await req.json();
    console.log('Processing simplify-image-prompt request:', { pageId, userId });

    if (!pageId || !userId) {
      throw new Error('Missing required parameters: pageId and userId');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the latest page system prompt
    const { data: systemPrompt, error: systemPromptError } = await supabase
      .from('page_system_prompts')
      .select('content, id')
      .eq('page_id', pageId)
      .eq('is_latest', true)
      .single();

    if (systemPromptError || !systemPrompt) {
      throw new Error(`Failed to fetch system prompt: ${systemPromptError?.message || 'No system prompt found'}`);
    }

    console.log('Found system prompt, length:', systemPrompt.content.length);

    // Get page details for context
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('letter, title, description')
      .eq('id', pageId)
      .single();

    if (pageError || !page) {
      throw new Error(`Failed to fetch page details: ${pageError?.message || 'Page not found'}`);
    }

    // Create simplified prompt using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const simplificationPrompt = `You are an expert at distilling complex system prompts into concise image generation prompts optimized for AI image models like gpt-image-1.

Your task: Extract and distill the visual elements from this full system prompt into a focused 500-1500 character image generation prompt.

FOCUS ON:
- Visual descriptions, art styles, colors, lighting
- Character appearances, poses, expressions
- Scene composition, backgrounds, environments
- Artistic techniques, perspectives, moods

REMOVE:
- Meta-instructions about prompt structure
- Explanations of how to use the prompt
- Redundant descriptive phrases
- Non-visual narrative elements
- Technical formatting instructions

PAGE CONTEXT:
Letter: ${page.letter}
Title: ${page.title}
Description: ${page.description}

FULL SYSTEM PROMPT TO SIMPLIFY:
${systemPrompt.content}

Return ONLY the simplified image prompt, optimized for visual generation. Keep it between 500-1500 characters.`;

    console.log('Calling OpenAI for prompt simplification...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert at distilling complex prompts into concise, visual-focused image generation prompts.' },
          { role: 'user', content: simplificationPrompt }
        ],
        max_tokens: 800,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const simplifiedContent = data.choices[0].message.content.trim();
    
    console.log('Generated simplified prompt, length:', simplifiedContent.length);

    // Get next version number
    const { data: versionData } = await supabase
      .rpc('get_next_simplified_prompt_version_number', { p_page_id: pageId });
    
    const versionNumber = versionData || 1;

    // Get book_id for the page
    const { data: bookData, error: bookError } = await supabase
      .from('pages')
      .select('book_id')
      .eq('id', pageId)
      .single();

    if (bookError || !bookData) {
      throw new Error(`Failed to fetch book_id: ${bookError?.message}`);
    }

    // Save the simplified prompt
    const { data: savedPrompt, error: saveError } = await supabase
      .from('page_simplified_prompts')
      .insert({
        page_id: pageId,
        book_id: bookData.book_id,
        user_id: userId,
        simplified_content: simplifiedContent,
        source_prompt_id: systemPrompt.id,
        version_number: versionNumber,
        generation_status: 'complete',
        generation_started_at: new Date().toISOString(),
        generation_completed_at: new Date().toISOString(),
        is_latest: true
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save simplified prompt: ${saveError.message}`);
    }

    console.log('Successfully saved simplified prompt with id:', savedPrompt.id);

    return new Response(JSON.stringify({ 
      success: true, 
      simplifiedPrompt: savedPrompt,
      message: 'Image prompt simplified successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in simplify-image-prompt function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});