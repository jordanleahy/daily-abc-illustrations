/**
 * @fileoverview Client-side PDF Generation Service
 * 
 * This service handles generating PDFs directly in the browser using pdf-lib,
 * eliminating server timeouts and resource issues. It streams images one-by-one
 * into the PDF for optimal memory usage and progress tracking.
 */

import { PDFDocument } from 'pdf-lib';
import { supabase } from '@/integrations/supabase/client';

export interface PDFGenerationOptions {
  onProgress?: (current: number, total: number, currentPage?: string) => void;
  onError?: (error: string, pageId?: string) => void;
}

export interface PageImageData {
  id: string;
  page_number: number;
  letter: string;
  image_url: string | null;
}

/**
 * Fetches all pages with their latest image URLs for a book
 */
export async function fetchBookPageImages(bookId: string): Promise<PageImageData[]> {
  // Get pages for the book
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, page_number, letter')
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
      image_url: imageData?.image_url || null
    };
  });

  return await Promise.all(pageImagePromises);
}

/**
 * Fetches image data for a single page
 */
export async function fetchPageImage(pageId: string): Promise<PageImageData | null> {
  // Get page info
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id, page_number, letter')
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
 * Generates a PDF from page image data
 */
export async function generatePDF(
  pages: PageImageData[], 
  options: PDFGenerationOptions = {}
): Promise<Uint8Array> {
  const { onProgress, onError } = options;
  
  // Filter pages with images
  const pagesWithImages = pages.filter(page => page.image_url);
  
  if (pagesWithImages.length === 0) {
    throw new Error('No pages with images found');
  }

  const pdfDoc = await PDFDocument.create();
  let processedCount = 0;
  const failedPages: string[] = [];

  for (const page of pagesWithImages) {
    try {
      onProgress?.(processedCount, pagesWithImages.length, page.letter);

      if (!page.image_url) {
        failedPages.push(`Page ${page.letter}: No image URL`);
        continue;
      }

      // Download image
      let imageBuffer = await downloadImage(page.image_url);
      let format = detectImageFormat(imageBuffer);
      
      if (!format) {
        failedPages.push(`Page ${page.letter}: Unsupported image format`);
        onError?.(`Unsupported image format for page ${page.letter}`, page.id);
        continue;
      }

      // Convert WebP to PNG if needed
      if (format === 'webp') {
        try {
          imageBuffer = await convertWebPToPNG(imageBuffer);
          format = 'png';
        } catch (conversionError) {
          failedPages.push(`Page ${page.letter}: Failed to convert WebP image`);
          onError?.(`Failed to convert WebP image for page ${page.letter}`, page.id);
          continue;
        }
      }

      // Embed image in PDF
      let image;
      try {
        if (format === 'png') {
          image = await pdfDoc.embedPng(imageBuffer);
        } else {
          image = await pdfDoc.embedJpg(imageBuffer);
        }
      } catch (embedError) {
        failedPages.push(`Page ${page.letter}: Failed to embed image`);
        onError?.(`Failed to embed image for page ${page.letter}`, page.id);
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

      processedCount++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failedPages.push(`Page ${page.letter}: ${errorMessage}`);
      onError?.(errorMessage, page.id);
    }
  }

  onProgress?.(processedCount, pagesWithImages.length);

  if (processedCount === 0) {
    throw new Error(`No pages could be processed. Errors: ${failedPages.join(', ')}`);
  }

  if (failedPages.length > 0) {
    console.warn('Some pages failed to process:', failedPages);
  }

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
    const pages = await fetchBookPageImages(bookId);
    
    // Generate PDF
    const pdfBytes = await generatePDF(pages, options);
    
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
  } catch (error) {
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