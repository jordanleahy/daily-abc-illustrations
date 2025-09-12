import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  RotateCcw, 
  Rocket, 
  Eye, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';

export interface SystemPromptVersion {
  id: string;
  content: string;
  versionNumber: number;
  createdAt: string;
  isDeployed: boolean;
  deployedAt?: string;
}

interface VersionHistoryModalProps {
  versions: SystemPromptVersion[];
  currentVersionId?: string;
  onClose: () => void;
  onRevert: (versionId: string) => void;
  onDeploy: (versionId: string) => void;
}

export const VersionHistoryModal = ({
  versions,
  currentVersionId,
  onClose,
  onRevert,
  onDeploy
}: VersionHistoryModalProps) => {
  const [selectedVersion, setSelectedVersion] = useState<SystemPromptVersion | null>(null);
  const [isReverting, setIsReverting] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState<string | null>(null);

  // Sort versions by creation date (newest first)
  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleRevert = async (versionId: string) => {
    setIsReverting(versionId);
    try {
      await onRevert(versionId);
    } finally {
      setIsReverting(null);
    }
  };

  const handleDeploy = async (versionId: string) => {
    setIsDeploying(versionId);
    try {
      await onDeploy(versionId);
    } finally {
      setIsDeploying(null);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and manage previous versions of your system prompt. You can preview, revert, or deploy any version.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[60vh]">
          {/* Versions List */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">All Versions ({sortedVersions.length})</h4>
            <ScrollArea className="h-full">
              <div className="space-y-2 pr-2">
                {sortedVersions.map((version) => {
                  const isCurrent = version.id === currentVersionId;
                  const isSelected = selectedVersion?.id === version.id;
                  
                  return (
                    <Card 
                      key={version.id}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'
                      } ${isCurrent ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">
                              Version {version.versionNumber}
                            </CardTitle>
                            {isCurrent && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                            {version.isDeployed && (
                              <Badge variant="default" className="text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Deployed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-xs">
                          Created {new Date(version.createdAt).toLocaleDateString()} at{' '}
                          {new Date(version.createdAt).toLocaleTimeString()}
                          {version.deployedAt && (
                            <div className="mt-1">
                              Deployed {new Date(version.deployedAt).toLocaleDateString()}
                            </div>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {version.content.substring(0, 120)}...
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                            {!isCurrent && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevert(version.id);
                                }}
                                disabled={isReverting === version.id}
                                className="text-xs"
                              >
                                {isReverting === version.id ? (
                                  <>
                                    <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                                    Reverting...
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Revert
                                  </>
                                )}
                              </Button>
                            )}
                            {!version.isDeployed && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeploy(version.id);
                                }}
                                disabled={isDeploying === version.id}
                                className="text-xs"
                              >
                                {isDeploying === version.id ? (
                                  <>
                                    <div className="w-3 h-3 mr-1 animate-spin rounded-full border border-current border-t-transparent" />
                                    Deploying...
                                  </>
                                ) : (
                                  <>
                                    <Rocket className="w-3 h-3 mr-1" />
                                    Deploy
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          
          {/* Preview Panel */}
          <div className="border-l pl-4">
            <h4 className="font-medium text-sm mb-2">Preview</h4>
            {selectedVersion ? (
              <ScrollArea className="h-full">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Version {selectedVersion.versionNumber}
                      </Badge>
                      {selectedVersion.isDeployed && (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Deployed
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedVersion.content.length.toLocaleString()} characters
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
                      {selectedVersion.content}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Select a version to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};