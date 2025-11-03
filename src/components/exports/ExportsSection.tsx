/**
 * @fileoverview ExportsSection Component
 * 
 * This file contains the ExportsSection component which provides a unified interface
 * for managing PDF exports and daily publication queue functionality.
 * 
 * Key Features:
 * - Client-side PDF generation and download with progress tracking
 * - Daily publication queue management
 * - Automatic QR code generation when adding to queue
 * - Expected publication date calculations
 * - Public link sharing and copying functionality
 * - Product description generation for sales-focused content
 * 
 * All PDF generation is handled client-side using pdf-lib for optimal performance.
 */

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Globe, Eye, Copy, History, RefreshCw, ShoppingCart, Save, Check, Download } from 'lucide-react';
import { useExpectedPublicationDate } from '@/hooks/useExpectedPublicationDate';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { useBook } from '@/hooks/useBook';
import { useUpdateBookStatus } from '@/hooks/useUpdateBookStatus';
import { useBookSeoMetadata } from '@/hooks/useBookSeoMetadata';
import { formatScheduleTimestamp } from '@/utils/timezone';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SITE_CONFIG } from '@/config/site';
import { DailyPublishedStatus } from '@/types/dailyPublished';
import { PublicationStatus } from '@/types/shared';
import { getAppendPublishDate } from '@/utils/publishQueue';

/**
 * Props for the ExportsSection component
 */
interface ExportsSectionProps {
  /** Type of content being exported - either 'book' or 'page' */
  contentType: 'book' | 'page';
  /** Unique identifier for the content */
  contentId: string;
  /** Display name of the content for user-facing messages */
  contentName: string;
}

/**
 * Generates a URL-safe slug from a title string
 * Matches the database generate_slug function logic for consistency
 * 
 * @param title - The title to convert to a slug
 * @returns URL-safe slug string (max 60 chars)
 */
const generateSlugFromTitle = (title: string): string => {
  // Convert to lowercase and remove special characters
  let slug = title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .trim()
    .replace(/^-+|-+$/g, '');    // Remove leading/trailing hyphens
  
  // Truncate to 60 characters
  slug = slug.substring(0, 60);
  
  // Remove trailing hyphen if truncation created one
  slug = slug.replace(/-+$/, '');
  
  return slug || 'untitled'; // Fallback if empty
};

/**
 * Generates a unique slug by checking for existing slugs and appending a timestamp if needed
 * @param title - The title to convert to a slug
 * @param bookId - The book ID to check for existing publications
 * @returns Unique URL-safe slug string
 */
const generateUniqueSlug = async (title: string, bookId: string): Promise<string> => {
  const baseSlug = generateSlugFromTitle(title);
  
  // Check if this slug already exists for any publication
  const { data: existing } = await supabase
    .from('daily_published')
    .select('slug')
    .eq('slug', baseSlug)
    .maybeSingle();
  
  // If no conflict, use the base slug
  if (!existing) {
    return baseSlug;
  }
  
  // If conflict exists, append timestamp to make it unique
  // Use date format: YYYYMMDD
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Ensure total length stays within 60 chars
  // Format: base-slug-YYYYMMDD
  const maxBaseLength = 60 - timestamp.length - 1; // -1 for the hyphen
  const truncatedBase = baseSlug.substring(0, maxBaseLength).replace(/-+$/, '');
  
  return `${truncatedBase}-${timestamp}`;
};

/**
 * ExportsSection Component
 * 
 * A comprehensive component that manages both PDF exports and daily publication queue functionality.
 * Provides users with the ability to:
 * - Generate and download PDF exports of their content using client-side processing
 * - Add books to the daily publication queue
 * - Automatically generate QR codes when adding to queue
 * - View publication status and expected dates
 * - Copy public links for shared content
 * - Generate sales-focused product descriptions
 * 
 * @param props - Component props
 * @param props.contentType - Type of content ('book' or 'page')
 * @param props.contentId - Unique identifier for the content
 * @param props.contentName - Display name for user-facing messages
 * @returns JSX element containing export controls and queue management
 */
export const ExportsSection: React.FC<ExportsSectionProps> = ({
  contentType,
  contentId,
  contentName
}) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { data: expectedDate, isLoading: dateLoading } = useExpectedPublicationDate(contentId);
  const { generateQRCode } = useBookQRCode(contentType === 'book' ? contentId : undefined);
  const { data: bookData } = useBook(contentType === 'book' ? contentId : undefined);
  const { data: existingSeoMetadata } = useBookSeoMetadata(contentType === 'book' ? contentId : undefined);
  const updateBookStatusMutation = useUpdateBookStatus();
  const [existingPublication, setExistingPublication] = useState<any>(null);
  const [publicationHistory, setPublicationHistory] = useState<any[]>([]);
  const [isCheckingPublication, setIsCheckingPublication] = useState(false);
  const [isGeneratingProductDescription, setIsGeneratingProductDescription] = useState(false);
  const [productDescription, setProductDescription] = useState<string>('');
  const [isProductDescriptionSaved, setIsProductDescriptionSaved] = useState(true);
  const [isSavingProductDescription, setIsSavingProductDescription] = useState(false);
  const [isRefreshingLinkedInPost, setIsRefreshingLinkedInPost] = useState(false);

  /**
   * Handles client-side PDF generation for the content
   * Uses pdf-lib to generate PDFs directly in the browser
   */
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, currentPage: '' });
  
  /**
   * Handles downloading all images as a ZIP file
   */
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [imageDownloadProgress, setImageDownloadProgress] = useState({ current: 0, total: 0, currentPage: '' });

  const handleCreatePdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress({ current: 0, total: 0, currentPage: '' });

    try {
      // Import the PDF generator service
      const { generateBookPDF, generatePagePDF } = await import('@/services/pdfGenerator');

      const options = {
        onProgress: (current: number, total: number, currentPage?: string) => {
          setPdfProgress({ current, total, currentPage: currentPage || '' });
        },
        onError: (error: string, pageId?: string) => {
          console.warn(`PDF generation warning: ${error}`, pageId);
        }
      };

      toast({
        title: "PDF Generation Started",
        description: "Generating your PDF directly in the browser..."
      });

      if (contentType === 'book') {
        await generateBookPDF(contentId, contentName, options);
      } else {
        await generatePagePDF(contentId, contentName, options);
      }

      toast({
        title: "PDF Generated Successfully",
        description: "Your PDF has been downloaded successfully."
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: "destructive",
        title: "PDF Generation Failed",
        description: errorMessage
      });
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress({ current: 0, total: 0, currentPage: '' });
    }
  };

  /**
   * Handles downloading all images as individual files in a ZIP archive
   */
  const handleDownloadAllImages = async () => {
    setIsDownloadingImages(true);
    setImageDownloadProgress({ current: 0, total: 0, currentPage: '' });

    try {
      const { downloadAllBookImages } = await import('@/services/pdfGenerator');
      
      const options = {
        onProgress: (current: number, total: number, currentPage?: string) => {
          setImageDownloadProgress({ current, total, currentPage: currentPage || '' });
        },
        onError: (error: string, pageId?: string) => {
          console.warn(`Image download warning: ${error}`, pageId);
        }
      };

      toast({
        title: "Downloading Images",
        description: "Preparing all images for download..."
      });

      const result = await downloadAllBookImages(contentId, contentName, options);

      if (result.successCount === result.totalCount) {
        toast({
          title: "Images Downloaded Successfully",
          description: `All ${result.totalCount} images have been downloaded as a ZIP file.`
        });
      } else {
        toast({
          title: "Download Completed with Warnings",
          description: `Downloaded ${result.successCount} of ${result.totalCount} images. Check console for details on failed images.`,
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Error downloading images:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: errorMessage
      });
    } finally {
      setIsDownloadingImages(false);
      setImageDownloadProgress({ current: 0, total: 0, currentPage: '' });
    }
  };

  /**
   * Check for existing daily publication entries on component mount
   * Only runs for book content type
   */
  useEffect(() => {
    const checkExistingPublication = async () => {
      if (contentType !== 'book') return;
      
      setIsCheckingPublication(true);
      try {
        // Get all publications for this book, ordered by most recent first
        const { data, error } = await supabase
          .from('daily_published')
          .select('*')
          .eq('book_id', contentId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setPublicationHistory(data);
          
          // Find the current active/queued/draft publication
          const currentPublication = data.find(pub => 
            ['draft', 'queued', 'active'].includes(pub.status)
          );
          
          // If no current publication, use the most recent one (could be expired)
          setExistingPublication(currentPublication || data[0] || null);
        }
      } catch (error) {
        console.error('Error checking publication:', error);
      } finally {
        setIsCheckingPublication(false);
      }
    };

    checkExistingPublication();
  }, [contentId, contentType]);

  /**
   * Load existing product description from book data
   */
  useEffect(() => {
    if (contentType === 'book' && bookData?.product_description) {
      setProductDescription(bookData.product_description);
      setIsProductDescriptionSaved(true);
    }
  }, [contentType, bookData?.product_description]);

  /**
   * Auto-fix missing slugs for existing publications
   */
  useEffect(() => {
    const fixMissingSlug = async () => {
      if (!existingPublication || existingPublication.slug || contentType !== 'book') {
        return;
      }

      console.log('🔧 Fixing missing slug for publication:', existingPublication.id);
      
      try {
        const slug = await generateUniqueSlug(contentName, contentId);
        
        const { error } = await supabase
          .from('daily_published')
          .update({ slug, updated_at: new Date().toISOString() })
          .eq('id', existingPublication.id);

        if (error) {
          console.error('Failed to fix slug:', error);
          return;
        }

        // Refresh the publication data
        const { data: updated } = await supabase
          .from('daily_published')
          .select('*')
          .eq('id', existingPublication.id)
          .single();

        if (updated) {
          setExistingPublication(updated);
          toast({
            title: "Public URL Generated",
            description: "Missing slug has been automatically fixed."
          });
        }
      } catch (error) {
        console.error('Error fixing slug:', error);
      }
    };

    fixMissingSlug();
  }, [existingPublication?.id, existingPublication?.slug]);

  /**
   * Auto-add to queue when book status changes to 'published'
   * Automatically generates SEO and adds book to daily publication queue
   */
  useEffect(() => {
    const autoAddToQueue = async () => {
      // Only proceed if:
      // 1. Content is a book
      // 2. Book status is 'published'
      // 3. No existing publication (or only draft/expired)
      // 4. Not currently checking publication status
      if (
        contentType !== 'book' || 
        bookData?.status !== PublicationStatus.PUBLISHED ||
        isCheckingPublication ||
        (existingPublication && ['queued', 'active'].includes(existingPublication.status))
      ) {
        return;
      }

      console.log('📚 Auto-adding published book to queue:', contentName);
      
      // Trigger the add to queue process
      await handleAddToQueue();
    };

    autoAddToQueue();
  }, [contentType, bookData?.status, existingPublication]);

  /**
   * Formats a date string to a readable format with full details
   * Handles DATE-only strings (YYYY-MM-DD) without timezone conversion issues
   * @param dateString - ISO date string to format (e.g., "2025-11-02")
   * @returns Formatted date string (e.g., "Saturday, November 2, 2025")
   */
  const formatPublishDate = (dateString: string): string => {
    // Parse date components directly to avoid timezone issues
    // DATE-only strings from database (YYYY-MM-DD) should not shift days
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    
    // Create date in local timezone (not UTC)
    // Month is 0-indexed in JavaScript Date
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  /**
   * Generates appropriate status message for daily queue based on publication state
   * Uses early returns for clarity instead of nested ternaries
   * Includes type-safe handling of all DailyPublishedStatus values
   * @returns User-friendly status message string
   */
  const getDailyQueueStatusMessage = (): string => {
    // Case 1: No publication exists yet (never been queued)
    if (!existingPublication) {
      if (dateLoading) {
        return 'Calculating publication date...';
      }
      
      if (expectedDate) {
        return `This would be published on ${formatPublishDate(expectedDate.toISOString())}`;
      }
      
      return 'Add your book to the daily publication queue';
    }

    // Case 2: Draft status (edge case - shouldn't normally appear in queue)
    if (existingPublication.status === 'draft') {
      return 'Currently in draft status';
    }

    // Get formatted date once for reuse
    const formattedDate = formatPublishDate(existingPublication.publish_date);

    // Case 3: Handle each publication status explicitly
    // TypeScript will ensure all DailyPublishedStatus values are handled
    const status: DailyPublishedStatus = existingPublication.status;
    
    switch (status) {
      case 'expired':
        return `Previously published on ${formattedDate} - Now expired`;
      
      case 'queued':
        return `Scheduled to publish on ${formattedDate} at 7:01 AM ET`;
      
      case 'active':
        return `Currently active, published on ${formattedDate} at 7:01 AM ET`;
      
      case 'draft':
        // Already handled above, but include for exhaustiveness
        return 'Currently in draft status';
      
      default:
        // TypeScript will error if we add a new status and forget to handle it
        const exhaustiveCheck: never = status;
        return `Currently ${exhaustiveCheck} in the publication queue`;
    }
  };

  /**
   * Determines the button text, action, and state based on PDF generation status
   * 
   * @returns Object containing button configuration (text, action, disabled state, icon)
   */
  const getButtonState = () => {
    if (isGeneratingPdf) {
      const progressText = pdfProgress.total > 0 
        ? `Generating... (${pdfProgress.current}/${pdfProgress.total}${pdfProgress.currentPage ? ` - Page ${pdfProgress.currentPage}` : ''})`
        : 'Generating PDF...';
      return { text: progressText, action: () => {}, disabled: true, icon: FileText };
    }

    return { text: 'Generate PDF', action: handleCreatePdf, disabled: false, icon: FileText };
  };

  /**
   * Opens the appropriate page based on publication status
   * Active publications open the public page, others open the schedule
   */
  const handleViewPublication = () => {
    if (existingPublication) {
      if (existingPublication.status === 'active') {
        window.open(`/daily-published/${existingPublication.id}`, '_blank');
      } else if (existingPublication.status === 'expired') {
        window.open(`/daily-published/${existingPublication.id}`, '_blank');
      } else {
        window.open('/daily-published-schedule', '_blank');
      }
    }
  };

  /**
   * Republishes an expired book by adding it back to the queue
   */
  const handleRepublish = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to republish content.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get next publish date (appends to end of queue - FIFO)
      const nextDate = await getAppendPublishDate(supabase);
      
      // Create new daily publication scheduled for next available date
      // Generate unique slug for republished books
      const slug = await generateUniqueSlug(contentName, contentId);

      const { data: newPublication, error: insertError } = await supabase
        .from('daily_published')
        .insert({
          book_id: contentId,
          title: contentName,
          description: `${SITE_CONFIG.dailyContent.description} featuring ${contentName}`,
          status: 'queued' as const,
          is_active: false,
          publish_date: nextDate,
          slug: slug // Add slug to insert
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error republishing:', insertError);
        throw insertError;
      }

      // Get OG image URL from existing SEO metadata (from previous publication)
      let ogImageUrl: string | null = null;
      if (existingPublication?.id) {
        const { data: oldSeoData } = await supabase
          .from('seo_metadata')
          .select('og_image_url')
          .eq('daily_published_id', existingPublication.id)
          .eq('is_latest', true)
          .maybeSingle();
        
        ogImageUrl = oldSeoData?.og_image_url || null;
      }

      // Generate SEO metadata for the new publication
      const { error: seoError } = await supabase.functions.invoke('generate-seo-metadata', {
        body: {
          bookId: contentId,
          dailyPublishedId: newPublication.id,
          contentTitle: contentName,
          bookDescription: bookData?.book_description,
          ogImageUrl,
          userId: user.id
        }
      });

      if (seoError) {
        console.warn('Failed to generate SEO metadata:', seoError);
        // Don't fail the republish if SEO generation fails
      }

      const formattedDate = new Date(nextDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      });

      toast({
        title: "Republished Successfully!",  
        description: `${contentName} has been scheduled for ${formattedDate} at 7:01 AM Eastern Time.`,
      });

      // Update local state
      setExistingPublication(newPublication);
      setPublicationHistory(prev => [newPublication, ...prev]);
      
      // Open the queue page to show status
      window.open('/daily-published-schedule', '_blank');

    } catch (error: any) {
      console.error('Error republishing:', error);
      toast({
        title: "Failed to Republish",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  /**
   * Generates LinkedIn post text based on SEO title, public URL, and publication date
   */
  const getLinkedInPostText = () => {
    if (!existingPublication) return '';
    
    // Use SEO title if available, fallback to regular title
    const title = existingSeoMetadata?.seo_title || existingPublication.title;
    
    // Format the publish date as "Saturday, November 15"
    const publishDate = existingPublication.publish_date
      ? new Date(existingPublication.publish_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long', 
          day: 'numeric'
        })
      : 'TBD';
    
    // Every publication MUST have a slug now - no fallback
    if (!existingPublication.slug) {
      console.error('Missing slug for daily_published:', existingPublication.id, existingPublication.title);
      return `${title}\n⚠️ Missing public URL - This is a system error. Please contact support.\nScheduled for ${publishDate}`;
    }

    const publicUrl = `${SITE_CONFIG.productionUrl}/book/${existingPublication.slug}`;
    
    return `${title}\n${publicUrl}\nAvailable for monthly users | Runs for Free On ${publishDate}`;
  };

  /**
   * Manually refreshes LinkedIn post data by invalidating SEO metadata cache
   * Useful when user has just updated SEO title and wants immediate update
   */
  const handleRefreshLinkedInPost = async () => {
    setIsRefreshingLinkedInPost(true);
    
    try {
      // Invalidate the book SEO metadata query to force a fresh fetch
      await queryClient.invalidateQueries({
        queryKey: ['book-seo-metadata', contentId]
      });
      
      // Also invalidate daily published data to ensure everything is in sync
      await queryClient.invalidateQueries({
        queryKey: ['daily-published-by-id']
      });
      
      // Wait a brief moment for the queries to refetch
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "LinkedIn Post Updated",
        description: "Post content has been refreshed with the latest SEO data."
      });
    } catch (error) {
      console.error('Error refreshing LinkedIn post:', error);
      toast({
        title: "Refresh Failed",
        description: "Unable to refresh post content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshingLinkedInPost(false);
    }
  };

  /**
   * Copies the LinkedIn post text to clipboard
   */
  const handleCopyLinkedInPost = async () => {
    const postText = getLinkedInPostText();
    
    try {
      await navigator.clipboard.writeText(postText);
      toast({
        title: "LinkedIn post copied!",
        description: "The LinkedIn post text has been copied to your clipboard."
      });
    } catch (error) {
      console.error('Failed to copy LinkedIn post:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy LinkedIn post to clipboard.",
        variant: "destructive"
      });
    }
  };

  /**
   * Saves the product description to the database
   */
  const saveProductDescription = async () => {
    if (contentType !== 'book' || !productDescription.trim()) return;
    
    setIsSavingProductDescription(true);
    
    try {
      const { error } = await supabase
        .from('books')
        .update({ product_description: productDescription.trim() })
        .eq('id', contentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsProductDescriptionSaved(true);
      toast({
        title: "Product Description Saved!",
        description: "Your product description has been saved to the database."
      });
    } catch (error: any) {
      console.error('Error saving product description:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save product description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingProductDescription(false);
    }
  };

  /**
   * Generates a sales-focused product description for the book
   */
  const handleGenerateProductDescription = async () => {
    if (contentType !== 'book') return;
    
    setIsGeneratingProductDescription(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-product-description', {
        body: { bookId: contentId }
      });

      if (error) throw error;

      if (data?.productDescription) {
        setProductDescription(data.productDescription);
        setIsProductDescriptionSaved(false); // Mark as unsaved initially
        
        // Auto-save the generated description
        try {
          const { error: saveError } = await supabase
            .from('books')
            .update({ product_description: data.productDescription })
            .eq('id', contentId)
            .eq('user_id', user?.id);

          if (!saveError) {
            setIsProductDescriptionSaved(true);
          }
        } catch (saveError) {
          console.warn('Auto-save failed, description generated but not saved:', saveError);
        }
        
        toast({
          title: "Product Description Generated!",
          description: "Your sales-focused product description is ready to copy and has been saved."
        });
      } else {
        throw new Error('No product description generated');
      }
    } catch (error: any) {
      console.error('Error generating product description:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate product description. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingProductDescription(false);
    }
  };

  /**
   * Copies the product description to clipboard
   */
  const handleCopyProductDescription = async () => {
    try {
      await navigator.clipboard.writeText(productDescription);
      toast({
        title: "Product description copied!",
        description: "The product description has been copied to your clipboard."
      });
    } catch (error) {
      console.error('Failed to copy product description:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy product description to clipboard.",
        variant: "destructive"
      });
    }
  };

  /**
   * Copies the public daily published link to clipboard
   * Only works when there's an existing publication
   */
  const handleCopyLink = async () => {
    if (existingPublication) {
      const dailyPublishedUrl = `${window.location.origin}/daily-published/${existingPublication.id}`;
      
      try {
        await navigator.clipboard.writeText(dailyPublishedUrl);
        toast({
          title: "Link copied!",
          description: "The daily published link has been copied to your clipboard."
        });
      } catch (error) {
        console.error('Failed to copy link:', error);
        toast({
          title: "Copy failed",
          description: "Unable to copy link to clipboard.",
          variant: "destructive"
        });
      }
    }
  };

   /**
   * Adds content to the daily publication queue and automatically generates QR code
   * 
   * This function handles two main scenarios:
   * 1. Converting existing draft entries to queued status
   * 2. Creating new queue entries from scratch
   * 
   * After successful queue addition, it automatically generates a QR code for the content
   * (only for book content type) and provides user feedback through toast notifications.
   * 
   * The function also opens the publication schedule page to show the queue status.
   * 
   * @throws Will display error toast if authentication fails, queue addition fails, or QR generation fails
   */
   const handleAddToQueue = async () => {
     if (!user?.id) {
       toast({
         title: "Authentication Required",
         description: "You must be logged in to add content to the queue.",
         variant: "destructive"
       });
       return;
     }

     // Helper function to generate QR code after successful queue addition
     const generateQRCodeSafely = async () => {
       if (contentType === 'book' && generateQRCode) {
         try {
           await generateQRCode();
           toast({
             title: "QR Code Generated",
             description: "QR code for your daily published link has been created automatically."
           });
         } catch (error) {
           console.error('Failed to generate QR code:', error);
           toast({
             title: "QR Code Generation Failed",
             description: "Your book was added to the queue, but QR code generation failed. You can generate it manually from the book details page.",
             variant: "destructive"
           });
         }
       }
     };

     // Helper function to generate SEO metadata
     const generateSeoMetadata = async (dailyPublishedId: string) => {
       try {
         const { error: seoError } = await supabase.functions.invoke('generate-seo-metadata', {
           body: {
             bookId: contentId,
             dailyPublishedId,
             contentTitle: contentName,
             bookDescription: bookData?.book_description,
             ogImageUrl: existingSeoMetadata?.og_image_url || null,
             userId: user.id
           }
         });

         if (seoError) {
           console.warn('Failed to generate SEO metadata:', seoError);
           toast({
             title: "SEO Generation Warning",
             description: "Book added to queue but SEO metadata generation failed. Thumbnail may not appear.",
             variant: "destructive"
           });
         }
       } catch (error) {
         console.error('Error generating SEO metadata:', error);
       }
     };

      try {
        // Check if there's already a draft entry for this book
        if (existingPublication && existingPublication.status === 'draft') {
          // Convert draft to queued with next publish date (appends to end - FIFO)
          const nextDate = await getAppendPublishDate(supabase);
          
          // Generate unique slug if not already present
          const slug = existingPublication.slug || await generateUniqueSlug(contentName, contentId);

          const { data: updatedPublication, error: updateError } = await supabase
            .from('daily_published')
            .update({
              status: 'queued' as const,
              publish_date: nextDate,
              is_active: false, // Still not active until processed
              slug: slug // Add slug to update
            })
            .eq('id', existingPublication.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error converting draft to queue:', updateError);
            throw updateError;
          }

          // Generate SEO metadata for the converted draft
          await generateSeoMetadata(updatedPublication.id);

          const formattedDate = new Date(nextDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
          });

          toast({
            title: "Scheduled for Publication!",
            description: `${contentName} has been scheduled for ${formattedDate} at 7:01 AM Eastern Time.`,
          });

          // Update local state
          setExistingPublication(updatedPublication);
          
          // Generate QR code automatically
          await generateQRCodeSafely();
        } else {
          // Get next publish date (appends to end of queue - FIFO)
          const nextDate = await getAppendPublishDate(supabase);
          
          // Generate unique slug for new publications
          const slug = await generateUniqueSlug(contentName, contentId);

          // Create new daily publication scheduled for next available date
          const { data: newPublication, error: insertError } = await supabase
            .from('daily_published')
            .insert({
              book_id: contentId,
              title: contentName,
              description: `${SITE_CONFIG.dailyContent.description} featuring ${contentName}`,
              status: 'queued' as const,
              is_active: false,
              publish_date: nextDate,
              slug: slug // Add slug to insert
            })
            .select()
            .single();

         if (insertError) {
           console.error('Error adding to queue:', insertError);
           throw insertError;
         }

          // Generate SEO metadata for the new publication
          await generateSeoMetadata(newPublication.id);

          const formattedDate = new Date(nextDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric', 
            month: 'long',
            day: 'numeric'
          });

          toast({
            title: "Scheduled for Publication!",  
            description: `${contentName} has been scheduled for ${formattedDate} at 7:01 AM Eastern Time.`,
          });

         // Update local state
         setExistingPublication(newPublication);
         
         // Generate QR code automatically
         await generateQRCodeSafely();
       }

       // Open the queue page to show status
       window.open('/daily-published-schedule', '_blank');

    } catch (error: any) {
      console.error('Error adding to queue:', error);
      
      // Check if this is a duplicate publication error
      if (error.message?.includes('Only one publication can be active')) {
        toast({
          title: "Publication Limit Reached",
          description: "Only one book can be published daily. Please wait until tomorrow or contact support.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Failed to Add to Queue",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const { text, action, disabled, icon: Icon } = getButtonState();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Exports
        </CardTitle>
        <CardDescription>
          Generate and download exports for your {contentType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download All Images Section - Only for books */}
        {contentType === 'book' && (
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Download All Images</h4>
              <p className="text-sm text-muted-foreground">
                Download all page images (A-Z) as a ZIP file
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleDownloadAllImages}
                disabled={isDownloadingImages}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                {isDownloadingImages 
                  ? `Downloading... (${imageDownloadProgress.current}/${imageDownloadProgress.total}${imageDownloadProgress.currentPage ? ` - ${imageDownloadProgress.currentPage}` : ''})` 
                  : 'Download All Images'
                }
              </Button>
              {isDownloadingImages && imageDownloadProgress.total > 0 && (
                <div className="text-sm text-muted-foreground">
                  {Math.round((imageDownloadProgress.current / imageDownloadProgress.total) * 100)}%
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">PDF Export</h4>
            <p className="text-sm text-muted-foreground">
              Download a PDF version with all available content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={action}
              disabled={disabled}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {text}
            </Button>
            {isGeneratingPdf && pdfProgress.total > 0 && (
              <div className="text-sm text-muted-foreground">
                {Math.round((pdfProgress.current / pdfProgress.total) * 100)}%
              </div>
            )}
          </div>
        </div>

        {/* Product Description Section - Only for books */}
        {contentType === 'book' && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  Product Description
                  {productDescription && (
                    isProductDescriptionSaved ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                    )
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Sales-focused description for online publishing
                  {productDescription && !isProductDescriptionSaved && (
                    <span className="text-orange-600 ml-1">(Unsaved changes)</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleGenerateProductDescription}
                  disabled={isGeneratingProductDescription}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isGeneratingProductDescription ? 'Generating...' : 'Generate'}
                </Button>
                {productDescription && !isProductDescriptionSaved && (
                  <Button 
                    onClick={saveProductDescription}
                    disabled={isSavingProductDescription}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingProductDescription ? 'Saving...' : 'Save'}
                  </Button>
                )}
                {productDescription && (
                  <Button 
                    onClick={handleCopyProductDescription}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                )}
              </div>
            </div>
            {productDescription && (
              <div className="bg-muted/50 rounded-md p-3 text-sm">
                <div className="whitespace-pre-line text-muted-foreground">
                  {productDescription}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LinkedIn Post Section */}
        {existingPublication && existingPublication.status !== 'draft' && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">LinkedIn Post</h4>
                <p className="text-sm text-muted-foreground">
                  Ready-to-share LinkedIn post text
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button 
                  onClick={handleRefreshLinkedInPost}
                  disabled={isRefreshingLinkedInPost}
                  variant="outline"
                  className="flex items-center gap-2 flex-1 md:flex-none"
                  title="Refresh with latest SEO data"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshingLinkedInPost ? 'animate-spin' : ''}`} />
                  <span className="md:inline">Refresh</span>
                </Button>
                <Button 
                  onClick={handleCopyLinkedInPost}
                  variant="outline"
                  className="flex items-center gap-2 flex-1 md:flex-none"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Post</span>
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-md p-3 text-sm max-h-[200px] overflow-y-auto">
              <div className="whitespace-pre-line text-muted-foreground text-xs md:text-sm">
                {getLinkedInPostText()}
              </div>
            </div>
          </div>
        )}

        {/* Public Book Link Section */}
        {existingPublication && existingPublication.slug && existingPublication.status !== 'draft' && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="space-y-1">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Public Book Link
                </h4>
                <p className="text-sm text-muted-foreground">
                  SEO-optimized public landing page
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button 
                  onClick={async () => {
                    const publicBookUrl = `${SITE_CONFIG.productionUrl}/book/${existingPublication.slug}`;
                    try {
                      await navigator.clipboard.writeText(publicBookUrl);
                      toast({
                        title: "Link copied!",
                        description: "The public book link has been copied to your clipboard."
                      });
                    } catch (error) {
                      console.error('Failed to copy link:', error);
                      toast({
                        title: "Copy failed",
                        description: "Unable to copy link to clipboard.",
                        variant: "destructive"
                      });
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2 flex-1 md:flex-none"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Link</span>
                </Button>
                <Button 
                  onClick={() => window.open(`/book/${existingPublication.slug}`, '_blank')}
                  variant="outline"
                  className="flex items-center gap-2 flex-1 md:flex-none"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-md p-3 text-sm">
              <code className="text-muted-foreground break-all text-xs md:text-sm">
                {`${SITE_CONFIG.productionUrl}/book/${existingPublication.slug}`}
              </code>
            </div>
          </div>
        )}

        {/* Book Publication Status Control */}
        {contentType === 'book' && bookData && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Book Status</h4>
                <p className="text-xs text-muted-foreground">
                  {bookData.status === PublicationStatus.DRAFT && 'Being created/edited, not visible to public'}
                  {bookData.status === PublicationStatus.PUBLISHED && 'Live and available to users'}
                  {bookData.status === PublicationStatus.ARCHIVED && 'Hidden from view but retained'}
                </p>
              </div>
              <Select
                value={bookData.status}
                onValueChange={(newStatus) => {
                  if (!bookData?.id) {
                    toast({
                      variant: 'destructive',
                      title: 'Error',
                      description: 'Book data not available',
                    });
                    return;
                  }
                  
                  updateBookStatusMutation.mutate({
                    bookId: bookData.id,
                    status: newStatus as PublicationStatus,
                  });
                }}
                disabled={updateBookStatusMutation.isPending}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PublicationStatus.DRAFT}>
                    <div className="flex flex-col">
                      <span>Draft</span>
                      <span className="text-xs text-muted-foreground">Not visible to public</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={PublicationStatus.PUBLISHED}>
                    <div className="flex flex-col">
                      <span>Published</span>
                      <span className="text-xs text-muted-foreground">Live and available</span>
                    </div>
                  </SelectItem>
                  <SelectItem value={PublicationStatus.ARCHIVED}>
                    <div className="flex flex-col">
                      <span>Archived</span>
                      <span className="text-xs text-muted-foreground">Hidden but retained</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Daily Queue Section - Only show for published books */}
        {contentType === 'book' && bookData?.status !== PublicationStatus.DRAFT && (
          <div className="flex flex-col gap-3 pt-4 border-t">
            <div className="space-y-1">
              <h4 className="text-sm font-medium flex items-center gap-2">
                Daily Queue
                {publicationHistory.length > 1 && (
                  <History className="h-4 w-4 text-muted-foreground" />
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                {getDailyQueueStatusMessage()}
              </p>
              {publicationHistory.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Published {publicationHistory.filter(p => p.status === 'expired').length} time(s) previously
                </p>
              )}
            </div>
             <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
               {existingPublication && existingPublication.status === 'active' && (
                 <Button 
                   onClick={handleCopyLink}
                   variant="outline"
                   size="sm"
                   className="flex items-center justify-center gap-2 w-full md:w-auto"
                 >
                   <Copy className="h-4 w-4" />
                   <span>Copy Link</span>
                 </Button>
               )}
               {existingPublication && existingPublication.status === 'expired' && (
                 <>
                   <Button 
                     onClick={handleViewPublication}
                     variant="outline"
                     size="sm"
                     className="flex items-center justify-center gap-2 w-full md:w-auto"
                   >
                     <History className="h-4 w-4" />
                     <span>View Archive</span>
                   </Button>
                   <Button 
                     onClick={handleRepublish}
                     variant="outline"
                     size="sm"
                     className="flex items-center justify-center gap-2 w-full md:w-auto"
                   >
                     <RefreshCw className="h-4 w-4" />
                     <span>Republish</span>
                   </Button>
                 </>
               )}
               {(!existingPublication || existingPublication.status === 'draft' || existingPublication.status === 'expired') && (
                 <Button 
                   onClick={handleAddToQueue}
                   variant="outline"
                   className="flex items-center justify-center gap-2 w-full md:w-auto"
                   disabled={isCheckingPublication}
                 >
                   <Globe className="h-4 w-4" />
                   <span>{isCheckingPublication ? 'Checking...' : 'Add to Queue'}</span>
                 </Button>
               )}
               {existingPublication && ['queued', 'active'].includes(existingPublication.status) && (
                 <Button 
                   onClick={handleViewPublication}
                   variant="outline"
                   className="flex items-center justify-center gap-2 w-full md:w-auto"
                   disabled={isCheckingPublication}
                 >
                   <Eye className="h-4 w-4" />
                   <span>{isCheckingPublication ? 'Checking...' : 
                     existingPublication.status === 'active' ? 'View Live' : 'View in Queue'}</span>
                 </Button>
               )}
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};