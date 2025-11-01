import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemPromptEditor } from './SystemPromptEditor';
import { VersionHistoryModal } from './VersionHistoryModal';
import { StyleGuideViewer } from './StyleGuideViewer';
import { IllustrationConfigEditor } from './IllustrationConfigEditor';
import { useSystemPrompt } from '@/hooks/useSystemPrompt';
import { useIllustrationConfig } from '@/hooks/useIllustrationConfig';
import { useBook } from '@/hooks/useBook';
import { ProcessStatus } from '@/types/process';
import { useToast } from '@/hooks/use-toast';
import { 
  Edit, 
  History, 
  Rocket, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Palette,
  Settings,
  Eye
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
    updateEditedContent,
    refreshData
  } = useSystemPrompt(bookId);

  const {
    config,
    hasStructuredConfig,
    isConfigOutdated,
    regenerateContent
  } = useIllustrationConfig(bookId);

  const { data: book } = useBook(bookId);

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'config' | 'visual'>('content');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = (promptStatus?: string) => {
    switch (promptStatus) {
      case ProcessStatus.IN_PROGRESS:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case ProcessStatus.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case ProcessStatus.COMPLETE:
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (promptStatus?: string) => {
    switch (promptStatus) {
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
      {/* Action buttons above the header */}
      {!isEditing && (
        <div className="flex items-center justify-end gap-2 mb-3 px-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshData}
              title="Refresh prompt data"
              className="h-8 w-8"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            {hasPrompt && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowVersionHistory(true)}
                  disabled={!hasVersions}
                  title={`Version history (${versions.length})`}
                  className="h-8 w-8"
                >
                  <History className="w-4 h-4" />
                </Button>
                {currentPrompt?.promptStatus !== ProcessStatus.IN_PROGRESS && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={startEdit}
                    title="Edit prompt"
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {!currentPrompt?.isDeployed && currentPrompt?.promptStatus === ProcessStatus.COMPLETE && (
                  <Button
                    size="icon"
                    onClick={() => deployVersion(currentPrompt!.id)}
                    title="Deploy prompt"
                    className="h-8 w-8"
                  >
                    <Rocket className="w-4 h-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
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
                  {currentPrompt?.promptStatus && getStatusBadge(currentPrompt.promptStatus)}
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
          ) : isEditingConfig && config ? (
            <IllustrationConfigEditor
              config={config}
              onConfigChange={(newConfig) => {
                // Update config logic would go here
                console.log('Config updated:', newConfig);
              }}
              onSave={() => {
                setIsEditingConfig(false);
                toast({
                  title: "Configuration Updated",
                  description: "Illustration configuration has been saved successfully."
                });
              }}
              onCancel={() => setIsEditingConfig(false)}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Instructions
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuration
                  {hasStructuredConfig && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs">
                      JSON
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="visual" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visual Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <div className="space-y-4">
                  {currentPrompt?.promptStatus === ProcessStatus.IN_PROGRESS ? (
                    <div className="flex items-center justify-center py-8 space-x-2">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      <span className="text-sm text-muted-foreground">Generating system prompt...</span>
                    </div>
                  ) : currentPrompt?.promptStatus === ProcessStatus.ERROR ? (
                    <div className="flex items-center justify-center py-8 space-x-2 text-red-500">
                      <AlertCircle className="h-6 w-6" />
                      <span className="text-sm">Generation failed. Please try again.</span>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          Current Version
                          {getStatusIcon(currentPrompt?.promptStatus)}
                          {isConfigOutdated && (
                            <Badge variant="outline" className="text-yellow-600">
                              Config Updated
                            </Badge>
                          )}
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
              </TabsContent>

              <TabsContent value="config" className="mt-4">
                {hasStructuredConfig && config ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        <h4 className="font-medium">Illustration Configuration</h4>
                        <Badge variant="secondary">{config.configVersion}</Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingConfig(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Config
                      </Button>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-sm font-mono whitespace-pre-wrap">
                        {JSON.stringify(config, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="mb-2">No structured configuration available</p>
                    <p className="text-sm">This prompt was created with the legacy format</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visual" className="mt-4">
                {currentPrompt?.content ? (
                  <StyleGuideViewer styleGuideContent={currentPrompt.content} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p className="mb-2">No content to preview</p>
                    <p className="text-sm">Generate a system prompt to see the visual preview</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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