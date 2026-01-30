import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Edit, History, Clock } from 'lucide-react';
import { useSharedTemplates, SharedTemplate } from '@/hooks/useSharedTemplates';
import { useSharedTemplatesSubscription } from '@/hooks/useSharedTemplatesSubscription';
import { SharedTemplateEditor } from './SharedTemplateEditor';
import { TemplateVersionHistory } from './TemplateVersionHistory';
import { formatDistanceToNow } from 'date-fns';

const TEMPLATE_DISPLAY_NAMES: Record<string, string> = {
  cover: 'Cover Page Template',
  educational: 'Educational Focus Template',
  outline_format: 'Outline Format Rules',
};

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  cover: 'Controls how cover pages (Page 1) are generated across all book types',
  educational: 'Controls how educational focus pages (Page 2) are generated with grade/skill badges',
  outline_format: 'Standardizes page format across all agents to ensure consistent parsing',
};

const AVAILABLE_PLACEHOLDERS: Record<string, string[]> = {
  cover: ['{{bookTypeWord}}', '{{COVER_TITLE_INSTRUCTION}}'],
  educational: ['{{gradeLevel}}', '{{learningType}}', '{{skillFocus}}'],
  outline_format: [], // No placeholders - static format rules
};

export const SharedTemplatesManager = () => {
  const { data: templates, isLoading, error } = useSharedTemplates();
  const [editingTemplate, setEditingTemplate] = useState<SharedTemplate | null>(null);
  const [viewingHistory, setViewingHistory] = useState<string | null>(null);

  // Enable real-time updates
  useSharedTemplatesSubscription();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load shared templates</p>
        </CardContent>
      </Card>
    );
  }

  if (editingTemplate) {
    return (
      <SharedTemplateEditor
        template={editingTemplate}
        placeholders={AVAILABLE_PLACEHOLDERS[editingTemplate.template_key] || []}
        onClose={() => setEditingTemplate(null)}
      />
    );
  }

  if (viewingHistory) {
    return (
      <TemplateVersionHistory
        templateKey={viewingHistory}
        templateName={TEMPLATE_DISPLAY_NAMES[viewingHistory] || viewingHistory}
        onClose={() => setViewingHistory(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shared Page Templates</h2>
          <p className="text-muted-foreground">
            Centralized templates for cover and educational pages used across all book types
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {templates?.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {TEMPLATE_DISPLAY_NAMES[template.template_key] || template.template_key}
                    </CardTitle>
                    <CardDescription>
                      {TEMPLATE_DESCRIPTIONS[template.template_key]}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">v{template.version_number}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Updated {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}</span>
                  {template.change_notes && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="truncate max-w-[300px]">{template.change_notes}</span>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingHistory(template.template_key)}
                  >
                    <History className="h-4 w-4 mr-1" />
                    History
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setEditingTemplate(template)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Available placeholders */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Available Placeholders:</p>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_PLACEHOLDERS[template.template_key]?.map((placeholder) => (
                    <Badge key={placeholder} variant="outline" className="font-mono text-xs">
                      {placeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder documentation */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Placeholder Reference</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Cover Page Placeholders</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="text-xs bg-muted px-1 rounded">{'{{bookTypeWord}}'}</code> - Book type display word (e.g., "ABCs", "Rhyme Time")</li>
                <li><code className="text-xs bg-muted px-1 rounded">{'{{COVER_TITLE_INSTRUCTION}}'}</code> - Standard title display instruction</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Educational Page Placeholders</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="text-xs bg-muted px-1 rounded">{'{{gradeLevel}}'}</code> - Selected grade level text</li>
                <li><code className="text-xs bg-muted px-1 rounded">{'{{learningType}}'}</code> - Learning type badge text</li>
                <li><code className="text-xs bg-muted px-1 rounded">{'{{skillFocus}}'}</code> - Skill focus badge text</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Outline Format</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>No placeholders - static format rules</li>
                <li>Injected via <code className="text-xs bg-muted px-1 rounded">{'{{SHARED_OUTLINE_FORMAT}}'}</code></li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
