import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, RotateCcw, Trash2, Globe, Eye, Copy } from 'lucide-react';
import { useExports } from '@/hooks/useExports';
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
  const { exports, createExport, deleteExport } = useExports(contentType, contentId);
  const [existingPublication, setExistingPublication] = useState<any>(null);
  const [isCheckingPublication, setIsCheckingPublication] = useState(false);

  const pdfExports = exports.filter(exp => exp.export_type === 'pdf');
  const latestPdfExport = pdfExports[0];

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
          .in('status', ['queued', 'active'])
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

      // Call the generate-pdf edge function
      const { error } = await supabase.functions.invoke('generate-pdf', {
        body: { exportId: exportRecord.id }
      });

      if (error) {
        console.error('Error calling generate-pdf function:', error);
        toast({
          variant: "destructive",
          title: "Failed to generate PDF",
          description: error.message
        });
      } else {
        toast({
          title: "PDF generation started",
          description: "Your PDF is being generated. You'll be notified when it's ready."
        });
      }
    } catch (error) {
      console.error('Error creating PDF export:', error);
    }
  };

  const handleDownload = (exportRecord: Export) => {
    if (exportRecord.export_url) {
      window.open(exportRecord.export_url, '_blank');
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

      // Open the queue page to show status
      window.open('/daily-published-schedule', '_blank');

    } catch (error: any) {
      console.error('Error publishing daily:', error);
      
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
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreatePdf}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(latestPdfExport)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {latestPdfExport.error_message && (
              <div className="mt-2 text-sm text-destructive">
                Error: {latestPdfExport.error_message}
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
              Add your {contentType} to the daily publication queue
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
              onClick={existingPublication ? handleViewPublication : handleAddToQueue}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isCheckingPublication}
            >
              {existingPublication ? <Eye className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              {isCheckingPublication ? 'Checking...' : existingPublication 
                ? (existingPublication.status === 'active' ? 'View Live' : 'View in Queue') 
                : 'Add to Queue'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};