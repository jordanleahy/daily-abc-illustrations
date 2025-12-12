import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Disable JWT verification for admin utility
export const config = {
  verify_jwt: false,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, pageId, bookId, userId } = await req.json();

    if (!imageUrl || !pageId || !bookId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageUrl, pageId, bookId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the image
    console.log(`Fetching image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Upload to Supabase Storage
    const storagePath = `${userId}/${bookId}/page-1-cover.png`;
    console.log(`Uploading to storage: ${storagePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('page-images')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log(`Public URL: ${publicUrl}`);

    // Get next version number
    const { data: versionData } = await supabase
      .rpc('get_next_page_image_version_number', { p_page_id: pageId });

    const versionNumber = versionData || 1;

    // Mark existing images as not latest
    await supabase
      .from('page_image_urls')
      .update({ is_latest: false })
      .eq('page_id', pageId);

    // Insert page_image_urls record
    const { data: insertData, error: insertError } = await supabase
      .from('page_image_urls')
      .insert({
        page_id: pageId,
        book_id: bookId,
        user_id: userId,
        image_url: publicUrl,
        is_latest: true,
        version_number: versionNumber,
        source_type: 'user_uploaded',
        prompt_used: 'Manually uploaded cover image'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log('Successfully added image:', insertData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        record: insertData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
