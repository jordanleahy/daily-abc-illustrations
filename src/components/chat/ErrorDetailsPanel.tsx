import { AlertCircle, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { LovableAiError } from '@/utils/lovableAiErrors';

export interface ErrorDetails extends LovableAiError {
  /** Where this error came from (e.g. "generate-color-image") */
  source: string;
  /** Timestamp when captured */
  at: string;
}

interface ErrorDetailsPanelProps {
  error: ErrorDetails;
  onDismiss: () => void;
}

export function ErrorDetailsPanel({ error, onDismiss }: ErrorDetailsPanelProps) {
  const rawJson = JSON.stringify(error.raw, null, 2);

  const handleCopy = async () => {
    const payload = [
      `source: ${error.source}`,
      `at: ${error.at}`,
      `code: ${error.code || '(none)'}`,
      `status: ${error.status ?? '(none)'}`,
      `message: ${error.rawMessage || '(none)'}`,
      '',
      'raw:',
      rawJson,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(payload);
      toast.success('Error details copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 text-sm">
      <div className="flex items-start gap-2 px-3 py-2 border-b border-destructive/20">
        <AlertCircle className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-destructive">Image generation error</div>
          <div className="text-xs text-muted-foreground">
            {error.source} • {new Date(error.at).toLocaleTimeString()}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copy details">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDismiss} title="Dismiss">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 px-3 py-2 text-xs">
        <dt className="text-muted-foreground">Code</dt>
        <dd className="font-mono break-all">{error.code || '—'}</dd>
        <dt className="text-muted-foreground">Status</dt>
        <dd className="font-mono">{error.status ?? '—'}</dd>
        <dt className="text-muted-foreground">Message</dt>
        <dd className="font-mono break-words whitespace-pre-wrap">
          {error.rawMessage || error.message || '—'}
        </dd>
      </dl>

      <details className="px-3 py-2 border-t border-destructive/20">
        <summary className="cursor-pointer text-xs text-muted-foreground select-none">
          Raw payload
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-[11px] leading-snug">
{rawJson}
        </pre>
      </details>
    </div>
  );
}
