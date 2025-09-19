/**
 * Generate Book Thumbnail Prompt Edge Function
 * Generates SEO-optimized thumbnail prompts based on book metadata and style guide.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { ProcessStatus, corsHeaders, log, generateRequestId } from '../_shared/types.ts';
import { appendSafeSpaceRules, getSafeSpaceRules } from '../_shared/safeSpaceConfig.ts';

serve(async (req) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  log('INFO', ProcessStatus.IN_PROGRESS, 'REQUEST', 'Starting thumbnail prompt generation', { requestId });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    const { bookId, userId } = await req.json();

    if (!bookId || !userId) {
      throw new Error('Missing required parameters: bookId, userId');
    }

    // Fetch book data and style guide
    const [bookResult, styleGuideResult] = await Promise.all([
      supabaseClient
        .from('books')
        .select('id, book_name, category, book_description, user_id')
        .eq('id', bookId)
        .eq('user_id', userId)
        .single(),
      
      supabaseClient
        .from('book_system_prompts')
        .select('content')
        .eq('book_id', bookId)
        .eq('is_latest', true)
        .maybeSingle()
    ]);

    if (bookResult.error || !bookResult.data) {
      throw new Error('Book not found or access denied');
    }

    const bookData = bookResult.data;
    const styleGuide = styleGuideResult.data?.content || null;

    log('INFO', ProcessStatus.COMPLETE, 'FETCH', 'Book data fetched', { 
      requestId, 
      bookName: bookData.book_name,
      hasStyleGuide: !!styleGuide
    });

    const thumbnailPrompt = `
Generate an image prompt for this book that will be used for social media sharing and search engine previews.

Book Information:
- Title: ${bookData.book_name}
- Category: ${bookData.category || 'Children\'s Educational Book'}
- Description: ${bookData.book_description || 'An engaging educational book for children'}

${styleGuide ? `
Existing Style Guide:
${styleGuide}

Please incorporate the established visual style from the style guide while optimizing for thumbnail format.
` : ''}

Generate a detailed image generation prompt that will create an effective thumbnail for this book.
    `.trim();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get aspect ratio configuration
    const safeSpaceConfig = getSafeSpaceRules('3:2');

    // Dynamic thumbnail-optimized system prompt
    const THUMBNAIL_SYSTEM_PROMPT = `Please create an image prompt`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 4000,
        messages: [
          { role: 'system', content: THUMBNAIL_SYSTEM_PROMPT },
          { role: 'user', content: thumbnailPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Extract generated prompt
    const message = data?.choices?.[0]?.message;
    let generatedPrompt = '';
    
    if (Array.isArray(message?.content)) {
      generatedPrompt = message.content
        .map((part: any) => typeof part === 'string' ? part : part?.text || '')
        .join('').trim();
    } else {
      generatedPrompt = (message?.content || '').trim();
    }

    if (!generatedPrompt) {
      throw new Error('OpenAI returned empty thumbnail prompt');
    }

    // Add safe space config information to the generated prompt
    const promptWithAspectRatio = `${generatedPrompt}

${safeSpaceConfig.aspectRatio} - ${safeSpaceConfig.description}`;

    log('INFO', ProcessStatus.COMPLETE, 'OPENAI', 'Prompt generated', { 
      requestId, 
      promptLength: promptWithAspectRatio.length,
      tokensUsed: data.usage?.total_tokens
    });

    // Apply 3:2 safe space rules for thumbnail optimization
    const enhancedPrompt = appendSafeSpaceRules(promptWithAspectRatio, '3:2');

    const totalDuration = Date.now() - startTime;
    log('INFO', ProcessStatus.COMPLETE, 'COMPLETE', 'Thumbnail prompt generation completed', { 
      requestId,
      totalDuration,
      promptLength: enhancedPrompt.length,
      bookName: bookData.book_name
    });

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
    const totalDuration = Date.now() - startTime;
    log('ERROR', ProcessStatus.ERROR, 'ERROR', 'Thumbnail prompt generation failed', { 
      requestId,
      totalDuration,
      error: error.message
    });
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});