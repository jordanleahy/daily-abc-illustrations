import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
      // Use OpenAI for image generation (gpt-image-1 model)
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
          model: 'gpt-image-1',
          prompt: thumbnailRecord.prompt_used,
          n: 1,
          size: '1024x1024', // OpenAI doesn't support 1200x630, we'll use 1024x1024 and crop if needed
          quality: 'high',
          output_format: 'png'
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

      // Upload to Supabase Storage
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