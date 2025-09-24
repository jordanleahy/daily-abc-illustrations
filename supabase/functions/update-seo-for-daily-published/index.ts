/**
 * Update SEO Metadata for Daily Published Content
 * 
 * This function generates daily-published-specific SEO metadata when content 
 * is published. It creates a new version with the daily_published_id based
 * on existing book-level SEO metadata.
 * 
 * Usage:
 * POST request with body: {
 *   "dailyPublishedId": string,
 *   "bookId": string,
 *   "contentTitle": string
 * }
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * 
 * Returns:
 * - Success: { "success": true, "seoMetadataId": "uuid" }
 * - Error: { "success": false, "error": "Error description" }
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';
import { corsHeaders } from '../_shared/types.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dailyPublishedId, bookId, contentTitle } = await req.json();

    console.log('Updating SEO metadata for daily published:', dailyPublishedId);

    // Validate required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    if (!dailyPublishedId || !bookId || !contentTitle) {
      throw new Error('Missing required parameters');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if daily-specific SEO metadata already exists
    const { data: existingSeo } = await supabase
      .from('seo_metadata')
      .select('id')
      .eq('daily_published_id', dailyPublishedId)
      .eq('is_latest', true)
      .maybeSingle();

    if (existingSeo) {
      console.log('Daily-specific SEO metadata already exists:', existingSeo.id);
      return new Response(JSON.stringify({
        success: true,
        seoMetadataId: existingSeo.id,
        message: 'SEO metadata already exists for this daily publication'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get book-level SEO metadata as base
    const { data: bookSeo } = await supabase
      .from('seo_metadata')
      .select('*')
      .is('daily_published_id', null)
      .like('source_data', `%"bookId":"${bookId}"%`)
      .eq('is_latest', true)
      .eq('optimization_status', 'complete')
      .maybeSingle();

    if (!bookSeo) {
      // If no book-level SEO exists, call generate-seo-metadata
      console.log('No existing SEO metadata found, generating new...');
      const generateResult = await supabase.functions.invoke('generate-seo-metadata', {
        body: {
          bookId,
          dailyPublishedId,
          contentTitle
        }
      });

      if (generateResult.error) {
        throw new Error(`SEO generation failed: ${generateResult.error.message}`);
      }

      return new Response(JSON.stringify(generateResult.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a new daily-specific version based on book SEO
    const { data: newSeoMetadata, error: seoError } = await supabase
      .from('seo_metadata')
      .insert({
        daily_published_id: dailyPublishedId,
        user_id: bookSeo.user_id,
        version_number: 1, // New version for daily published
        seo_title: bookSeo.seo_title,
        seo_description: bookSeo.seo_description,
        og_image_url: bookSeo.og_image_url,
        optimization_status: 'complete',
        is_latest: true,
        is_active: true,
        source_data: {
          dailyPublishedId,
          bookId,
          contentTitle,
          baseBookSeoId: bookSeo.id
        },
        generation_metadata: {
          ...bookSeo.generation_metadata,
          adapted_for_daily_published: true,
          original_seo_id: bookSeo.id
        }
      })
      .select()
      .single();

    if (seoError) {
      console.error('Error creating daily SEO metadata:', seoError);
      throw new Error(`Failed to create daily SEO metadata: ${seoError.message}`);
    }

    console.log('Daily-specific SEO metadata created:', newSeoMetadata.id);

    return new Response(JSON.stringify({
      success: true,
      seoMetadataId: newSeoMetadata.id,
      adapted: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in update-seo-for-daily-published function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});