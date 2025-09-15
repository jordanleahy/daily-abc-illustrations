import { Badge } from '@/components/ui/badge';
import { InlineEditInput } from '@/components/ui/inline-edit-input';
import { InlineEditTextarea } from '@/components/ui/inline-edit-textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChangeResponsePanel } from '@/components/agents/ChangeResponsePanel';
import { AgentConfig } from '@/types/agent';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AgentIdentityCardProps {
  config: AgentConfig;
  onUpdate: (updates: Partial<AgentConfig>) => void;
  lastChangeDescription?: string | null;
  onClearChangeDescription?: () => void;
  className?: string;
}

export const AgentIdentityCard = ({ 
  config, 
  onUpdate, 
  lastChangeDescription, 
  onClearChangeDescription,
  className 
}: AgentIdentityCardProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const getStatusColor = (status: AgentConfig['status']) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'processing': return 'bg-warning'; 
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: AgentConfig['status']) => {
    switch (status) {
      case 'online': return 'Online';
      case 'processing': return 'Processing';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InlineEditInput
              value={config.name || ''}
              onSave={(name) => {
                onUpdate({ name });
                setEditingField(null);
              }}
              isEditing={editingField === 'name'}
              renderDisplay={(value) => (
                <h2 
                  className="text-2xl font-semibold cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setEditingField('name')}
                >
                  {value || 'Unnamed Agent'}
                </h2>
              )}
              className="text-2xl font-semibold"
              placeholder="Enter agent name"
            />
            <Badge variant="secondary" className="capitalize">
              {config.type === 'book-creation' 
                ? 'Book Creation' 
                : config.type === 'illustration-director'
                  ? 'Illustration Director'
                  : config.type} Agent
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', getStatusColor(config.status))}></div>
            <span className="text-sm text-muted-foreground">
              {getStatusText(config.status)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Agent Intent</label>
            <InlineEditTextarea
              value={config.intent || ''}
              onSave={(intent) => {
                onUpdate({ intent });
                setEditingField(null);
              }}
              isEditing={editingField === 'intent'}
              renderDisplay={(value) => (
                <p 
                  className="text-sm cursor-pointer hover:text-primary transition-colors mt-1 p-2 rounded-md hover:bg-muted/50"
                  onClick={() => setEditingField('intent')}
                >
                  {value || 'No description provided'}
                </p>
              )}
              className="min-h-[60px] text-sm"
              placeholder="Describe the agent's purpose and capabilities"
            />
        </div>

        {/* Change Response Panel - Always visible */}
        <ChangeResponsePanel
          whatChanged={lastChangeDescription}
          version={config.version || '1.0'}
          defaultMessage="Agent configuration ready"
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Version</label>
            <p className="text-sm font-mono">{config.version || '1.0'}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Created</label>
            <p className="text-sm">
              {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Last Modified</label>
            <p className="text-sm">
              {config.lastModified ? new Date(config.lastModified).toLocaleString() : 'Unknown'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Assistant ID</label>
            <p className="text-sm font-mono text-muted-foreground">
              {config.assistantId || 'Not connected'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};