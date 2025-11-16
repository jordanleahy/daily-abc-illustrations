import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Edit, Play, Clock, Copy } from 'lucide-react';
import { usePageSystemPrompt } from '@/hooks/usePageSystemPrompt';
import { PageSystemPromptEditor } from './PageSystemPromptEditor';
import { PageVersionHistoryModal } from './PageVersionHistoryModal';
import { copyToClipboard } from '@/utils/clipboardHelpers';
import { useToast } from '@/hooks/use-toast';

interface PageSystemPromptSectionProps {
  pageId: string;
  pageTitle?: string;
}

export function PageSystemPromptSection({ pageId, pageTitle }: PageSystemPromptSectionProps) {
  const {
    currentPrompt,
    versions,
    isLoading,
    isEditing,
    editedContent,
    startEdit,
    cancelEdit,
    saveEdit,
    deployVersion,
    revertToVersion,
    updateEditedContent,
  } = usePageSystemPrompt(pageId);

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const { toast } = useToast();

  const handleCopyPrompt = async () => {
    if (!currentPrompt?.content) return;

    try {
      await copyToClipboard(currentPrompt.content);
      toast({
        title: "Copied!",
        description: "System prompt copied to clipboard",
      });
    } catch (error) {
      console.error('Error copying prompt:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Page System Prompt
              {pageTitle && <span className="text-sm text-muted-foreground">• {pageTitle}</span>}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage the AI prompt for generating this page's visual content
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVersionHistory(true)}
              disabled={versions.length === 0}
            >
              <History className="h-4 w-4 mr-2" />
              History ({versions.length})
            </Button>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {currentPrompt && !currentPrompt.is_deployed && (
              <Button
                size="sm"
                onClick={() => deployVersion(currentPrompt.id)}
              >
                <Play className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!currentPrompt && !isEditing ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No system prompt created yet</p>
            <Button onClick={startEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Create First Prompt
            </Button>
          </div>
        ) : isEditing ? (
          <PageSystemPromptEditor
            content={editedContent}
            onContentChange={updateEditedContent}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        ) : currentPrompt ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Version {currentPrompt.version_number}
                </Badge>
                {currentPrompt.is_deployed && (
                  <Badge variant="default">
                    <Play className="h-3 w-3 mr-1" />
                    Deployed
                  </Badge>
                )}
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(currentPrompt.updated_at).toLocaleDateString()}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Prompt
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm">{currentPrompt.content}</pre>
            </div>
          </div>
        ) : null}
      </CardContent>

      <PageVersionHistoryModal
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        versions={versions}
        currentVersionId={currentPrompt?.id}
        onClose={() => setShowVersionHistory(false)}
        onRevert={revertToVersion}
        onDeploy={deployVersion}
      />
    </Card>
  );
}