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

/**
 * Convert an image to pure grayscale by averaging RGB values
 * This ensures no color artifacts remain in B&W images
 */
async function convertToGrayscale(imageBytes: Uint8Array): Promise<Uint8Array> {
  // Decode PNG manually - simpler approach using canvas-like processing
  // For Deno, we'll use a simple pixel manipulation approach
  
  // Import sharp-like library for image processing in Deno
  const { ImageMagick, initialize, MagickFormat } = await import(
    "https://deno.land/x/imagemagick_deno@0.0.31/mod.ts"
  );
  
  await initialize();
  
  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(imageBytes, (image) => {
        // Convert to grayscale
        image.grayscale();
        
        // Write back to PNG
        image.write(MagickFormat.Png, (data) => {
          resolve(data);
        });
      });
    } catch (error) {
      console.error('Grayscale conversion error:', error);
      // If conversion fails, return original bytes
      resolve(imageBytes);
    }
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageId, bookId, textImageUrl, sourceImageUrl, sourceType } = await req.json();

    // Support both legacy textImageUrl and new sourceImageUrl/sourceType params
    const imageUrl = sourceImageUrl || textImageUrl;
    const imageSourceType = sourceType || 'text';

    if (!pageId || !bookId || !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: pageId, bookId, and image URL' }),
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
    console.log(`📸 Source type: ${imageSourceType}`);

    // Different prompts based on source type
    const basePromptRules = `STYLE REFERENCE: Dover Publications coloring book, dollar store coloring book, rubber stamp line art, clip art outline, vector stroke-only illustration.

TARGET AUDIENCE: Pre-K children (ages 3-5) who color with chunky crayons and have developing fine motor skills.

OUTPUT FORMAT: 2-bit color depth - ONLY pure black lines (#000000) on pure white background (#FFFFFF). No anti-aliasing.

NEGATIVE (DO NOT INCLUDE): color, grayscale, shading, gradients, fills, shadows, texture, photorealistic details, gray pixels, brown, tan, beige, intricate patterns, overlapping elements, background clutter, any RGB values other than 000000 and FFFFFF.

Create a brand new BLACK AND WHITE LINE DRAWING based on this image. Do NOT filter or adjust - redraw as simple outline art.

PRE-K SIMPLIFICATION RULES:
- Maximum 3-5 main objects per illustration
- NO intricate patterns, textures, or fine details
- NO overlapping elements that confuse shape boundaries
- NO background clutter - focus on main subject only
- Each colorable area must be LARGE enough for chunky crayons
- Simple, recognizable shapes a 3-year-old can identify
- One clear focal point per illustration

LINE REQUIREMENTS FOR SMALL HANDS:
1. Extra bold outlines: 5-6px stroke width (thicker than standard coloring books)
2. Smooth, continuous lines - no scratchy or broken strokes
3. Clear, widely-spaced shapes so small hands don't color outside lines
4. Round, friendly shapes preferred over sharp angular forms
5. Every shape is HOLLOW/EMPTY inside - pure outlines only

PURPOSE: A Pre-K child will PRINT this on white paper and COLOR IT WITH CHUNKY CRAYONS. If any area has color, gray fill, or is too small/detailed, the child cannot color it successfully.`;

    // Text image prompt - preserves text bar at bottom
    const textImageSuffix = `

TEXT BAR AT BOTTOM - PRESERVE EXACTLY:
- The text bar at the very bottom must remain unchanged with its original colors
- Only convert the ILLUSTRATION AREA above it to line art

SELF-CHECK: In the illustration area, is there ANY pixel that is not pure black or pure white? Are shapes large and simple enough for a 3-year-old? If not, FIX IT.`;

    // Color image prompt - converts entire image (no text bar to preserve)
    const colorImageSuffix = `

Note: Convert the ENTIRE image to line art. There is no text bar to preserve.

SELF-CHECK: Is every pixel pure black or pure white? Are shapes large and simple enough for a 3-year-old? If not, FIX IT.`;

    const prompt = basePromptRules + (imageSourceType === 'color' ? colorImageSuffix : textImageSuffix);

    // Call Lovable AI to convert the image to a coloring book outline
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
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
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
    let imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Force grayscale conversion to remove any color artifacts
    console.log('🔲 Converting image to pure grayscale...');
    imageBytes = await convertToGrayscale(imageBytes);
    console.log('✅ Grayscale conversion complete');
    
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
      .select('id, bw_generation_cost_cents, usage_metadata')
      .eq('page_id', pageId)
      .eq('is_latest', true)
      .single();

    if (existingRecord) {
      // Update existing record with coloring image and cost
      const { error: updateError } = await supabase
        .from('page_image_urls')
        .update({ 
          coloring_image_url: coloringImageUrl,
          bw_generation_cost_cents: (existingRecord.bw_generation_cost_cents || 0) + costCents,
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
          bw_generation_cost_cents: costCents,
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
