import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errors } from '../_shared/response.ts';

interface TextImageRequest {
  pageId: string;
  bookId: string;
  imageBlob: string; // Base64 encoded image data from client-side compositing
}

Deno.serve(createHandler({
  name: 'generate-text-image',
  clientMode: 'service',
  requireAuth: true,
}, async ({ supabase, user, req }) => {
  const { pageId, bookId, imageBlob } = await parseBody<TextImageRequest>(req);
  console.log(`Processing text image for page: ${pageId}, book: ${bookId}`);

  if (!pageId || !bookId || !imageBlob) {
    return errors.badRequest('Missing pageId, bookId, or imageBlob');
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
    return errors.notFound('No image record found for this page');
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
  const filePath = `${user!.userId}/${bookId}/text/${fileName}`;

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

  return successResponse({ 
    success: true, 
    textImageUrl: urlData.publicUrl 
  });
}));
