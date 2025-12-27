import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { 
  COLORING_IMAGE_MODEL,
  getImageCostByModel,
  logImageGenerationUsage,
  buildImageGenerationMetadata
} from "../_shared/aiModelConstants.ts";

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
    const { pageId, bookId, textImageUrl } = await req.json();

    if (!pageId || !bookId || !textImageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: pageId, bookId, textImageUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎨 Generating coloring book image for page: ${pageId}`);
    console.log(`🤖 Using model: ${COLORING_IMAGE_MODEL}`);

    // Call Lovable AI to convert the text image to a coloring book outline
    // The text image has a text bar at the bottom that must be preserved
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: COLORING_IMAGE_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transform this image into a printable coloring book page suitable for children to color with crayons.

CRITICAL OUTPUT REQUIREMENTS - ZERO EXCEPTIONS:
- The illustration area must contain ONLY pure black lines (#000000) on a pure white background (#FFFFFF)
- ABSOLUTELY NO color fills - no browns, blues, greens, pinks, tans, beiges, or ANY color whatsoever
- ABSOLUTELY NO gray fills or shading - only solid black line outlines
- All shapes must be empty/hollow white areas bounded by clean black outlines
- The result must look exactly like a traditional coloring book page you would buy at a store
- NO gradients, NO colored shadows, NO tinted areas - pure black lines only

TEXT BAR PRESERVATION - MANDATORY:
- The text bar at the bottom of this image with words/title must remain EXACTLY as-is
- Do NOT convert, modify, remove, or alter the text bar in any way - keep its original colors and styling completely unchanged

VALIDATION CHECK:
- If any color (other than black lines and white fill) remains in the illustration area above the text bar, the output is WRONG
- The goal is for a child to print this on paper and color it themselves with crayons - they need EMPTY white spaces to fill in`
              },
              {
                type: "image_url",
                image_url: {
                  url: textImageUrl
                }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    
    // Extract and log usage/cost information
    const usage = aiData.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || inputTokens + outputTokens;
    
    // Use dynamic pricing from constants
    const { cents: costCents } = getImageCostByModel(COLORING_IMAGE_MODEL);
    
    logImageGenerationUsage(inputTokens, outputTokens, totalTokens, COLORING_IMAGE_MODEL);

    // Extract the generated image from the response
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImageUrl) {
      console.error('No image in AI response:', JSON.stringify(aiData).substring(0, 500));
      throw new Error('No image generated by AI');
    }

    // Convert base64 to blob
    const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });

    // Upload to Supabase Storage
    const fileName = `coloring-${pageId}-${Date.now()}.png`;
    const filePath = `${user.id}/${bookId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload coloring image');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('page-images')
      .getPublicUrl(filePath);

    const coloringImageUrl = publicUrlData.publicUrl;
    console.log('Coloring image uploaded:', coloringImageUrl);

    // Update the page_image_urls table with cost tracking
    const { data: existingRecord } = await supabase
      .from('page_image_urls')
      .select('id, color_generation_cost_cents, usage_metadata')
      .eq('page_id', pageId)
      .eq('is_latest', true)
      .single();

    if (existingRecord) {
      // Update existing record with coloring image and cost
      const { error: updateError } = await supabase
        .from('page_image_urls')
        .update({ 
          coloring_image_url: coloringImageUrl,
          color_generation_cost_cents: (existingRecord.color_generation_cost_cents || 0) + costCents,
          usage_metadata: {
            ...(existingRecord.usage_metadata || {}),
            ...buildImageGenerationMetadata(inputTokens, outputTokens, 'coloring_generation', COLORING_IMAGE_MODEL)
          }
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update coloring image URL');
      }
    } else {
      // Create new record with cost tracking
      const { error: insertError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: pageId,
          book_id: bookId,
          user_id: user.id,
          coloring_image_url: coloringImageUrl,
          is_latest: true,
          version_number: 1,
          source_type: 'ai_generated',
          color_generation_cost_cents: costCents,
          usage_metadata: buildImageGenerationMetadata(inputTokens, outputTokens, 'coloring_generation', COLORING_IMAGE_MODEL)
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to create coloring image record');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        coloringImageUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating coloring image:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to generate coloring image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
