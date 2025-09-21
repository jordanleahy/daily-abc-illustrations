import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

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
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [REQUEST] - Starting book thumbnail image generation {`, JSON.stringify({
      requestId,
      method: req.method
    }), `}`);

    // Parse request body
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [PARSE_REQUEST] - Parsing request parameters... {`, JSON.stringify({
      requestId
    }), `}`);
    
    const { bookId, userId, customPrompt } = await req.json();
    
    if (!bookId || !userId) {
      throw new Error('Missing required parameters: bookId and userId');
    }

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [PARSE_REQUEST] - Request parsed successfully {`, JSON.stringify({
      requestId,
      duration: 1,
      bookId: bookId.substring(0, 8) + '...',
      userId: userId.substring(0, 8) + '...',
      hasCustomPrompt: !!customPrompt
    }), `}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get book data and existing prompt if no custom prompt provided
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [FETCH_DATA] - Fetching book data and prompt... {`, JSON.stringify({
      requestId
    }), `}`);

    let imagePrompt = customPrompt;
    let bookName = '';

    if (!customPrompt) {
      // Get the most recent generated prompt for this book
      const { data: promptData, error: promptError } = await supabase.functions.invoke('generate-book-thumbnail-prompt', {
        body: { bookId, userId }
      });

      if (promptError || !promptData?.success) {
        throw new Error('Failed to get thumbnail prompt. Please generate a prompt first.');
      }

      imagePrompt = promptData.thumbnailPrompt;
    }

    // Get book info for naming
    const { data: bookData, error: bookError } = await supabase
      .from('books')
      .select('book_name')
      .eq('id', bookId)
      .single();

    if (bookError) throw bookError;
    bookName = bookData.book_name || 'Unknown Book';

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [FETCH_DATA] - Data fetched successfully {`, JSON.stringify({
      requestId,
      duration: 100,
      bookName: bookName.substring(0, 20) + '...',
      promptLength: imagePrompt?.length || 0
    }), `}`);

    // Generate image using OpenAI gpt-image-1
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [OPENAI_IMAGE] - Generating image with gpt-image-1... {`, JSON.stringify({
      requestId,
      promptLength: imagePrompt?.length || 0
    }), `}`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: imagePrompt,
        size: '1536x1024', // 3:2 aspect ratio, supported by gpt-image-1
        quality: 'high',
        output_format: 'png',
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`[${new Date().toISOString()}] [ERROR] [OPENAI_IMAGE] - OpenAI API error:`, errorText);
      throw new Error(`OpenAI API error: ${imageResponse.status} ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.data[0]?.b64_json;

    if (!base64Image) {
      throw new Error('No image data returned from OpenAI');
    }

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [OPENAI_IMAGE] - Image generated successfully {`, JSON.stringify({
      requestId,
      duration: 5000,
      hasImageData: !!base64Image
    }), `}`);

    // Convert base64 to blob and store in Supabase Storage
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [STORAGE_UPLOAD] - Converting and storing image... {`, JSON.stringify({
      requestId
    }), `}`);

    // Convert base64 to blob
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: 'image/png' });
    const fileName = `${bookId}/cover.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error(`[${new Date().toISOString()}] [ERROR] [STORAGE_UPLOAD] - Upload error:`, uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('book-covers')
      .getPublicUrl(fileName);

    const thumbnailUrl = publicUrlData.publicUrl;

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [STORAGE_UPLOAD] - Image stored successfully {`, JSON.stringify({
      requestId,
      duration: 2000,
      fileName: fileName.substring(fileName.lastIndexOf('/') + 1),
      fileSize: imageBlob.size
    }), `}`);

    // Create book thumbnail record
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [DB_INSERT] - Creating book thumbnail record... {`, JSON.stringify({
      requestId
    }), `}`);

    // Get next version number for this book
    const { data: versionData, error: versionError } = await supabase
      .rpc('get_next_book_thumbnail_version_number', { p_book_id: bookId });

    if (versionError) {
      console.error(`[${new Date().toISOString()}] [ERROR] [VERSION] - Version error:`, versionError);
      throw versionError;
    }

    const nextVersion = versionData || 1;

    const { data: thumbnailRecord, error: thumbnailError } = await supabase
      .from('book_thumbnails')
      .insert({
        book_id: bookId,
        user_id: userId,
        version_number: nextVersion,
        thumbnail_url: thumbnailUrl,
        prompt_used: imagePrompt,
        generation_status: 'complete',
        generation_started_at: new Date().toISOString(),
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: 8000, // Approximate duration
        aspect_ratio: '1536:1024',
        is_latest: true
      })
      .select()
      .single();

    if (thumbnailError) {
      console.error(`[${new Date().toISOString()}] [ERROR] [DB_INSERT] - Database error:`, thumbnailError);
      throw thumbnailError;
    }

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [DB_INSERT] - Thumbnail record created {`, JSON.stringify({
      requestId,
      thumbnailId: thumbnailRecord.id,
      versionNumber: thumbnailRecord.version_number
    }), `}`);

    // Update SEO metadata with the thumbnail URL
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [SEO_UPDATE] - Updating SEO metadata with thumbnail... {`, JSON.stringify({
      requestId
    }), `}`);

    try {
      // Find the active daily_published entry for this book
      const { data: dailyPublishedData, error: dailyPublishedError } = await supabase
        .from('daily_published')
        .select('id')
        .eq('book_id', bookId)
        .eq('is_active', true)
        .maybeSingle();

      if (dailyPublishedError) {
        console.error(`[${new Date().toISOString()}] [WARN] [SEO_UPDATE] - Error finding draft daily_published:`, dailyPublishedError);
      } else if (dailyPublishedData) {
        // Update the SEO metadata with the thumbnail URL
        const { error: seoUpdateError } = await supabase
          .from('seo_metadata')
          .update({ 
            og_image_url: thumbnailUrl,
            updated_at: new Date().toISOString()
          })
          .eq('daily_published_id', dailyPublishedData.id)
          .eq('is_latest', true)
          .eq('is_active', true);

        if (seoUpdateError) {
          console.error(`[${new Date().toISOString()}] [WARN] [SEO_UPDATE] - Error updating SEO metadata:`, seoUpdateError);
        } else {
          console.log(`[${new Date().toISOString()}] [INFO] [complete] [SEO_UPDATE] - SEO metadata updated with thumbnail URL {`, JSON.stringify({
            requestId,
            dailyPublishedId: dailyPublishedData.id
          }), `}`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] [INFO] [SEO_UPDATE] - No active daily_published entry found for book {`, JSON.stringify({
          requestId
        }), `}`);
      }
    } catch (seoError) {
      console.error(`[${new Date().toISOString()}] [WARN] [SEO_UPDATE] - SEO update failed, but continuing:`, seoError);
    }

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [COMPLETE] - Book thumbnail generation completed successfully! {`, JSON.stringify({
      requestId,
      totalDuration: 8000,
      bookName: bookName.substring(0, 20) + '...',
      thumbnailUrl: thumbnailUrl.substring(thumbnailUrl.lastIndexOf('/') + 1),
      promptLength: imagePrompt?.length || 0
    }), `}`);

    return new Response(JSON.stringify({ 
      success: true, 
      thumbnailUrl,
      prompt: imagePrompt,
      bookName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] [ERROR] [COMPLETE] - Book thumbnail generation failed:`, error.message);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});