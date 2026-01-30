import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RotateCcw, Check, Clock } from 'lucide-react';
import { useSharedTemplateVersions, useRestoreTemplateVersion, SharedTemplate } from '@/hooks/useSharedTemplates';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TemplateVersionHistoryProps {
  templateKey: string;
  templateName: string;
  onClose: () => void;
}

export const TemplateVersionHistory = ({ templateKey, templateName, onClose }: TemplateVersionHistoryProps) => {
  const { data: versions, isLoading, error } = useSharedTemplateVersions(templateKey);
  const restoreVersion = useRestoreTemplateVersion();

  const handleRestore = async (version: SharedTemplate) => {
    await restoreVersion.mutateAsync({
      templateKey,
      versionToRestore: version,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load version history</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-xl font-bold">{templateName} - Version History</h2>
          <p className="text-sm text-muted-foreground">
            {versions?.length} version{versions?.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {versions?.map((version) => (
          <Card
            key={version.id}
            className={version.is_latest ? 'border-primary/50 bg-primary/5' : ''}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">
                    Version {version.version_number}
                  </CardTitle>
                  {version.is_latest && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Current
                    </Badge>
                  )}
                </div>
                {!version.is_latest && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={restoreVersion.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Restore Version {version.version_number}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a new version with the content from version {version.version_number}.
                          The current version will be preserved in history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRestore(version)}>
                          Restore
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {format(new Date(version.created_at), 'PPp')}
                <span className="text-muted-foreground/50">•</span>
                {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {version.change_notes && (
                <p className="text-sm text-muted-foreground mb-3">{version.change_notes}</p>
              )}
              <details className="group">
                <summary className="cursor-pointer text-sm text-primary hover:underline">
                  View content ({version.content.length} chars)
                </summary>
                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">
                  {version.content}
                </pre>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
