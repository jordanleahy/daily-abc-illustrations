/**
 * @fileoverview ExportsSection Component
 * 
 * This file contains the ExportsSection component which provides a unified interface
 * for managing both PDF exports and daily publication queue functionality.
 * 
 * Key Features:
 * - PDF generation and download with progress tracking
 * - Daily publication queue management
 * - Automatic QR code generation when adding to queue
 * - Real-time status updates and error handling
 * - Expected publication date calculations
 * - Public link sharing and copying functionality
 * 
 * The component integrates multiple hooks and services to provide a seamless
 * user experience for content export and publication workflows.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, RotateCcw, Trash2, Globe, Eye, Copy } from 'lucide-react';
import { useExports } from '@/hooks/useExports';
import { useExpectedPublicationDate } from '@/hooks/useExpectedPublicationDate';
import { useBookQRCode } from '@/hooks/useBookQRCode';
import { Export } from '@/types/export';
import { ProcessStatus } from '@/types/process';
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
 * - Generate and download PDF exports of their content
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
  const { exports, createExport, deleteExport, refetch } = useExports(contentType, contentId);
  const { data: expectedDate, isLoading: dateLoading } = useExpectedPublicationDate(contentId);
  const { generateQRCode } = useBookQRCode(contentType === 'book' ? contentId : undefined);
  const [existingPublication, setExistingPublication] = useState<any>(null);
  const [isCheckingPublication, setIsCheckingPublication] = useState(false);

  const pdfExports = exports?.filter(exp => exp.export_type === 'pdf') || [];
  const latestPdfExport = pdfExports[0];

  /**
   * Refresh exports data on component mount to ensure latest status
   */
  useEffect(() => {
    refetch();
  }, [refetch]);

  /**
   * Check for existing daily publication entries on component mount
   * Only runs for book content type
   */
  useEffect(() => {
    const checkExistingPublication = async () => {
      if (contentType !== 'book') return;
      
      setIsCheckingPublication(true);
      try {
         const { data, error } = await supabase
           .from('daily_published')
           .select('*')
           .eq('book_id', contentId)
           .in('status', ['draft', 'queued', 'active'])
           .maybeSingle();

        if (!error && data) {
          setExistingPublication(data);
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
   * Handles PDF generation for the content
   * Creates an export record, starts the PDF generation process via edge function,
   * and polls for completion status with user feedback
   */
  const handleCreatePdf = async () => {
    try {
      const exportRecord = await createExport({
        content_type: contentType,
        content_id: contentId,
        export_type: 'pdf',
        export_config: {
          quality: 'high',
          includeImages: true
        }
      });

      // Start polling for progress updates
      const pollInterval = setInterval(async () => {
        const { data: updatedExport } = await supabase
          .from('exports')
          .select('*')
          .eq('id', exportRecord.id)
          .single();

        if (updatedExport) {
          // The useExports hook will automatically refresh and show the updated status
          if (updatedExport.export_status === 'complete' || updatedExport.export_status === 'error') {
            clearInterval(pollInterval);
            
            if (updatedExport.export_status === 'complete') {
              toast({
                title: "PDF Generated Successfully",
                description: "Your PDF is ready for download."
              });
            } else {
              toast({
                variant: "destructive",
                title: "PDF Generation Failed",
                description: updatedExport.error_message || "An error occurred during generation."
              });
            }
          }
        }
      }, 2000); // Poll every 2 seconds

      // Call the generate-pdf edge function
      const { error } = await supabase.functions.invoke('generate-pdf', {
        body: { exportId: exportRecord.id }
      });

      if (error) {
        clearInterval(pollInterval);
        console.error('Error calling generate-pdf function:', error);
        toast({
          variant: "destructive",
          title: "Failed to start PDF generation",
          description: error.message
        });
      } else {
        // For books, provide better time estimates
        const estimatedTime = contentType === 'book' 
          ? "2-5 minutes depending on book size"
          : "1-2 minutes";
            
        toast({
          title: "PDF Generation Started",
          description: `Your PDF is being generated. Estimated time: ${estimatedTime}. Using optimized processing to prevent timeouts.`
        });

        // Clear interval after 8 minutes to account for chunked processing
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 480000);
      }
    } catch (error) {
      console.error('Error creating PDF export:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to create export record."
      });
    }
  };

  /**
   * Downloads an export file using Supabase storage
   * Attempts programmatic download first, falls back to opening URL
   * 
   * @param exportRecord - The export record containing the file URL
   */
  const handleDownload = async (exportRecord: Export) => {
    if (!exportRecord.export_url) return;

    // Try downloading via Supabase Storage (avoids some browser/extension blocks)
    try {
      const match = exportRecord.export_url.match(/\/object\/public\/exports\/(.*)$/);
      const objectPath = match?.[1];

      if (objectPath) {
        const { data, error } = await supabase.storage.from('exports').download(objectPath);
        if (!error && data) {
          const blobUrl = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = blobUrl;
          const filename = objectPath.split('/').pop() || 'export.pdf';
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(blobUrl);
          return;
        }
      }
    } catch (e) {
      console.warn('Programmatic download failed, falling back to opening URL.', e);
    }

    // Fallback: open the public URL (may be blocked by some extensions)
    const opened = window.open(exportRecord.export_url, '_blank');
    if (!opened) {
      toast({
        title: 'Download blocked by browser',
        description: 'Your browser or an extension blocked the file. Please allow downloads from supabase.co or disable the blocker for this site.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Copies PDF export link to clipboard
   * 
   * @param exportRecord - The export record containing the file URL
   */
  const handleCopyPdfLink = async (exportRecord: Export) => {
    if (!exportRecord.export_url) return;
    try {
      await navigator.clipboard.writeText(exportRecord.export_url);
      toast({ title: 'Link copied!', description: 'PDF link copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Copy failed', description: 'Unable to copy link. You can right-click the Download button and copy link address.', variant: 'destructive' });
    }
  };

  /**
   * Deletes an export record after user confirmation
   * 
   * @param exportRecord - The export record to delete
   */
  const handleDelete = async (exportRecord: Export) => {
    if (confirm('Are you sure you want to delete this export?')) {
      try {
        await deleteExport(exportRecord.id);
        toast({
          title: "Export deleted",
          description: "The export has been removed successfully."
        });
      } catch (error) {
        console.error('Error deleting export:', error);
      }
    }
  };

  /**
   * Returns appropriate badge variant based on export status
   * 
   * @param status - The current process status
   * @returns Badge component with appropriate styling
   */
  const getStatusBadge = (status: ProcessStatus) => {
    const variants = {
      [ProcessStatus.NOT_STARTED]: 'secondary',
      [ProcessStatus.IN_PROGRESS]: 'default',
      [ProcessStatus.COMPLETE]: 'default',
      [ProcessStatus.ERROR]: 'destructive',
      [ProcessStatus.WARNING]: 'destructive',
      [ProcessStatus.SKIPPED]: 'secondary'
    } as const;

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  /**
   * Determines the button text, action, and state based on current PDF export status
   * 
   * @returns Object containing button configuration (text, action, disabled state, icon)
   */
  const getButtonState = () => {
    if (!latestPdfExport) {
      return { text: 'Generate PDF', action: handleCreatePdf, disabled: false, icon: FileText };
    }

    switch (latestPdfExport.export_status) {
      case ProcessStatus.NOT_STARTED:
      case ProcessStatus.IN_PROGRESS:
        return { text: 'Generating PDF...', action: () => {}, disabled: true, icon: FileText };
      case ProcessStatus.COMPLETE:
        return { text: 'Download PDF', action: () => handleDownload(latestPdfExport), disabled: false, icon: Download };
      case ProcessStatus.ERROR:
        return { text: 'Retry PDF Generation', action: handleCreatePdf, disabled: false, icon: RotateCcw };
      default:
        return { text: 'Generate PDF', action: handleCreatePdf, disabled: false, icon: FileText };
    }
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
      if (error?.message?.includes('A daily publication already exists for this book')) {
        toast({
          title: "Already in Queue",
          description: `${contentName} is already in the daily publication queue. Each book can only have one queue entry.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Queue Addition Failed",
          description: "There was an error adding your content to the queue. Please try again.",
          variant: "destructive"
        });
      }
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
          <Button 
            onClick={action}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {text}
          </Button>
        </div>

        {latestPdfExport && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span>Status:</span>
                {getStatusBadge(latestPdfExport.export_status)}
              </div>
              <div className="flex items-center gap-2">
                {latestPdfExport.export_status === ProcessStatus.COMPLETE && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(latestPdfExport)}
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                {latestPdfExport.export_status === ProcessStatus.COMPLETE && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPdfLink(latestPdfExport)}
                    title="Copy PDF link"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  title="Refresh status"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(latestPdfExport)}
                  title="Delete export"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {latestPdfExport.error_message && latestPdfExport.export_status === ProcessStatus.ERROR && (
              <div className="mt-2 text-sm text-destructive">
                Error: {latestPdfExport.error_message}
              </div>
            )}
            
            {latestPdfExport.export_status === ProcessStatus.IN_PROGRESS && latestPdfExport.error_message && (
              <div className="mt-2 text-sm text-muted-foreground">
                Progress: {latestPdfExport.error_message}
              </div>
            )}
            
            {latestPdfExport.file_size_bytes && (
              <div className="mt-2 text-sm text-muted-foreground">
                File size: {(latestPdfExport.file_size_bytes / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
          </div>
        )}

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