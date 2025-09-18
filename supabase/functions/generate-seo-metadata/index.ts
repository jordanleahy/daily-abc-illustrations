/**
 * Generate SEO Metadata Edge Function
 * 
 * This function generates and stores SEO-optimized titles and descriptions
 * for books and daily published content. It replaces the optimize-opengraph
 * function by storing results directly in the database.
 * 
 * Usage:
 * POST request with body: {
 *   "bookId": string (required),
 *   "dailyPublishedId": string (optional),
 *   "contentTitle": string,
 *   "bookDescription": string (optional),
 *   "category": string (optional),
 *   "timeRemaining": string (optional),
 *   "currentPage": number (optional),
 *   "totalPages": number (optional),
 *   "ogImageUrl": string (optional)
 * }
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * 
 * Returns:
 * - Success: { "success": true, "seoMetadataId": "uuid", "version": number }
 * - Error: { "success": false, "error": "Error description" }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/types.ts';

interface SEORequest {
  bookId: string;
  dailyPublishedId?: string;
  contentTitle: string;
  bookDescription?: string;
  category?: string;
  timeRemaining?: string;
  currentPage?: number;
  totalPages?: number;
  ogImageUrl?: string;
  userId?: string;
}

interface OptimizationResponse {
  optimizedTitle: string;
  optimizedDescription: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      bookId, 
      dailyPublishedId, 
      contentTitle, 
      bookDescription, 
      category, 
      timeRemaining, 
      currentPage, 
      totalPages, 
      ogImageUrl,
      userId 
    }: SEORequest = await req.json();

    console.log('Generating SEO metadata for book:', bookId, 'daily published:', dailyPublishedId);

    // Validate required environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    if (!bookId || !contentTitle) {
      throw new Error('Missing required parameters: bookId and contentTitle');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If userId not provided, get it from the book
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('user_id')
        .eq('id', bookId)
        .single();

      if (bookError || !bookData) {
        throw new Error('Failed to find book or get user_id');
      }
      finalUserId = bookData.user_id;
    }

    // Build context for the AI
    let context = `Content: "${contentTitle}"`;
    if (bookDescription) {
      context += `\nBook Description: "${bookDescription}"`;
    }
    if (category) {
      context += `\nCategory: ${category}`;
    }
    if (currentPage && totalPages) {
      context += `\nPage: ${currentPage} of ${totalPages}`;
    }
    if (timeRemaining) {
      context += `\nTime Remaining: ${timeRemaining}`;
    }

    const prompt = `${context}

Create an SEO-optimized title and description for this educational children's content:

Requirements:
- Title: Maximum 60 characters, engaging and click-worthy
- Description: Maximum 160 characters, compelling and informative
- Focus on educational value and child appeal
- Include urgency if time-limited
- Use emojis sparingly but effectively
- Make parents want to click for their kids

Return only JSON format:
{
  "title": "optimized title here",
  "description": "optimized description here"
}`;

    console.log('Calling OpenAI for SEO optimization...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a SEO specialist.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content.trim();
    
    console.log('AI Response:', aiResponse);

    // Parse the JSON response
    let parsed: OptimizationResponse;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('AI response was not valid JSON');
    }

    if (!parsed.title || !parsed.description) {
      throw new Error('AI response missing required title or description');
    }

    console.log('Optimization result:', parsed);

    // Get the next version number
    let versionNumber = 1;
    if (dailyPublishedId) {
      const { data: nextVersion } = await supabase.rpc('get_next_seo_version_number', {
        p_daily_published_id: dailyPublishedId
      });
      versionNumber = nextVersion || 1;
    }

    // Store in seo_metadata table
    const { data: seoMetadata, error: seoError } = await supabase
      .from('seo_metadata')
      .insert({
        daily_published_id: dailyPublishedId || null,
        user_id: finalUserId,
        version_number: versionNumber,
        seo_title: parsed.title,
        seo_description: parsed.description,
        og_image_url: ogImageUrl || null,
        optimization_status: 'complete',
        is_latest: true,
        is_active: true,
        source_data: {
          bookId,
          contentTitle,
          bookDescription,
          category,
          timeRemaining,
          currentPage,
          totalPages
        },
        generation_metadata: {
          model: 'gpt-4o-mini',
          prompt_tokens: data.usage?.prompt_tokens,
          completion_tokens: data.usage?.completion_tokens,
          total_tokens: data.usage?.total_tokens
        }
      })
      .select()
      .single();

    if (seoError) {
      console.error('Error storing SEO metadata:', seoError);
      throw new Error(`Failed to store SEO metadata: ${seoError.message}`);
    }

    console.log('SEO metadata stored with ID:', seoMetadata.id);

    return new Response(JSON.stringify({
      success: true,
      seoMetadataId: seoMetadata.id,
      version: versionNumber,
      optimizedTitle: parsed.title,
      optimizedDescription: parsed.description
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-seo-metadata function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});