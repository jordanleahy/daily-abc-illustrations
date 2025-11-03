import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2, Info, SkipForward, AlertTriangle } from 'lucide-react';
import { ProcessStatus } from '@/types/shared';

/**
 * Message structure for progress tracking in console displays
 * Used to show step-by-step progress of long-running operations like book generation
 */
export interface ProgressMessage {
  /** Identifier for the current operation step */
  step: string;
  /** Human-readable description of what's happening */
  message: string;
  /** ISO timestamp when this message was generated */
  timestamp: string;
  /** Current status of this step in the process */
  status: ProcessStatus;
  /** Optional style guide content generated during the process */
  styleGuide?: string;
  /** Information about the AI agent used for this step */
  agentUsed?: {
    /** Display name of the agent */
    name: string;
    /** AI model identifier used by the agent */
    model: string;
    /** Version of the agent configuration */
    version: string;
  };
}

interface ProgressConsoleProps {
  messages: ProgressMessage[];
  isExpanded: boolean;
  onToggle: () => void;
  isActive: boolean;
}

const getStatusIcon = (status: ProcessStatus) => {
  switch (status) {
    case ProcessStatus.COMPLETE:
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    case ProcessStatus.ERROR:
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case ProcessStatus.WARNING:
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case ProcessStatus.IN_PROGRESS:
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case ProcessStatus.SKIPPED:
      return <SkipForward className="w-4 h-4 text-muted-foreground" />;
    case ProcessStatus.NOT_STARTED:
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const ProgressConsole = ({ messages, isExpanded, onToggle, isActive }: ProgressConsoleProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestMessage = messages[messages.length - 1];

  useEffect(() => {
    if (messagesEndRef.current && isExpanded) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  return (
    <Card className="w-full border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">
              Style Guide Generation Progress
            </CardTitle>
            {isActive && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggle}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
        
        {latestMessage && !isExpanded && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon(latestMessage.status)}
            <span>{latestMessage.message}</span>
            <span className="text-xs opacity-60">
              {formatTime(latestMessage.timestamp)}
            </span>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="bg-muted/30 rounded-md p-3 max-h-64 overflow-y-auto">
            <div className="space-y-2 font-mono text-sm">
              {messages.map((msg, index) => (
                <div key={`${msg.step}-${msg.timestamp}`} className="flex items-start gap-2 group">
                  <span className="text-xs text-muted-foreground mt-0.5 shrink-0">
                    {formatTime(msg.timestamp)}
                  </span>
                  <div className="shrink-0 mt-0.5">
                    {getStatusIcon(msg.status)}
                  </div>
                  <span className={`leading-tight ${
                    msg.status === ProcessStatus.ERROR 
                      ? 'text-red-600' 
                      : msg.status === ProcessStatus.COMPLETE 
                        ? 'text-emerald-600'
                        : msg.status === ProcessStatus.WARNING
                          ? 'text-yellow-600'
                        : 'text-foreground'
                  }`}>
                    {msg.message}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};