import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Play, RotateCcw, Clock, User } from 'lucide-react';
import { PageSystemPromptVersion } from '@/types/pageSystemPrompt';

interface PageVersionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versions: PageSystemPromptVersion[];
  currentVersionId?: string;
  onClose: () => void;
  onRevert: (versionId: string) => void;
  onDeploy: (versionId: string) => void;
}

export function PageVersionHistoryModal({
  open,
  onOpenChange,
  versions,
  currentVersionId,
  onClose,
  onRevert,
  onDeploy,
}: PageVersionHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<PageSystemPromptVersion | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const sortedVersions = [...versions].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleRevert = async (versionId: string) => {
    setIsReverting(true);
    try {
      await onRevert(versionId);
      onClose();
    } finally {
      setIsReverting(false);
    }
  };

  const handleDeploy = async (versionId: string) => {
    setIsDeploying(true);
    try {
      await onDeploy(versionId);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Page System Prompt Version History</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[60vh]">
          {/* Version List */}
          <div className="space-y-4">
            <h3 className="font-semibold">All Versions</h3>
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {sortedVersions.map((version) => (
                  <Card
                    key={version.id}
                    className={`cursor-pointer transition-colors ${
                      selectedVersion?.id === version.id 
                        ? 'ring-2 ring-primary' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            v{version.version_number}
                          </Badge>
                          {version.id === currentVersionId && (
                            <Badge variant="secondary">Current</Badge>
                          )}
                          {version.is_deployed && (
                            <Badge variant="default">
                              <Play className="h-3 w-3 mr-1" />
                              Deployed
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {version.source_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(version.created_at).toLocaleString()}
                      </div>
                      <p className="text-sm mt-2 line-clamp-2">
                        {version.content.substring(0, 100)}...
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Version Preview */}
          <div className="space-y-4">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Version {selectedVersion.version_number} Preview
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(selectedVersion.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!selectedVersion.is_deployed && (
                      <Button
                        size="sm"
                        onClick={() => handleDeploy(selectedVersion.id)}
                        disabled={isDeploying}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Deploy
                      </Button>
                    )}
                    {selectedVersion.id !== currentVersionId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevert(selectedVersion.id)}
                        disabled={isReverting}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Revert to This
                      </Button>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>Source: {selectedVersion.source_type}</span>
                  </div>
                  {selectedVersion.deployed_at && (
                    <>
                      <Separator orientation="vertical" className="h-3" />
                      <div className="flex items-center gap-2">
                        <Play className="h-3 w-3" />
                        <span>Deployed: {new Date(selectedVersion.deployed_at).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>

                <ScrollArea className="flex-1">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedVersion.content}
                    </pre>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>Select a version to preview its content</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}