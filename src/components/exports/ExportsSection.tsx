import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, RotateCcw, Trash2, Globe, Eye, Copy } from 'lucide-react';
import { useExports } from '@/hooks/useExports';
import { useExpectedPublicationDate } from '@/hooks/useExpectedPublicationDate';
import { Export } from '@/types/export';
import { ProcessStatus } from '@/types/process';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { SITE_CONFIG } from '@/config/site';

interface ExportsSectionProps {
  contentType: 'book' | 'page';
  contentId: string;
  contentName: string;
}

export const ExportsSection: React.FC<ExportsSectionProps> = ({
  contentType,
  contentId,
  contentName
}) => {
  const { user } = useAuth();
  const { exports, createExport, deleteExport, refetch } = useExports(contentType, contentId);
  const { data: expectedDate, isLoading: dateLoading } = useExpectedPublicationDate(contentId);
  const [existingPublication, setExistingPublication] = useState<any>(null);
  const [isCheckingPublication, setIsCheckingPublication] = useState(false);

  const pdfExports = exports?.filter(exp => exp.export_type === 'pdf') || [];
  const latestPdfExport = pdfExports[0];

  // Refresh data on component mount to ensure we have the latest status
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Check for existing daily publication on mount
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
        toast({
          title: "PDF Generation Started",
          description: "Your PDF is being generated. This may take a few minutes for books with many images."
        });

        // Clear interval after 5 minutes to prevent infinite polling
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 300000);
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

  const handleCopyPdfLink = async (exportRecord: Export) => {
    if (!exportRecord.export_url) return;
    try {
      await navigator.clipboard.writeText(exportRecord.export_url);
      toast({ title: 'Link copied!', description: 'PDF link copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Copy failed', description: 'Unable to copy link. You can right-click the Download button and copy link address.', variant: 'destructive' });
    }
  };

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

  const handleViewPublication = () => {
    if (existingPublication) {
      if (existingPublication.status === 'active') {
        window.open(`/daily-published/${existingPublication.id}`, '_blank');
      } else {
        window.open('/daily-published-schedule', '_blank');
      }
    }
  };

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

   const handleAddToQueue = async () => {
     if (!user?.id) {
       toast({
         title: "Authentication Required",
         description: "You must be logged in to add content to the queue.",
         variant: "destructive"
       });
       return;
     }

     try {
       // Check if there's already a draft entry for this book
       if (existingPublication && existingPublication.status === 'draft') {
         // Convert draft to queued
         const { data: nextPosition } = await supabase.rpc('get_next_queue_position');
         
         const { data: updatedPublication, error: updateError } = await supabase
           .from('daily_published')
           .update({
             status: 'queued' as const,
             queue_position: nextPosition || 1,
             is_active: false // Still not active until processed by queue
           })
           .eq('id', existingPublication.id)
           .select()
           .single();

         if (updateError) {
           console.error('Error converting draft to queue:', updateError);
           throw updateError;
         }

         toast({
           title: "Added to Queue!",
           description: `${contentName} has been added to the daily publication queue at position ${updatedPublication.queue_position}.`,
         });

         // Update local state
         setExistingPublication(updatedPublication);
       } else {
         // Get next queue position
         const { data: nextPosition } = await supabase.rpc('get_next_queue_position');
         
         // Create new daily publication in queue
         const { data: newPublication, error: insertError } = await supabase
           .from('daily_published')
           .insert({
             book_id: contentId,
             title: contentName,
             description: `${SITE_CONFIG.dailyContent.description} featuring ${contentName}`,
             status: 'queued' as const,
             queue_position: nextPosition || 1
           })
           .select()
           .single();

         if (insertError) {
           console.error('Error adding to queue:', insertError);
           throw insertError;
         }

         toast({
           title: "Added to Queue!",
           description: `${contentName} has been added to the daily publication queue at position ${newPublication.queue_position}.`,
         });

         // Update local state
         setExistingPublication(newPublication);
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