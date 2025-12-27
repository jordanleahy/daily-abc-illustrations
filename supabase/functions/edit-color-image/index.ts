import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { 
  IMAGE_GENERATION_MODEL, 
  IMAGE_GENERATION_COST_CENTS,
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
    const { pageId, bookId, imageUrl, editPrompt } = await req.json();

    if (!pageId || !bookId || !imageUrl || !editPrompt) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters: pageId, bookId, imageUrl, editPrompt' }),
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

    console.log('✏️ Editing color image for page:', pageId);
    console.log('📝 Edit prompt:', editPrompt);
    console.log('🖼️ Source image URL:', imageUrl.substring(0, 100) + '...');

    // Call Lovable AI to edit the image
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: IMAGE_GENERATION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: editPrompt
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
    
    // Use centralized pricing constants
    const costCents = IMAGE_GENERATION_COST_CENTS;
    
    logImageGenerationUsage(inputTokens, outputTokens, totalTokens);

    // Extract the generated image from the response
    const generatedImageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImageUrl) {
      console.error('No image in AI response:', JSON.stringify(aiData).substring(0, 500));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'The AI couldn\'t generate the edited image. Try a different edit prompt.',
          errorCode: 'NO_IMAGE_GENERATED'
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert base64 to blob
    const base64Data = generatedImageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const imageBlob = new Blob([imageBytes], { type: 'image/png' });

    // Upload to Supabase Storage
    const fileName = `edited-${pageId}-${Date.now()}.png`;
    const filePath = `${user.id}/${bookId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload edited image');
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('page-images')
      .getPublicUrl(filePath);

    const editedImageUrl = publicUrlData.publicUrl;
    console.log('🖼️ Edited image uploaded:', editedImageUrl);

    // Update the page_image_urls table
    const { data: existingRecord } = await supabase
      .from('page_image_urls')
      .select('id, color_generation_cost_cents, usage_metadata')
      .eq('page_id', pageId)
      .eq('is_latest', true)
      .single();

    if (existingRecord) {
      const { error: updateError } = await supabase
        .from('page_image_urls')
        .update({ 
          image_url: editedImageUrl,
          color_generation_cost_cents: (existingRecord.color_generation_cost_cents || 0) + costCents,
          usage_metadata: {
            ...(existingRecord.usage_metadata || {}),
            ...buildImageGenerationMetadata(inputTokens, outputTokens, 'image_edit', { edit_prompt: editPrompt })
          }
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error('Failed to update image URL');
      }
    } else {
      const { error: insertError } = await supabase
        .from('page_image_urls')
        .insert({
          page_id: pageId,
          book_id: bookId,
          user_id: user.id,
          image_url: editedImageUrl,
          is_latest: true,
          version_number: 1,
          source_type: 'ai_edited',
          color_generation_cost_cents: costCents,
          usage_metadata: buildImageGenerationMetadata(inputTokens, outputTokens, 'image_edit', { edit_prompt: editPrompt })
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to create image record');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: editedImageUrl,
        costCents
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error editing image:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to edit image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
