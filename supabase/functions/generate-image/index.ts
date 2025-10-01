/**
 * Generate Image Edge Function
 * 
 * This edge function generates images using Google Gemini's image model via Lovable AI Gateway
 * based on prompts stored in the page_image_urls table. It handles the complete workflow from
 * API call to storage upload and database updates.
 * 
 * @requires LOVABLE_API_KEY - Lovable AI Gateway API key for image generation
 * @requires SUPABASE_URL - Supabase project URL
 * @requires SUPABASE_SERVICE_ROLE_KEY - Supabase service role key for database/storage access
 */

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

    // Get Lovable AI API key
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.log(`[${requestId}] Lovable AI API key not configured`);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'Lovable AI API key not configured'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'Lovable AI API key not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate prompt before calling OpenAI
    if (!imageRecord.prompt_used || imageRecord.prompt_used.trim().length === 0) {
      console.log(`[${requestId}] No prompt available for image generation`);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'No prompt available for image generation'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'No prompt available for image generation'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[${requestId}] Calling Lovable AI Gateway with Gemini image model, prompt length: ${imageRecord.prompt_used.length}`);

    const generationStartTime = Date.now();

    // Call Lovable AI Gateway with Google Gemini image model
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: imageRecord.prompt_used
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.log(`[${requestId}] Lovable AI API error:`, errorText);
      
      let errorMessage = 'Failed to generate image';
      if (aiResponse.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (aiResponse.status === 402) {
        errorMessage = 'Payment required. Please add credits to your Lovable AI workspace.';
      }
      
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
        status: aiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const imageData = await aiResponse.json();
    console.log(`[${requestId}] Lovable AI response received successfully`);

    // Extract image from Gemini response format
    const images = imageData.choices?.[0]?.message?.images;
    if (!images || !images[0]?.image_url?.url) {
      console.log(`[${requestId}] No image data returned from Lovable AI`);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'No image data returned from AI'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'No image data returned from AI'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract base64 data from data URI (format: data:image/png;base64,...)
    const dataUri = images[0].image_url.url;
    const base64Match = dataUri.match(/^data:image\/\w+;base64,(.+)$/);
    
    if (!base64Match || !base64Match[1]) {
      console.log(`[${requestId}] Invalid data URI format from Lovable AI`);
      
      await supabase
        .from('page_image_urls')
        .update({
          generation_status: 'error',
          error_message: 'Invalid image data format'
        })
        .eq('id', recordId);

      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid image data format'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const base64Data = base64Match[1];

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

    // Update the record with the image URL, completion status, and set as latest
    const { data: updatedRecord, error: updateError } = await supabase
      .from('page_image_urls')
      .update({
        image_url: urlData.publicUrl,
        generation_status: 'complete',
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: generationDuration,
        is_latest: true // This will trigger the database trigger to mark others as not latest
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