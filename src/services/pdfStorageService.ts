/**
 * @fileoverview PDF Storage Service
 * 
 * Handles caching and storage of generated PDFs in Supabase Storage.
 * This eliminates redundant PDF generation by storing PDFs for reuse.
 */

import { supabase } from '@/integrations/supabase/client';

export interface PDFUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export type PDFType = 'book' | 'coloring';

const BUCKET_NAME = 'book-pdfs';

/**
 * Generates the storage path for a PDF
 */
function getPDFStoragePath(bookId: string, type: PDFType): string {
  const suffix = type === 'coloring' ? '-coloring' : '';
  return `${bookId}/${bookId}${suffix}.pdf`;
}

/**
 * Checks if a cached PDF URL is valid (file exists and is accessible)
 */
async function isUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Gets the cached PDF URL for a book if it exists and is valid
 */
export async function getCachedPDFUrl(
  bookId: string,
  type: PDFType
): Promise<string | null> {
  try {
    const column = type === 'coloring' ? 'coloring_pdf_url' : 'pdf_url';
    
    const { data, error } = await supabase
      .from('books')
      .select(column)
      .eq('id', bookId)
      .maybeSingle();

    if (error || !data) {
      console.log(`[PDFStorage] No cached URL found for ${type} PDF of book ${bookId}`);
      return null;
    }

    const cachedUrl = data[column as keyof typeof data] as string | null;
    
    if (!cachedUrl) {
      console.log(`[PDFStorage] No ${type} PDF URL stored for book ${bookId}`);
      return null;
    }

    // Verify the URL is still valid (file exists)
    console.log(`[PDFStorage] Checking if cached ${type} PDF is still accessible...`);
    const valid = await isUrlValid(cachedUrl);
    
    if (!valid) {
      console.log(`[PDFStorage] Cached ${type} PDF URL is no longer valid, will regenerate`);
      // Clear the invalid URL from the database
      await clearPDFUrl(bookId, type);
      return null;
    }

    console.log(`[PDFStorage] Found valid cached ${type} PDF for book ${bookId}`);
    return cachedUrl;
  } catch (error) {
    console.error(`[PDFStorage] Error checking cached PDF:`, error);
    return null;
  }
}

/**
 * Uploads a PDF blob to Supabase Storage
 */
export async function uploadPDFToStorage(
  blob: Blob,
  bookId: string,
  type: PDFType
): Promise<PDFUploadResult> {
  try {
    const path = getPDFStoragePath(bookId, type);
    console.log(`[PDFStorage] Uploading ${type} PDF to ${BUCKET_NAME}/${path}...`);

    // Upload to storage (upsert to replace if exists)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob, {
        contentType: 'application/pdf',
        upsert: true,
        cacheControl: '3600' // 1 hour cache
      });

    if (uploadError) {
      console.error(`[PDFStorage] Upload failed:`, uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    if (!urlData?.publicUrl) {
      return { success: false, error: 'Failed to get public URL' };
    }

    console.log(`[PDFStorage] Upload successful: ${urlData.publicUrl}`);
    return { success: true, publicUrl: urlData.publicUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
    console.error(`[PDFStorage] Upload error:`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Updates the book record with the new PDF URL
 */
export async function updateBookPDFUrl(
  bookId: string,
  pdfUrl: string,
  type: PDFType
): Promise<void> {
  try {
    const column = type === 'coloring' ? 'coloring_pdf_url' : 'pdf_url';
    const timestampColumn = type === 'coloring' ? 'coloring_pdf_generated_at' : 'pdf_generated_at';
    
    console.log(`[PDFStorage] Updating book ${bookId} with ${type} PDF URL...`);

    const { error } = await supabase
      .from('books')
      .update({
        [column]: pdfUrl,
        [timestampColumn]: new Date().toISOString()
      })
      .eq('id', bookId);

    if (error) {
      console.error(`[PDFStorage] Failed to update book record:`, error);
      throw error;
    }

    console.log(`[PDFStorage] Book record updated successfully`);
  } catch (error) {
    console.error(`[PDFStorage] Error updating book PDF URL:`, error);
    throw error;
  }
}

/**
 * Clears the PDF URL from a book record (used when cached file is invalid)
 */
async function clearPDFUrl(bookId: string, type: PDFType): Promise<void> {
  try {
    const column = type === 'coloring' ? 'coloring_pdf_url' : 'pdf_url';
    const timestampColumn = type === 'coloring' ? 'coloring_pdf_generated_at' : 'pdf_generated_at';
    
    await supabase
      .from('books')
      .update({
        [column]: null,
        [timestampColumn]: null
      })
      .eq('id', bookId);
  } catch (error) {
    console.error(`[PDFStorage] Error clearing PDF URL:`, error);
  }
}

/**
 * Downloads a file from a URL and triggers a browser download
 */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    console.log(`[PDFStorage] Downloading cached PDF from ${url}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(downloadUrl);
    console.log(`[PDFStorage] Download initiated successfully`);
  } catch (error) {
    console.error(`[PDFStorage] Download error:`, error);
    throw error;
  }
}

/**
 * Deletes a cached PDF from storage
 */
export async function deleteCachedPDF(bookId: string, type: PDFType): Promise<void> {
  try {
    const path = getPDFStoragePath(bookId, type);
    console.log(`[PDFStorage] Deleting cached PDF at ${BUCKET_NAME}/${path}...`);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error(`[PDFStorage] Delete failed:`, error);
    } else {
      console.log(`[PDFStorage] Deleted successfully`);
    }

    // Also clear the URL from the book record
    await clearPDFUrl(bookId, type);
  } catch (error) {
    console.error(`[PDFStorage] Delete error:`, error);
  }
}
