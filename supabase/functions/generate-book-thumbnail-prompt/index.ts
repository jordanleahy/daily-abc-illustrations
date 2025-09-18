import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { safeSpaceConfig } from '../_shared/safeSpaceConfig.ts';

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
    const { bookId, userId } = await req.json();

    if (!bookId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bookId and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching book data for:', bookId);

    // Fetch book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('book_name, book_description, category, current_system_prompt_id')
      .eq('id', bookId)
      .eq('user_id', userId)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch book details' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Book data:', book);

    // Fetch book system prompt for style consistency
    let styleGuide = '';
    if (book.current_system_prompt_id) {
      const { data: systemPrompt } = await supabase
        .from('book_system_prompts')
        .select('content')
        .eq('id', book.current_system_prompt_id)
        .single();

      if (systemPrompt?.content) {
        // Extract style information from the system prompt
        const styleMatch = systemPrompt.content.match(/illustration style[^.]*[.]/i);
        if (styleMatch) {
          styleGuide = `Maintain consistency with the book's existing ${styleMatch[0]}`;
        }
      }
    }

    // Get Graphics Designer Agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('instructions, model')
      .eq('user_id', userId)
      .eq('type', 'graphics_designer')
      .eq('is_latest', true)
      .single();

    if (agentError) {
      console.log('No graphics designer agent found, using default');
    }

    const agentInstructions = agent?.instructions || 'Create professional, child-friendly educational illustrations.';

    // Create thumbnail-specific prompt
    const basePrompt = `Create a book cover thumbnail image for "${book.book_name}".

Book Description: ${book.book_description || 'Educational ABC book for children'}
Category: ${book.category || 'Educational'}

Requirements:
- Aspect ratio: 1200x630 pixels (perfect for social media sharing)
- Book title should be prominently displayed and readable
- Include visual elements that represent the book's educational content
- Design should be appealing to both children and parents
- Professional, clean design suitable for thumbnails
- ${styleGuide}

Design Style: ${agentInstructions}

The thumbnail should work well at small sizes and clearly communicate what the book is about.`;

    // Apply safe space rules for the 19:10 aspect ratio (1200:630)
    function appendSafeSpaceRules(prompt: string, aspectRatio: string): string {
      const rules = safeSpaceConfig.aspectRatios[aspectRatio as keyof typeof safeSpaceConfig.aspectRatios];
      if (!rules || !safeSpaceConfig.enabled) return prompt;

      const safeSpaceInstructions = `
SAFE SPACE GUIDELINES for ${aspectRatio} aspect ratio:
- Text Placement: ${rules.textPlacement}
- Logo/Branding: ${rules.logoPlacement}
- Critical Elements: ${rules.criticalElements}
- Social Media: ${rules.socialMediaConsiderations}

${safeSpaceConfig.generalGuidelines.textReadability}
${safeSpaceConfig.generalGuidelines.platformCompatibility}`;

      return prompt + safeSpaceInstructions;
    }

    const enhancedPrompt = appendSafeSpaceRules(basePrompt, "19:10");
    
    console.log('Generated enhanced prompt for book thumbnail');

    // Get next version number
    const { data: versionData } = await supabase
      .rpc('get_next_book_thumbnail_version_number', { p_book_id: bookId });

    const versionNumber = versionData || 1;

    // Create thumbnail record
    const { data: thumbnailRecord, error: insertError } = await supabase
      .from('book_thumbnails')
      .insert({
        book_id: bookId,
        user_id: userId,
        version_number: versionNumber,
        prompt_used: enhancedPrompt,
        generation_status: 'not_started',
        aspect_ratio: '1200:630'
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating thumbnail record:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create thumbnail record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailId: thumbnailRecord.id,
        prompt: enhancedPrompt,
        versionNumber
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in generate-book-thumbnail-prompt function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});