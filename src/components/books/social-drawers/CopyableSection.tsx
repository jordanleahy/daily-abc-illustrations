import { Button } from '@/components/ui/button';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyableSectionProps {
  label: string;
  content: string;
  isCopied: boolean;
  onCopy: (e: React.MouseEvent) => void;
  charCount?: { current: number; max: number };
  variant?: 'default' | 'inline' | 'muted';
  className?: string;
  isMonospace?: boolean;
}

/**
 * Reusable copyable content section for social post drawers
 * Provides consistent copy button styling and feedback
 */
export function CopyableSection({
  label,
  content,
  isCopied,
  onCopy,
  charCount,
  variant = 'default',
  className,
  isMonospace = false,
}: CopyableSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {charCount ? (
          <span className="text-xs text-muted-foreground">
            {charCount.current}/{charCount.max} chars
          </span>
        ) : variant === 'default' ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onCopy}
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3 text-primary" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        ) : null}
      </div>
      <div className={cn("relative", variant === 'inline' && charCount && "pr-0")}>
        <div
          className={cn(
            "p-3 rounded-lg text-sm",
            variant === 'muted' ? "bg-muted/50 text-xs text-muted-foreground max-h-24" : "bg-muted max-h-48",
            "overflow-y-auto whitespace-pre-wrap break-words",
            isMonospace && "font-mono break-all",
            charCount && "pr-12",
            className
          )}
        >
          {content}
        </div>
        {charCount && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={onCopy}
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
