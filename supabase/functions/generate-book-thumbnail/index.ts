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
      .select('name')
      .eq('id', bookId)
      .single();

    if (bookError) throw bookError;
    bookName = bookData.name || 'Unknown Book';

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [FETCH_DATA] - Data fetched successfully {`, JSON.stringify({
      requestId,
      duration: 100,
      bookName: bookName.substring(0, 20) + '...',
      promptLength: imagePrompt?.length || 0
    }), `}`);

    // Generate image using OpenAI DALL-E
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [OPENAI_IMAGE] - Generating image with DALL-E... {`, JSON.stringify({
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
        model: 'dall-e-3',
        prompt: imagePrompt,
        size: '1792x1024', // 3:2 aspect ratio, good for social media
        quality: 'hd',
        n: 1,
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`[${new Date().toISOString()}] [ERROR] [OPENAI_IMAGE] - OpenAI API error:`, errorText);
      throw new Error(`OpenAI API error: ${imageResponse.status} ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [OPENAI_IMAGE] - Image generated successfully {`, JSON.stringify({
      requestId,
      duration: 5000,
      hasImageUrl: !!imageUrl
    }), `}`);

    // Download and store image in Supabase Storage
    console.log(`[${new Date().toISOString()}] [INFO] [in-progress] [STORAGE_UPLOAD] - Downloading and storing image... {`, JSON.stringify({
      requestId
    }), `}`);

    const imageFileResponse = await fetch(imageUrl);
    if (!imageFileResponse.ok) {
      throw new Error('Failed to download generated image');
    }

    const imageBlob = await imageFileResponse.blob();
    const fileName = `${userId}/book-thumbnails/${bookId}/thumbnail-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('page-images')
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
      .from('page-images')
      .getPublicUrl(fileName);

    const thumbnailUrl = publicUrlData.publicUrl;

    console.log(`[${new Date().toISOString()}] [INFO] [complete] [STORAGE_UPLOAD] - Image stored successfully {`, JSON.stringify({
      requestId,
      duration: 2000,
      fileName: fileName.substring(fileName.lastIndexOf('/') + 1),
      fileSize: imageBlob.size
    }), `}`);

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