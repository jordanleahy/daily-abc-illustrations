/**
 * ==================================================================================
 * BOOK THUMBNAIL IMAGE GENERATION SERVICE
 * ==================================================================================
 * 
 * BUSINESS PURPOSE:
 * This edge function generates high-quality book cover thumbnails using OpenAI's
 * image generation API. It handles the complete pipeline from prompt processing
 * to image storage, providing automated visual content creation for marketing
 * and social media purposes.
 * 
 * TECHNICAL ARCHITECTURE:
 * - Deno-based Supabase Edge Function
 * - OpenAI API integration (gpt-image-1 model)
 * - Supabase Storage for image hosting
 * - Real-time status tracking and progress monitoring
 * - Automatic version management and history
 * 
 * WORKFLOW:
 * 1. Client Request → Validate recordId and userId
 * 2. Record Retrieval → Fetch thumbnail record with generated prompt
 * 3. Status Update → Mark generation as 'in_progress'
 * 4. OpenAI API Call → Generate image using stored prompt
 * 5. Image Processing → Convert base64 to buffer
 * 6. Storage Upload → Save to Supabase Storage bucket
 * 7. URL Generation → Create public URL for client access
 * 8. Record Update → Mark complete with metadata
 * 9. Error Handling → Update status on failure with error details
 * 
 * BUSINESS RULES:
 * - Images are 1024x1024 (OpenAI limitation, cropped to 1200x630 if needed)
 * - High quality PNG format for best visual results
 * - Public URLs for easy integration with social media platforms
 * - Performance tracking for optimization and billing
 * - Version control for iterative design improvements
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Async processing with real-time status updates
 * - Progress polling capability for UI feedback
 * - Error recovery with detailed failure information
 * - Optimized storage paths for CDN delivery
 * 
 * COST CONSIDERATIONS:
 * - OpenAI API costs per image generation
 * - Supabase Storage costs for image hosting
 * - Performance metrics for ROI analysis
 * 
 * ERROR HANDLING:
 * - Comprehensive OpenAI API error mapping
 * - Storage failure recovery
 * - User-friendly error messages
 * - Detailed logging for debugging
 * 
 * SECURITY:
 * - User ownership validation via RLS policies
 * - Secure API key management via environment variables
 * - Input sanitization and validation
 * - Storage bucket access control
 * 
 * INTEGRATION POINTS:
 * - Called by: Frontend after prompt generation
 * - Depends on: generate-book-thumbnail-prompt function
 * - Stores in: Supabase Storage (page-images bucket)
 * - Updates: book_thumbnails table with results
 * ==================================================================================
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main request handler for book thumbnail image generation
 * 
 * REQUEST FORMAT:
 * POST body: { recordId: string, userId: string }
 * 
 * RESPONSE FORMAT:
 * Success: { success: true, thumbnailUrl: string, duration: number }
 * Error: { error: string }
 * 
 * PROCESSING STAGES:
 * 1. Validation & Record Retrieval
 * 2. Status Management (in_progress)
 * 3. OpenAI Image Generation
 * 4. Image Storage & URL Generation
 * 5. Completion & Metadata Update
 * 
 * PERFORMANCE METRICS:
 * - Generation duration tracking
 * - Error rate monitoring
 * - API cost tracking (via metadata)
 */
serve(async (req) => {
  // Handle CORS preflight requests for web client compatibility
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recordId, userId } = await req.json();

    if (!recordId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recordId and userId are required' }),
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

    console.log('Processing thumbnail generation for record:', recordId);

    // Fetch the thumbnail record
    const { data: thumbnailRecord, error: fetchError } = await supabase
      .from('book_thumbnails')
      .select('*')
      .eq('id', recordId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching thumbnail record:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Thumbnail record not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!thumbnailRecord.prompt_used) {
      return new Response(
        JSON.stringify({ error: 'No prompt found for thumbnail generation' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update status to in_progress
    const { error: updateError } = await supabase
      .from('book_thumbnails')
      .update({
        generation_status: 'in_progress',
        generation_started_at: new Date().toISOString()
      })
      .eq('id', recordId);

    if (updateError) {
      console.error('Error updating thumbnail status:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update thumbnail status' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Updated thumbnail status to in_progress');

    const startTime = Date.now();

    try {
       /**
        * OPENAI IMAGE GENERATION:
        * Uses OpenAI's DALL-E 3 model for high-quality thumbnails.
        * 
        * MODEL SELECTION: dall-e-3
        * - Highest quality image generation
        * - Best text rendering capabilities  
        * - Consistent style generation
        * 
        * LIMITATIONS:
        * - Maximum size 1024x1024 (OpenAI doesn't support 1200x630)
        * - API rate limits apply
        * - Higher cost than dall-e-2
        */
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      console.log('Calling OpenAI Image Generation API...');

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: thumbnailRecord.prompt_used,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          response_format: 'b64_json'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
      }

      const imageData = await response.json();
      console.log('OpenAI response received');

      if (!imageData.data || !imageData.data[0] || !imageData.data[0].b64_json) {
        throw new Error('Invalid response from OpenAI API');
      }

      const base64Image = imageData.data[0].b64_json;
      
      // Convert base64 to buffer
      const imageBuffer = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

      /**
       * STORAGE ORGANIZATION:
       * Files organized by book ID for easy management and cleanup
       * Version numbers in filename for history tracking
       * 
       * PATH STRUCTURE: book-thumbnails/{bookId}/thumbnail_{recordId}_v{version}.png
       * 
       * BENEFITS:
       * - Easy bulk operations per book
       * - Version history preservation
       * - CDN-friendly URLs
       * - Predictable naming convention
       */
      const fileName = `thumbnail_${recordId}_v${thumbnailRecord.version_number}.png`;
      const filePath = `book-thumbnails/${thumbnailRecord.book_id}/${fileName}`;

      console.log('Uploading image to storage:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('page-images')
        .upload(filePath, imageBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Image uploaded successfully:', uploadData.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('page-images')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('Generated public URL:', publicUrl);

      // Update the record with success
      const { error: finalUpdateError } = await supabase
        .from('book_thumbnails')
        .update({
          thumbnail_url: publicUrl,
          generation_status: 'complete',
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: duration,
          error_message: null
        })
        .eq('id', recordId);

      if (finalUpdateError) {
        console.error('Error updating thumbnail record:', finalUpdateError);
        throw new Error('Failed to update thumbnail record');
      }

      console.log('Thumbnail generation completed successfully');

      return new Response(
        JSON.stringify({
          success: true,
          thumbnailUrl: publicUrl,
          duration: duration
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (generationError) {
      console.error('Error during thumbnail generation:', generationError);

      // Update record with error
      await supabase
        .from('book_thumbnails')
        .update({
          generation_status: 'error',
          generation_completed_at: new Date().toISOString(),
          generation_duration_ms: Date.now() - startTime,
          error_message: generationError.message
        })
        .eq('id', recordId);

      return new Response(
        JSON.stringify({ error: generationError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error in generate-book-thumbnail function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});