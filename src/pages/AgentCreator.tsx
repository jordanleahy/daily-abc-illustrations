import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageList } from '@/components/chat/MessageList';
import { Send, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdminOnly } from '@/components/AdminOnly';
import { useAgentCreatorChat, type AgentCreatorMessage } from '@/hooks/useAgentCreatorChat';

const AgentCreatorContent = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    generatedConfig,
    resetChat
  } = useAgentCreatorChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  };

  const handleQuickReply = async (action: { value: string }) => {
    if (isLoading) return;
    await sendMessage(action.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Convert to MessageList format
  const displayMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    suggestedActions: msg.suggestedActions?.map(a => ({
      id: a.id,
      label: a.label,
      value: a.value
    }))
  }));

  return (
    <div className="flex flex-col h-screen bg-background">
      <Helmet>
        <title>Agent Creator | Chairlift Habits</title>
      </Helmet>

      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/agents')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Agent Creator</h1>
        </div>
        <div className="flex-1" />
        {messages.length > 1 && (
          <Button variant="outline" size="sm" onClick={resetChat}>
            Start Over
          </Button>
        )}
      </header>

      {/* Chat Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="max-w-3xl mx-auto pb-4">
          {displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">Create a New Book Agent</h2>
              <p className="text-muted-foreground max-w-md">
                I'll help you create a specialized book creation agent. 
                Just answer a few questions about the educational concept you want to teach.
              </p>
            </div>
          ) : (
            <MessageList
              messages={displayMessages as any}
              onQuickReply={handleQuickReply}
              isBookCreated={false}
            />
          )}
        </div>
      </ScrollArea>

      {/* Generated Config Preview */}
      {generatedConfig && (
        <div className="border-t border-border bg-muted/30 p-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-medium mb-2">Generated Agent Config</h3>
            <pre className="text-xs bg-card p-3 rounded-md overflow-auto max-h-40 border border-border">
              {JSON.stringify(generatedConfig, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-card p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your book type idea..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={isLoading}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-11 w-11"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AgentCreator = () => (
  <AdminOnly>
    <AgentCreatorContent />
  </AdminOnly>
);

export default AgentCreator;
