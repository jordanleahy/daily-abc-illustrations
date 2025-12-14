import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  pageId: string;
  bookId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pageId, bookId } = await req.json() as RequestBody;
    console.log(`Processing text image for page: ${pageId}, book: ${bookId}`);

    if (!pageId || !bookId) {
      return new Response(JSON.stringify({ error: "Missing pageId or bookId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch page title
    const { data: pageData, error: pageError } = await supabase
      .from("pages")
      .select("title")
      .eq("id", pageId)
      .single();

    if (pageError || !pageData?.title) {
      console.error("Page fetch error:", pageError);
      return new Response(JSON.stringify({ error: "Could not fetch page title" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current color image URL
    const { data: imageData, error: imageError } = await supabase
      .from("page_image_urls")
      .select("id, image_url")
      .eq("page_id", pageId)
      .eq("is_latest", true)
      .single();

    if (imageError || !imageData?.image_url) {
      console.error("Image fetch error:", imageError);
      return new Response(JSON.stringify({ error: "No color image found for this page" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching image from: ${imageData.image_url}`);

    // Fetch the source image
    const imageResponse = await fetch(imageData.image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);

    // Decode image to get dimensions using a simple approach
    // We'll use the image as-is and calculate dimensions from the blob
    // For PNG/JPEG, we can extract dimensions from headers
    const dimensions = getImageDimensions(imageBytes);
    console.log(`Image dimensions: ${dimensions.width}x${dimensions.height}`);

    // Create composited image using canvas-like approach
    // Since Deno doesn't have native canvas, we'll use a different approach:
    // Use the AI gateway to add text overlay
    const compositedBlob = await compositeTextOnImage(
      imageBytes,
      pageData.title,
      dimensions,
      imageBlob.type
    );

    // Upload to storage
    const fileName = `page-${pageId}-text-${Date.now()}.png`;
    const filePath = `${user.id}/${bookId}/text/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("page-images")
      .upload(filePath, compositedBlob, { 
        contentType: "image/png",
        upsert: false 
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("page-images")
      .getPublicUrl(filePath);

    // Update page_image_urls with text_image_url
    const { error: updateError } = await supabase
      .from("page_image_urls")
      .update({ text_image_url: urlData.publicUrl })
      .eq("id", imageData.id);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw updateError;
    }

    console.log(`Text image generated successfully: ${urlData.publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        textImageUrl: urlData.publicUrl 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating text image:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate text image" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Extract image dimensions from PNG/JPEG header
function getImageDimensions(bytes: Uint8Array): { width: number; height: number } {
  // Check for PNG signature
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    // PNG: width at bytes 16-19, height at bytes 20-23 (big endian)
    const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
    const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
    return { width, height };
  }
  
  // Check for JPEG signature
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xFF) break;
      const marker = bytes[offset + 1];
      
      // SOF markers (Start of Frame)
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
        const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
        return { width, height };
      }
      
      const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
      offset += segmentLength + 2;
    }
  }
  
  // Default fallback
  return { width: 1024, height: 1024 };
}

// Composite text onto image using Gemini image editing
async function compositeTextOnImage(
  imageBytes: Uint8Array,
  text: string,
  dimensions: { width: number; height: number },
  mimeType: string
): Promise<Blob> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  // Convert image to base64
  const base64Image = btoa(String.fromCharCode(...imageBytes));
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  // Use Gemini to add text overlay
  const prompt = `Add a semi-transparent black bar (60% opacity) at the bottom of this image, taking up about 15% of the image height. On this bar, add the following text in white, bold, centered: "${text}". The text should be clearly readable and professionally styled. Do not change anything else about the image.`;

  console.log(`Calling AI to composite text: "${text}"`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ],
      modalities: ["image", "text"]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", errorText);
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!editedImageUrl) {
    console.error("No image in AI response:", JSON.stringify(data));
    throw new Error("AI did not return an image");
  }

  // Convert base64 data URL to blob
  const base64Data = editedImageUrl.split(",")[1];
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: "image/png" });
}
