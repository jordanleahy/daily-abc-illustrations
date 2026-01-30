import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SharedTemplate, useUpdateSharedTemplate } from '@/hooks/useSharedTemplates';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SharedTemplateEditorProps {
  template: SharedTemplate;
  placeholders: string[];
  onClose: () => void;
}

export const SharedTemplateEditor = ({ template, placeholders, onClose }: SharedTemplateEditorProps) => {
  const [content, setContent] = useState(template.content);
  const [changeNotes, setChangeNotes] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const updateTemplate = useUpdateSharedTemplate();

  const hasChanges = content !== template.content;
  const charCount = content.length;

  // Check which placeholders are present in the content
  const placeholderStatus = placeholders.map((placeholder) => ({
    placeholder,
    present: content.includes(placeholder),
  }));

  const missingPlaceholders = placeholderStatus.filter((p) => !p.present);

  const handleSave = async () => {
    if (!hasChanges) return;

    await updateTemplate.mutateAsync({
      templateKey: template.template_key,
      content,
      changeNotes: changeNotes || undefined,
    });

    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">
            Edit {template.template_key === 'cover' ? 'Cover Page' : 'Educational Focus'} Template
          </h2>
          <p className="text-sm text-muted-foreground">
            Current version: v{template.version_number}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateTemplate.isPending}
        >
          <Save className="h-4 w-4 mr-1" />
          {updateTemplate.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Placeholder validation */}
      {missingPlaceholders.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Missing placeholders:</span>
              {missingPlaceholders.map((p) => (
                <Badge key={p.placeholder} variant="outline" className="font-mono text-xs border-amber-500/50">
                  {p.placeholder}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Template Content</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{charCount} chars</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="lg:hidden"
                >
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
              </div>
            </div>
            <CardDescription>
              Use markdown formatting and placeholders for dynamic content
            </CardDescription>
          </CardHeader>
          <CardContent className={showPreview ? 'hidden lg:block' : ''}>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Enter template content..."
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className={!showPreview ? 'hidden lg:block' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Preview</CardTitle>
            <CardDescription>
              How the template will appear (placeholders shown as-is)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none min-h-[400px] p-4 bg-muted/30 rounded-lg overflow-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change notes */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="changeNotes">Change Notes (optional)</Label>
              <Input
                id="changeNotes"
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="Describe what changed in this version..."
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder reference */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Available Placeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {placeholderStatus.map(({ placeholder, present }) => (
              <Badge
                key={placeholder}
                variant={present ? 'default' : 'outline'}
                className="font-mono text-xs cursor-pointer"
                onClick={() => {
                  // Insert placeholder at cursor or end
                  setContent((prev) => prev + placeholder);
                }}
              >
                {present && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {placeholder}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
