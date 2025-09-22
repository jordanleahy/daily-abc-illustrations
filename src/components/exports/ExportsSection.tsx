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
 * 
 * All PDF generation is handled client-side using pdf-lib for optimal performance.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Globe, Eye, Copy, Download } from 'lucide-react';
import { useExpectedPublicationDate } from '@/hooks/useExpectedPublicationDate';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { SITE_CONFIG } from '@/config/site';

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
 * ExportsSection Component
 * 
 * A comprehensive component that manages both PDF exports and daily publication queue functionality.
 * Provides users with the ability to:
 * - Generate and download PDF exports of their content using client-side processing
 * - Add books to the daily publication queue
 * - Automatically generate QR codes when adding to queue
 * - View publication status and expected dates
 * - Copy public links for shared content
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
  const { user } = useAuth();
  const { data: expectedDate, isLoading: dateLoading } = useExpectedPublicationDate(contentId);
  const { generateQRCode } = useBookQRCode(contentType === 'book' ? contentId : undefined);
  const [existingPublication, setExistingPublication] = useState<any>(null);
  const [isCheckingPublication, setIsCheckingPublication] = useState(false);

  /**
   * Handles client-side PDF generation for the content
   * Uses pdf-lib to generate PDFs directly in the browser
   */
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0, currentPage: '' });

  const handleCreatePdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgress({ current: 0, total: 0, currentPage: '' });

    try {
      // Import the PDF generator service
      const { generateBookPDF, generatePagePDF } = await import('@/services/pdfGenerator');

      let pdfBytes: Uint8Array | null = null;

      const options = {
        onProgress: (current: number, total: number, currentPage?: string) => {
          setPdfProgress({ current, total, currentPage: currentPage || '' });
        },
        onError: (error: string, pageId?: string) => {
          console.warn(`PDF generation warning: ${error}`, pageId);
        },
        returnBytes: true // Request raw bytes instead of triggering download
      };

      toast({
        title: "PDF Generation Started",
        description: "Generating your PDF directly in the browser..."
      });

      if (contentType === 'book') {
        const result = await generateBookPDF(contentId, contentName, options);
        pdfBytes = result || null;
      } else {
        const result = await generatePagePDF(contentId, contentName, options);
        pdfBytes = result || null;
      }

      // Upload PDF to storage bucket if we have bytes and this is part of daily published content
      if (pdfBytes && contentType === 'book' && existingPublication) {
        // Check if user is authenticated before attempting upload
        if (!user?.id) {
          throw new Error('You must be logged in to save PDFs to daily published content.');
        }

        setPdfProgress({ current: 0, total: 0, currentPage: 'Uploading PDF...' });
        
        const fileName = `${contentId}-${Date.now()}.pdf`;
        const filePath = `daily-published/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('exports')
          .upload(filePath, pdfBytes, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error('Error uploading PDF:', uploadError);
          throw new Error(`Failed to upload PDF: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('exports')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          // Update daily_published table with PDF URL
          const { error: updateError } = await supabase
            .from('daily_published')
            .update({ pdf_url: urlData.publicUrl })
            .eq('id', existingPublication.id);

          if (updateError) {
            console.error('Error updating PDF URL:', updateError);
            throw new Error(`Failed to save PDF URL: ${updateError.message}. Please try again or contact support.`);
          }

          // Update local state
          setExistingPublication(prev => prev ? { ...prev, pdf_url: urlData.publicUrl } : prev);
        }
      }

      // Trigger download
      if (pdfBytes) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contentName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "PDF Generated Successfully",
        description: existingPublication ? "Your PDF has been saved and downloaded successfully." : "Your PDF has been downloaded successfully."
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
   * Downloads the existing PDF from storage
   */
  const handleDownloadExistingPdf = async () => {
    if (!existingPublication?.pdf_url) return;

    try {
      const response = await fetch(existingPublication.pdf_url);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contentName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded",
        description: "Your existing PDF has been downloaded successfully."
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download the existing PDF. Please try generating a new one."
      });
    }
  };

  /**
   * Set up real-time subscription for daily publication changes
   * Only runs for book content type
   */
  useEffect(() => {
    if (contentType !== 'book') return;
    
    const checkExistingPublication = async () => {
      setIsCheckingPublication(true);
      
      try {
        // First verify the user owns this book
        if (!user?.id) {
          console.log('No authenticated user found');
          return;
        }

        const { data: bookData, error: bookError } = await supabase
          .from('books')
          .select('user_id')
          .eq('id', contentId)
          .single();

        if (bookError) {
          console.error('Error checking book ownership:', bookError);
          return;
        }

        if (bookData?.user_id !== user.id) {
          console.error('User does not own this book:', { bookUserId: bookData?.user_id, currentUserId: user.id });
          return;
        }

        const { data, error } = await supabase
          .from('daily_published')
          .select('*')
          .eq('book_id', contentId)
          .in('status', ['draft', 'queued', 'active'])
          .maybeSingle();

        if (error) {
          console.error('Error fetching daily published data:', error);
          return;
        }

        if (data) {
          setExistingPublication(data);
        }
      } catch (error) {
        console.error('Error checking existing publication:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check existing publication status."
        });
      } finally {
        setIsCheckingPublication(false);
      }
    };

    // Initial fetch
    checkExistingPublication();

    // Set up real-time subscription
    const channel = supabase
      .channel(`daily_published_changes_${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_published',
          filter: `book_id=eq.${contentId}`
        },
        (payload) => {
          console.log('Daily published updated:', payload);
          setExistingPublication(payload.new as any);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'daily_published',
          filter: `book_id=eq.${contentId}`
        },
        (payload) => {
          console.log('Daily published created:', payload);
          setExistingPublication(payload.new as any);
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [contentId, contentType]);

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
      } else {
        window.open('/daily-published-schedule', '_blank');
      }
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

      try {
        // Check if there's already a draft entry for this book
        if (existingPublication && existingPublication.status === 'draft') {
          // Convert draft to queued with next available date
          const { data: nextDate } = await supabase.rpc('get_next_available_publish_date');
          
          const { data: updatedPublication, error: updateError } = await supabase
            .from('daily_published')
            .update({
              status: 'queued' as const,
              publish_date: nextDate,
              is_active: false // Still not active until processed
            })
            .eq('id', existingPublication.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error converting draft to queue:', updateError);
            throw updateError;
          }

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
          // Get next available publish date
          const { data: nextDate } = await supabase.rpc('get_next_available_publish_date');
          
          // Create new daily publication scheduled for next available date
          const { data: newPublication, error: insertError } = await supabase
            .from('daily_published')
            .insert({
              book_id: contentId,
              title: contentName,
              description: `${SITE_CONFIG.dailyContent.description} featuring ${contentName}`,
              status: 'queued' as const,
              publish_date: nextDate
            })
            .select()
            .single();

         if (insertError) {
           console.error('Error adding to queue:', insertError);
           throw insertError;
         }

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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">PDF Export</h4>
            <p className="text-sm text-muted-foreground">
              Download a PDF version with all available content
            </p>
          </div>
          <div className="flex items-center gap-2">
            {existingPublication?.pdf_url && (
              <Button 
                onClick={handleDownloadExistingPdf}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
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

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Daily Queue</h4>
            <p className="text-sm text-muted-foreground">
              {existingPublication && existingPublication.status !== 'draft' 
                ? `Currently ${existingPublication.status} in the publication queue`
                : dateLoading 
                  ? 'Calculating publication date...'
                  : expectedDate 
                    ? `This would be published on ${expectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`
                    : 'Add your book to the daily publication queue'
              }
            </p>
          </div>
           <div className="flex items-center gap-2">
             {existingPublication && existingPublication.status === 'active' && (
               <Button 
                 onClick={handleCopyLink}
                 variant="outline"
                 size="sm"
                 className="flex items-center gap-2"
               >
                 <Copy className="h-4 w-4" />
                 Copy Link
               </Button>
             )}
             <Button 
               onClick={existingPublication && existingPublication.status !== 'draft' ? handleViewPublication : handleAddToQueue}
               variant="outline"
               className="flex items-center gap-2"
               disabled={isCheckingPublication}
             >
               {existingPublication && existingPublication.status !== 'draft' ? <Eye className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
               {isCheckingPublication ? 'Checking...' : 
                 existingPublication && existingPublication.status !== 'draft'
                   ? (existingPublication.status === 'active' ? 'View Live' : 'View in Queue') 
                   : 'Add to Queue'}
             </Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
};