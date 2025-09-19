/**
 * Manual SEO Generation for Daily Published Content
 * 
 * This function manually generates SEO metadata for specific daily published content
 * that may be missing SEO optimization. It's designed for troubleshooting and fixing
 * missing SEO data.
 * 
 * Usage:
 * POST request with body: {
 *   "dailyPublishedId": string
 * }
 * 
 * Returns:
 * - Success: { "success": true, "seoMetadataId": "uuid" }
 * - Error: { "success": false, "error": "Error description" }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dailyPublishedId } = await req.json();

    console.log('Manual SEO generation for daily published:', dailyPublishedId);

    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    if (!dailyPublishedId) {
      throw new Error('Missing dailyPublishedId parameter');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get daily published content details
    const { data: dailyPublished, error: dailyError } = await supabase
      .from('daily_published')
      .select(`
        *,
        books (
          id,
          book_name,
          book_description,
          user_id
        )
      `)
      .eq('id', dailyPublishedId)
      .single();

    if (dailyError || !dailyPublished) {
      throw new Error(`Daily published content not found: ${dailyError?.message}`);
    }

    console.log('Found daily published content:', dailyPublished.title);

    // Check if SEO metadata already exists
    const { data: existingSeo } = await supabase
      .from('seo_metadata')
      .select('id, optimization_status')
      .eq('daily_published_id', dailyPublishedId)
      .eq('is_latest', true)
      .maybeSingle();

    if (existingSeo && existingSeo.optimization_status === 'complete') {
      console.log('SEO metadata already exists and is complete:', existingSeo.id);
      return new Response(JSON.stringify({
        success: true,
        seoMetadataId: existingSeo.id,
        message: 'SEO metadata already exists and is complete'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the generate-seo-metadata function
    console.log('Calling generate-seo-metadata function...');
    const generateResult = await supabase.functions.invoke('generate-seo-metadata', {
      body: {
        bookId: dailyPublished.book_id,
        dailyPublishedId: dailyPublishedId,
        contentTitle: dailyPublished.title,
        contentDescription: dailyPublished.description,
        bookDescription: dailyPublished.books?.book_description
      }
    });

    if (generateResult.error) {
      console.error('SEO generation failed:', generateResult.error);
      throw new Error(`SEO generation failed: ${generateResult.error.message}`);
    }

    console.log('SEO generation successful:', generateResult.data);

    return new Response(JSON.stringify({
      success: true,
      ...generateResult.data,
      message: 'SEO metadata generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manual-seo-generation function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});