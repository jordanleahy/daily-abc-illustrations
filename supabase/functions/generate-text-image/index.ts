import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCanvas, loadImage } from "https://deno.land/x/canvas@v1.4.2/mod.ts";

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
    console.log(`Text to composite: "${pageData.title}"`);

    // Load the source image using deno canvas
    const image = await loadImage(imageData.image_url);
    const width = image.width();
    const height = image.height();
    
    console.log(`Image dimensions: ${width}x${height}`);

    // Create canvas with same dimensions
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Draw original image
    ctx.drawImage(image, 0, 0);

    // Calculate bar dimensions (scale based on image size)
    const scaleFactor = width / 400;
    const barHeight = Math.max(40, 60 * scaleFactor);
    const fontSize = Math.max(16, 24 * scaleFactor);
    const barOpacity = 0.6;

    // Draw semi-transparent black bar at bottom
    ctx.fillStyle = `rgba(0, 0, 0, ${barOpacity})`;
    ctx.fillRect(0, height - barHeight, width, barHeight);

    // Configure text
    ctx.fillStyle = "white";
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Calculate text position (centered in bar)
    const textX = width / 2;
    const textY = height - (barHeight / 2);

    // Draw text
    ctx.fillText(pageData.title, textX, textY);

    // Convert canvas to PNG buffer
    const pngBuffer = canvas.toBuffer("image/png");
    const pngBlob = new Blob([pngBuffer], { type: "image/png" });

    // Upload to storage
    const fileName = `page-${pageId}-text-${Date.now()}.png`;
    const filePath = `${user.id}/${bookId}/text/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("page-images")
      .upload(filePath, pngBlob, { 
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
