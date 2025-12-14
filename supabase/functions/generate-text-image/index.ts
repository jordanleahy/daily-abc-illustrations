import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  pageId: string;
  bookId: string;
  imageBlob: string; // Base64 encoded image data from client-side compositing
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

    const { pageId, bookId, imageBlob } = await req.json() as RequestBody;
    console.log(`Processing text image for page: ${pageId}, book: ${bookId}`);

    if (!pageId || !bookId || !imageBlob) {
      return new Response(JSON.stringify({ error: "Missing pageId, bookId, or imageBlob" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current image record ID
    const { data: imageData, error: imageError } = await supabase
      .from("page_image_urls")
      .select("id")
      .eq("page_id", pageId)
      .eq("is_latest", true)
      .single();

    if (imageError || !imageData) {
      console.error("Image fetch error:", imageError);
      return new Response(JSON.stringify({ error: "No image record found for this page" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 image
    const base64Data = imageBlob.replace(/^data:image\/\w+;base64,/, "");
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pngBlob = new Blob([bytes], { type: "image/png" });

    // Upload to storage
    const fileName = `page-${pageId}-text-${Date.now()}.png`;
    const filePath = `${user.id}/${bookId}/text/${fileName}`;

    console.log(`Uploading to: ${filePath}`);

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

    console.log(`Text image uploaded successfully: ${urlData.publicUrl}`);

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
