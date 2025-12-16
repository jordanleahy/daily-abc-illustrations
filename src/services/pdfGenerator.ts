/**
 * @fileoverview Client-side PDF Generation Service
 * 
 * This service handles generating PDFs directly in the browser using pdf-lib,
 * eliminating server timeouts and resource issues. It streams images one-by-one
 * into the PDF for optimal memory usage and progress tracking.
 */

import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

export interface PDFGenerationOptions {
  onProgress?: (current: number, total: number, currentPage?: string) => void;
  onError?: (error: string, pageId?: string) => void;
}

export interface PageImageData {
  id: string;
  page_number: number;
  letter: string;
  title: string;
  image_url: string | null;
}

/**
 * Fetches all pages with their latest image URLs for a book
 */
export async function fetchBookPageImages(bookId: string): Promise<PageImageData[]> {
  // Get pages for the book
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, page_number, letter, title')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true });

  if (pagesError) {
    throw new Error(`Failed to fetch pages: ${pagesError.message}`);
  }

  if (!pages || pages.length === 0) {
    throw new Error('No pages found for this book');
  }

  // Get latest image URLs for each page
  const pageImagePromises = pages.map(async (page) => {
    const { data: imageData } = await supabase
      .from('page_image_urls')
      .select('image_url')
      .eq('page_id', page.id)
      .eq('is_latest', true)
      .maybeSingle();

    return {
      id: page.id,
      page_number: page.page_number,
      letter: page.letter,
      title: page.title,
      image_url: imageData?.image_url || null
    };
  });

  return await Promise.all(pageImagePromises);
}

/**
 * Fetches all coloring book images for a book
 */
export async function fetchBookColoringImages(bookId: string): Promise<PageImageData[]> {
  // Get pages for the book
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, page_number, letter, title')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true });

  if (pagesError) {
    throw new Error(`Failed to fetch pages: ${pagesError.message}`);
  }

  if (!pages || pages.length === 0) {
    return [];
  }

  // Get latest coloring image URLs for each page
  const pageImagePromises = pages.map(async (page) => {
    const { data: imageData } = await supabase
      .from('page_image_urls')
      .select('coloring_image_url')
      .eq('page_id', page.id)
      .eq('is_latest', true)
      .not('coloring_image_url', 'is', null)
      .maybeSingle();

    return {
      id: page.id,
      page_number: page.page_number,
      letter: page.letter,
      title: page.title,
      image_url: imageData?.coloring_image_url || null
    };
  });

  const allPages = await Promise.all(pageImagePromises);
  // Only return pages that have coloring images
  return allPages.filter(p => p.image_url);
}

/**
 * Fetches image data for a single page
 */
export async function fetchPageImage(pageId: string): Promise<PageImageData | null> {
  // Get page info
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id, page_number, letter, title')
    .eq('id', pageId)
    .single();

  if (pageError || !page) {
    throw new Error(`Failed to fetch page: ${pageError?.message}`);
  }

  // Get latest image URL
  const { data: imageData } = await supabase
    .from('page_image_urls')
    .select('image_url')
    .eq('page_id', pageId)
    .eq('is_latest', true)
    .maybeSingle();

  return {
    id: page.id,
    page_number: page.page_number,
    letter: page.letter,
    title: page.title,
    image_url: imageData?.image_url || null
  };
}

/**
 * Downloads an image from a URL and returns the array buffer
 */
async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Detects image format from array buffer
 */
function detectImageFormat(buffer: ArrayBuffer): 'png' | 'jpg' | 'jpeg' | 'webp' | null {
  const bytes = new Uint8Array(buffer);
  
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (bytes.length >= 8 && 
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'png';
  }
  
  // JPEG signature: FF D8 FF
  if (bytes.length >= 3 && 
      bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'jpg';
  }
  
  // WebP signature: RIFF ... WEBP
  if (bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'webp';
  }
  
  return null;
}

/**
 * Converts WebP image to PNG using canvas
 */
async function convertWebPToPNG(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'image/webp' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert WebP to PNG'));
          return;
        }
        
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load WebP image'));
    };
    
    img.src = url;
  });
}

/**
 * Converts WebP image to JPG using canvas
 */
async function convertWebPToJPG(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'image/webp' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to convert WebP to JPG'));
          return;
        }
        
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/jpeg', 0.95);
      
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load WebP image'));
    };
    
    img.src = url;
  });
}

/**
 * Generates a PDF from page image data
 */
export async function generatePDF(
  pages: PageImageData[], 
  options: PDFGenerationOptions = {}
): Promise<Uint8Array> {
  const { onProgress, onError } = options;
  
  // Filter pages with images
  const pagesWithImages = pages.filter(page => page.image_url);
  
  console.log(`[PDF generatePDF] Processing ${pagesWithImages.length} pages with images out of ${pages.length} total`);
  
  if (pagesWithImages.length === 0) {
    throw new Error('No pages with images found');
  }

  const pdfDoc = await PDFDocument.create();
  let processedCount = 0;
  const failedPages: string[] = [];

  for (const page of pagesWithImages) {
    try {
      console.log(`[PDF] Processing page ${page.letter} (${processedCount + 1}/${pagesWithImages.length})...`);
      onProgress?.(processedCount, pagesWithImages.length, page.letter);

      if (!page.image_url) {
        failedPages.push(`Page ${page.letter}: No image URL`);
        continue;
      }

      // Download image
      console.log(`[PDF] Downloading image for page ${page.letter}...`);
      let imageBuffer = await downloadImage(page.image_url);
      console.log(`[PDF] Downloaded ${imageBuffer.byteLength} bytes for page ${page.letter}`);
      
      let format = detectImageFormat(imageBuffer);
      console.log(`[PDF] Detected format: ${format} for page ${page.letter}`);
      
      if (!format) {
        failedPages.push(`Page ${page.letter}: Unsupported image format`);
        onError?.(`Unsupported image format for page ${page.letter}`, page.id);
        console.error(`[PDF] Unsupported format for page ${page.letter}`);
        continue;
      }

      // Convert WebP to PNG if needed
      if (format === 'webp') {
        console.log(`[PDF] Converting WebP to PNG for page ${page.letter}...`);
        try {
          imageBuffer = await convertWebPToPNG(imageBuffer);
          format = 'png';
          console.log(`[PDF] Converted to PNG successfully for page ${page.letter}`);
        } catch (conversionError) {
          failedPages.push(`Page ${page.letter}: Failed to convert WebP image`);
          onError?.(`Failed to convert WebP image for page ${page.letter}`, page.id);
          console.error(`[PDF] WebP conversion failed for page ${page.letter}:`, conversionError);
          continue;
        }
      }

      // Embed image in PDF
      console.log(`[PDF] Embedding ${format} image for page ${page.letter}...`);
      let image;
      try {
        if (format === 'png') {
          image = await pdfDoc.embedPng(imageBuffer);
        } else {
          image = await pdfDoc.embedJpg(imageBuffer);
        }
        console.log(`[PDF] Embedded successfully: ${image.width}x${image.height} for page ${page.letter}`);
      } catch (embedError) {
        failedPages.push(`Page ${page.letter}: Failed to embed image`);
        onError?.(`Failed to embed image for page ${page.letter}`, page.id);
        console.error(`[PDF] Embed failed for page ${page.letter}:`, embedError);
        continue;
      }

      // Create page with image dimensions
      const pdfPage = pdfDoc.addPage([image.width, image.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
      console.log(`[PDF] Added page ${page.letter} to PDF`);

      processedCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failedPages.push(`Page ${page.letter}: ${errorMessage}`);
      onError?.(errorMessage, page.id);
      console.error(`[PDF] Error processing page ${page.letter}:`, error);
    }
  }

  onProgress?.(processedCount, pagesWithImages.length);

  console.log(`[PDF] Final stats: ${processedCount} succeeded, ${failedPages.length} failed`);
  
  if (processedCount === 0) {
    throw new Error(`No pages could be processed. Errors: ${failedPages.join(', ')}`);
  }

  if (failedPages.length > 0) {
    console.warn('[PDF] Failed pages:', failedPages);
  }

  console.log(`[PDF] Saving PDF document with ${processedCount} pages...`);
  return await pdfDoc.save();
}

/**
 * Generates and downloads a PDF for a book
 */
export async function generateBookPDF(
  bookId: string, 
  bookName: string,
  options: PDFGenerationOptions = {}
): Promise<void> {
  try {
    // Fetch page images
    console.log(`[PDF] Fetching images for book ${bookId}...`);
    const pages = await fetchBookPageImages(bookId);
    console.log(`[PDF] Found ${pages.length} total pages`);
    
    const pagesWithImages = pages.filter(p => p.image_url);
    const pagesWithoutImages = pages.filter(p => !p.image_url);
    
    console.log(`[PDF] ${pagesWithImages.length} pages have images`);
    if (pagesWithoutImages.length > 0) {
      console.log(`[PDF] ${pagesWithoutImages.length} pages missing images:`, 
        pagesWithoutImages.map(p => p.letter).join(', '));
    }
    
    // Generate PDF
    console.log(`[PDF] Starting PDF generation...`);
    const pdfBytes = await generatePDF(pages, options);
    console.log(`[PDF] PDF generated successfully (${pdfBytes.length} bytes)`);
    
    // Create download
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${bookName.replace(/[^a-zA-Z0-9\s-]/g, '')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log(`[PDF] Download initiated successfully`);
  } catch (error) {
    console.error('[PDF] Error during PDF generation:', error);
    throw error;
  }
}

/**
 * Generates and downloads a coloring book PDF for a book
 */
export async function generateColoringBookPDF(
  bookId: string, 
  bookName: string,
  options: PDFGenerationOptions = {}
): Promise<void> {
  try {
    // Fetch coloring images
    console.log(`[PDF] Fetching coloring images for book ${bookId}...`);
    const pages = await fetchBookColoringImages(bookId);
    console.log(`[PDF] Found ${pages.length} coloring pages`);
    
    if (pages.length === 0) {
      throw new Error('No coloring pages found for this book');
    }
    
    // Generate PDF
    console.log(`[PDF] Starting coloring book PDF generation...`);
    const pdfBytes = await generatePDF(pages, options);
    console.log(`[PDF] Coloring book PDF generated successfully (${pdfBytes.length} bytes)`);
    
    // Create download
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${bookName.replace(/[^a-zA-Z0-9\s-]/g, '')}-coloring-pages.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log(`[PDF] Coloring book download initiated successfully`);
  } catch (error) {
    console.error('[PDF] Error during coloring book PDF generation:', error);
    throw error;
  }
}

/**
 * Generates and downloads a PDF for a single page
 */
export async function generatePagePDF(
  pageId: string,
  pageName: string,
  options: PDFGenerationOptions = {}
): Promise<void> {
  try {
    // Fetch page image
    const pageData = await fetchPageImage(pageId);
    
    if (!pageData) {
      throw new Error('Page not found');
    }
    
    // Generate PDF
    const pdfBytes = await generatePDF([pageData], options);
    
    // Create download
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pageName.replace(/[^a-zA-Z0-9\s-]/g, '')}-page-${pageData.letter}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    throw error;
  }
}

/**
 * Downloads all book images as individual files and creates a ZIP archive
 * @returns Object with total and successful image counts
 */
export async function downloadAllBookImages(
  bookId: string,
  bookName: string,
  options: PDFGenerationOptions = {}
): Promise<{ totalCount: number; successCount: number }> {
  const { onProgress, onError } = options;
  
  try {
    // Fetch all page images
    console.log(`[ZIP] Fetching images for book ${bookId}...`);
    const pages = await fetchBookPageImages(bookId);
    const pagesWithImages = pages.filter(page => page.image_url);
    
    console.log(`[ZIP] Found ${pagesWithImages.length} pages with images`);
    
    if (pagesWithImages.length === 0) {
      throw new Error('No pages with images found');
    }

    // Create ZIP instance
    const zip = new JSZip();
    const sanitizedBookName = bookName.replace(/[^a-zA-Z0-9\s-]/g, '');
    let processedCount = 0;

    // Download and add each image to ZIP
    const failedPages: Array<{ letter: string, error: string }> = [];
    
    for (const page of pagesWithImages) {
      try {
        console.log(`[ZIP] Processing page ${page.letter} (${processedCount + 1}/${pagesWithImages.length})...`);
        console.log(`[ZIP] Image URL for ${page.letter}:`, page.image_url);
        onProgress?.(processedCount, pagesWithImages.length, page.letter);

        if (!page.image_url) {
          const msg = `No image URL`;
          console.warn(`[ZIP] Skipping page ${page.letter} - ${msg}`);
          failedPages.push({ letter: page.letter, error: msg });
          continue;
        }

        // Download image with timeout
        console.log(`[ZIP] Fetching image for page ${page.letter}...`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch(page.image_url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          console.log(`[ZIP] Fetch response for ${page.letter}: ${response.status} ${response.statusText}`);
          
          if (!response.ok) {
            const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
            console.error(`[ZIP] ${errorMsg} for page ${page.letter}`);
            failedPages.push({ letter: page.letter, error: errorMsg });
            onError?.(errorMsg, page.id);
            continue; // Skip this image but continue with others
          }

          const blob = await response.blob();
          console.log(`[ZIP] Downloaded blob for ${page.letter}: ${blob.size} bytes, type: ${blob.type}`);
          
          // Validate blob has content
          if (blob.size === 0) {
            const errorMsg = 'Downloaded image is empty (0 bytes)';
            console.error(`[ZIP] ${errorMsg} for page ${page.letter}`);
            failedPages.push({ letter: page.letter, error: errorMsg });
            onError?.(errorMsg, page.id);
            continue;
          }
          
          // Convert blob to array buffer for format detection and conversion
          let imageBuffer = await blob.arrayBuffer();
          let format = detectImageFormat(imageBuffer);
          console.log(`[ZIP] Detected format: ${format} for page ${page.letter}`);
          
          // Convert WebP to JPG
          let finalBlob = blob;
          let extension = 'jpg';
          
          if (format === 'webp') {
            console.log(`[ZIP] Converting WebP to JPG for page ${page.letter}...`);
            try {
              imageBuffer = await convertWebPToJPG(imageBuffer);
              finalBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
              extension = 'jpg';
              console.log(`[ZIP] Converted to JPG successfully for page ${page.letter}`);
            } catch (conversionError) {
              console.error(`[ZIP] WebP conversion failed for page ${page.letter}:`, conversionError);
              failedPages.push({ letter: page.letter, error: 'Failed to convert WebP to JPG' });
              onError?.('Failed to convert WebP to JPG', page.id);
              continue;
            }
          } else if (format === 'png') {
            extension = 'png';
          } else if (format === 'jpg' || format === 'jpeg') {
            extension = 'jpg';
          } else {
            // Unknown format - try to use mime type or default to jpg
            if (blob.type) {
              const typeMatch = blob.type.match(/image\/(.*)/);
              if (typeMatch) {
                extension = typeMatch[1] === 'jpeg' ? 'jpg' : typeMatch[1];
              }
            }
          }

          // Add to ZIP with filename format: BookName-A.jpg
          const filename = `${page.title} - ${sanitizedBookName}.${extension}`;
          console.log(`[ZIP] Adding ${filename} to archive (${finalBlob.size} bytes)...`);
          zip.file(filename, finalBlob);

          console.log(`[ZIP] Successfully added ${filename} to archive`);
          processedCount++;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            const errorMsg = 'Request timeout (30s exceeded)';
            console.error(`[ZIP] ${errorMsg} for page ${page.letter}`);
            failedPages.push({ letter: page.letter, error: errorMsg });
            onError?.(errorMsg, page.id);
          } else {
            throw fetchError; // Re-throw to outer catch
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ZIP] Error processing page ${page.letter}:`, error);
        failedPages.push({ letter: page.letter, error: errorMessage });
        onError?.(errorMessage, page.id);
        // Continue processing other images even if one fails
      }
    }

    // Log summary of failed pages
    if (failedPages.length > 0) {
      console.error(`[ZIP] Failed to download ${failedPages.length} pages:`, 
        failedPages.map(f => `${f.letter} (${f.error})`).join(', '));
    }

    onProgress?.(processedCount, pagesWithImages.length);

    if (processedCount === 0) {
      throw new Error(`No images could be processed. All ${pagesWithImages.length} downloads failed.`);
    }

    if (failedPages.length > 0) {
      console.warn(`[ZIP] Completed with ${processedCount} successes and ${failedPages.length} failures`);
    }

    console.log(`[ZIP] Generating ZIP file with ${processedCount} images...`);
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Create download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedBookName}-Images.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    console.log(`[ZIP] Download initiated successfully`);
    
    return {
      totalCount: pagesWithImages.length,
      successCount: processedCount
    };
  } catch (error) {
    console.error('[ZIP] Error during image download:', error);
    throw error;
  }
}