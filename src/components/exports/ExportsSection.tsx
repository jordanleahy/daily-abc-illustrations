import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, RotateCcw, Trash2, Globe } from 'lucide-react';
import { useExports } from '@/hooks/useExports';
import { Export } from '@/types/export';
import { ProcessStatus } from '@/types/process';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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

  const pdfExports = exports.filter(exp => exp.export_type === 'pdf');
  const latestPdfExport = pdfExports[0];

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

  const handlePublishDaily = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to publish daily content.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create new daily publication
      const { data: newPublication, error: insertError } = await supabase
        .from('daily_published')
        .insert({
          book_id: contentId,
          title: contentName,
          description: `Daily ABC Illustrations featuring ${contentName}`,
          published_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating daily publication:', insertError);
        throw insertError;
      }

      toast({
        title: "Published Daily!",
        description: `${contentName} is now available as daily content for 48 hours.`,
      });

      // Open the daily published page with the new publication ID
      window.open(`/daily-published/${newPublication.id}`, '_blank');

    } catch (error: any) {
      console.error('Error publishing daily:', error);
      
      // Check if this is a duplicate publication error
      if (error?.message?.includes('A daily publication already exists for this book')) {
        toast({
          title: "Already Published",
          description: `${contentName} is already published as daily content. Each book can only have one active daily publication.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Publishing Failed",
          description: "There was an error publishing your content. Please try again.",
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
            <h4 className="text-sm font-medium">Publish Daily</h4>
            <p className="text-sm text-muted-foreground">
              Publish your {contentType} to the daily publication
            </p>
          </div>
          <Button 
            onClick={handlePublishDaily}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Publish Daily
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};