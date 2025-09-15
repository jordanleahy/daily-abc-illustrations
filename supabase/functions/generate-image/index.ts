/**
 * Generate Image Edge Function
 * 
 * This edge function generates images using OpenAI's gpt-image-1 model based on prompts
 * stored in the page_image_urls table. It handles the complete workflow from API call
 * to storage upload and database updates.
 * 
 * @requires OPENAI_API_KEY - OpenAI API key for image generation
 * @requires SUPABASE_URL - Supabase project URL
 * @requires SUPABASE_SERVICE_ROLE_KEY - Supabase service role key for database/storage access
 */

// XMLHttpRequest polyfill - Required for OpenAI API calls in Deno runtime
// Provides browser-compatible XMLHttpRequest functionality that some libraries expect
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Deno HTTP server - Core server functionality for handling HTTP requests
// Used to create the edge function endpoint that responds to HTTP requests
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Supabase JavaScript client - Database and storage operations
// Provides type-safe access to Supabase database, auth, and storage services
// Used for fetching image records, updating status, and uploading generated images
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting generate-image request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { recordId, userId } = await req.json();
    
    console.log(`[${requestId}] Request params:`, {
      recordId,
      userId
    });

    if (!recordId || !userId) {
      console.log(`[${requestId}] Missing required parameters`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: recordId and userId are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.log(`[${requestId}] Missing Supabase environment variables`);
      return new Response(JSON.stringify({
        success: false,
        error: 'Server configuration error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log(`[${requestId}] Fetching image record`);
    
    // Get the image record and verify access
    const { data: imageRecord, error: recordError } = await supabase
      .from('page_image_urls')
      .select('*')
      .eq('id', recordId)
      .single();

    if (recordError || !imageRecord) {
      console.log(`[${requestId}] Image record fetch failed:`, recordError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Record not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the requesting user owns this record
    if (imageRecord.user_id !== userId) {
      console.log(`[${requestId}] Access denied: user mismatch`, { requestUserId: userId, ownerUserId: imageRecord.user_id });
      return new Response(JSON.stringify({
        success: false,
        error: 'Access denied'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update status to in_progress
    const startTime = new Date().toISOString();
    await supabase
      .from('page_image_urls')
      .update({
        generation_status: 'in_progress',
        generation_started_at: startTime
      })
      .eq('id', recordId);

    console.log(`[${requestId}] Updated status to in_progress`);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.log(`[${requestId}] OpenAI API key not configured`);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'OpenAI API key not configured'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Calling OpenAI Image Generation API`);

    const generationStartTime = Date.now();

    // Call OpenAI Image Generation API
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imageRecord.prompt_used,
        n: 1,
        size: '1024x1024',
        quality: 'high'
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.log(`[${requestId}] OpenAI API error:`, errorText);
      
      const errorMessage = 'Failed to generate image';
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: errorMessage
        })
        .eq('id', recordId);
      
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const imageData = await openaiResponse.json();
    console.log(`[${requestId}] OpenAI response received successfully`);

    if (!imageData.data || !imageData.data[0]) {
      console.log(`[${requestId}] No image data returned from OpenAI`);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'No image data returned from OpenAI'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'No image data returned from OpenAI'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For gpt-image-1, the response contains base64 data in the b64_json field
    const base64Data = imageData.data[0].b64_json;

    if (!base64Data) {
      console.log(`[${requestId}] No base64 data in OpenAI response`);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'No image data in OpenAI response'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'No image data in OpenAI response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Uploading image to Supabase Storage`);

    // Convert base64 to blob for upload
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const fileName = `${userId}/${imageRecord.book_id}/${imageRecord.page_id}/v${imageRecord.version_number}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.log(`[${requestId}] Storage upload error:`, uploadError);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'Failed to upload image to storage'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to upload image to storage'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('page-images')
      .getPublicUrl(fileName);

    const generationEndTime = Date.now();
    const generationDuration = generationEndTime - generationStartTime;

    console.log(`[${requestId}] Image uploaded successfully, updating record`);

    // Update the record with the image URL and completion status
    const { data: updatedRecord, error: updateError } = await supabase
      .from('page_image_urls')
      .update({
        image_url: urlData.publicUrl,
        generation_status: 'complete',
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: generationDuration
      })
      .eq('id', recordId)
      .select()
      .single();

    if (updateError) {
      console.log(`[${requestId}] Failed to update record:`, updateError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to update image record'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Successfully generated and stored image`);

    return new Response(JSON.stringify({
      success: true,
      record: updatedRecord
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error(`[${requestId}] Error in generate-image function:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});