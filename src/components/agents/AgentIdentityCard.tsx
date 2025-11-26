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
  isAdmin?: boolean;
}

export const AgentIdentityCard = ({ 
  config, 
  onUpdate, 
  lastChangeDescription, 
  onClearChangeDescription,
  className,
  isAdmin = false
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
              {config.type.startsWith('book-creation') ? 'Book Creation' : 'Chat'} Agent
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

        {/* System Prompt / Instructions - Admin Only */}
        {!isAdmin && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning-foreground font-medium">
              ⚠️ Admin Access Required
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You need admin role to view and edit system prompts. Contact your administrator to grant admin access.
            </p>
          </div>
        )}
        
        {isAdmin && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                System Prompt (Admin Only)
              </label>
              {editingField === 'instructions' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingField(null);
                      // Reset to original value by triggering parent to revert
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    onClick={() => {
                      onUpdate({ instructions: config.instructions });
                      setEditingField(null);
                    }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Done (Ctrl+Enter)
                  </button>
                </div>
              )}
            </div>
            <InlineEditTextarea
              value={config.instructions || ''}
              onSave={(instructions) => {
                onUpdate({ instructions });
                setEditingField(null);
              }}
              isEditing={editingField === 'instructions'}
              renderDisplay={(value) => (
                <div 
                  className="text-sm cursor-pointer hover:text-primary transition-colors p-3 rounded-md hover:bg-muted/50 border border-border max-h-[200px] overflow-y-auto"
                  onClick={() => setEditingField('instructions')}
                >
                  {value ? (
                    <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                      {value}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground italic">Click to add system prompt...</span>
                  )}
                </div>
              )}
              className="min-h-[300px] text-xs font-mono leading-relaxed"
              placeholder="Enter the system prompt / instructions for this agent...

Example:
You are an expert educational assistant specializing in ABC books.
Guide users through creating alphabet books with engaging themes..."
            />
            
            {/* Character counter and validation */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {config.instructions && config.instructions.length < 500 && (
                  <span className="text-destructive font-medium">
                    ⚠️ Warning: Prompt too short ({config.instructions.length} chars)
                  </span>
                )}
                <span className={config.instructions && config.instructions.length < 500 ? 'text-destructive' : 'text-muted-foreground'}>
                  {config.instructions?.length || 0} characters
                  {config.instructions && config.instructions.length >= 500 && ' ✓'}
                </span>
              </div>
              {config.instructions && config.instructions.length < 500 && (
                <span className="text-xs text-destructive">
                  Minimum 500 characters recommended for full agent functionality
                </span>
              )}
            </div>
            
            {editingField !== 'instructions' && (
              <p className="text-xs text-muted-foreground">
                💡 Click the prompt to edit. After editing, click the "Save all changes" button at the bottom of the page to persist to database.
              </p>
            )}
          </div>
        )}

        {/* Change Response Panel - Always visible */}
        <ChangeResponsePanel
          whatChanged={lastChangeDescription}
          version={config.version || '1.0'}
          defaultMessage="Agent configuration ready"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
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
        </div>
      </CardContent>
    </Card>
  );
};