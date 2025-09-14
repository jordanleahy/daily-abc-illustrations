import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SystemPromptEditor } from './SystemPromptEditor';
import { VersionHistoryModal } from './VersionHistoryModal';
import { useSystemPrompt } from '@/hooks/useSystemPrompt';
import { ProcessStatus } from '@/types/process';
import { 
  Edit, 
  History, 
  Rocket, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface SystemPromptSectionProps {
  bookId: string;
}

export const SystemPromptSection = ({ bookId }: SystemPromptSectionProps) => {
  const {
    currentPrompt,
    isLoading,
    isEditing,
    editedContent,
    versions,
    startEdit,
    cancelEdit,
    saveEdit,
    deployVersion,
    revertToVersion,
    updateEditedContent
  } = useSystemPrompt(bookId);

  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case ProcessStatus.IN_PROGRESS:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case ProcessStatus.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case ProcessStatus.COMPLETE:
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case ProcessStatus.IN_PROGRESS:
        return <Badge variant="secondary" className="text-blue-600 bg-blue-50">Generating...</Badge>;
      case ProcessStatus.ERROR:
        return <Badge variant="destructive">Error</Badge>;
      case ProcessStatus.COMPLETE:
      default:
        return <Badge variant="secondary" className="text-green-600 bg-green-50">Complete</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const hasPrompt = currentPrompt !== null;
  const hasVersions = versions.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <CardTitle>System Prompt</CardTitle>
                {hasPrompt && (
                  <>
                    <Badge 
                      variant={currentPrompt?.isDeployed ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      {currentPrompt?.isDeployed ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Deployed
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Draft
                        </>
                      )}
                    </Badge>
                    {currentPrompt?.status && getStatusBadge(currentPrompt.status)}
                  </>
                )}
              </div>
              <CardDescription>
                {hasPrompt 
                  ? "Manage your book's illustration style guide and system prompt"
                  : "No system prompt generated yet. Generate one to start creating illustrations."
                }
              </CardDescription>
            </div>
            
            {!isEditing && (
              <div className="flex items-center gap-2">
                {hasPrompt && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVersionHistory(true)}
                      disabled={!hasVersions}
                      className="flex items-center gap-2"
                    >
                      <History className="w-4 h-4" />
                      History ({versions.length})
                    </Button>
                    {currentPrompt?.status !== ProcessStatus.IN_PROGRESS && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEdit}
                        className="flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    )}
                    {!currentPrompt?.isDeployed && currentPrompt?.status === ProcessStatus.COMPLETE && (
                      <Button
                        size="sm"
                        onClick={() => deployVersion(currentPrompt!.id)}
                        className="flex items-center gap-2"
                      >
                        <Rocket className="w-4 h-4" />
                        Deploy
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {!hasPrompt ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="mb-2">No system prompt available</p>
              <p className="text-sm">Generate a style guide first to create the system prompt</p>
            </div>
          ) : isEditing ? (
            <SystemPromptEditor
              content={editedContent}
              onContentChange={updateEditedContent}
              onSave={saveEdit}
              onCancel={cancelEdit}
            />
          ) : (
            <div className="space-y-4">
              {currentPrompt?.status === ProcessStatus.IN_PROGRESS ? (
                <div className="flex items-center justify-center py-8 space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  <span className="text-sm text-muted-foreground">Generating system prompt...</span>
                </div>
              ) : currentPrompt?.status === ProcessStatus.ERROR ? (
                <div className="flex items-center justify-center py-8 space-x-2 text-red-500">
                  <AlertCircle className="h-6 w-6" />
                  <span className="text-sm">Generation failed. Please try again.</span>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      Current Version
                      {getStatusIcon(currentPrompt?.status)}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {currentPrompt?.lastModified ? new Date(currentPrompt.lastModified).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {currentPrompt?.content || 'No content available'}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showVersionHistory && (
        <VersionHistoryModal
          versions={versions}
          currentVersionId={currentPrompt?.id}
          onClose={() => setShowVersionHistory(false)}
          onRevert={revertToVersion}
          onDeploy={deployVersion}
        />
      )}
    </>
  );
};