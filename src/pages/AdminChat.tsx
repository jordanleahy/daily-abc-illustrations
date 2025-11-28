import { useState, useEffect } from 'react';
import { AdminOnly } from '@/components/AdminOnly';
import { MessageList } from '@/components/chat/MessageList';
import { useAdminChat } from '@/hooks/useAdminChat';
import { useAdminChatSessions } from '@/hooks/useAdminChatSessions';
import { AdminChatSessionSidebar } from '@/components/chat/AdminChatSessionSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

export default function AdminChat() {
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [input, setInput] = useState('');

  const {
    sessions,
    isLoading: sessionsLoading,
    hasMore,
    loadMore,
    createSession,
    updateSessionMessages,
    updateSessionName,
    deleteSession,
  } = useAdminChatSessions();

  const handleMessagesUpdate = async (messages: any[]) => {
    if (currentSessionId) {
      await updateSessionMessages({ sessionId: currentSessionId, messages });
    }
  };

  const { messages, isLoading, sendMessage } = useAdminChat({
    sessionId: currentSessionId,
    onMessagesUpdate: handleMessagesUpdate,
  });

  // Auto-create first session if none exist
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0 && !currentSessionId) {
      createSession().then((newSession) => {
        setCurrentSessionId(newSession.id);
      }).catch(error => {
        console.error('Error creating initial session:', error);
      });
    }
  }, [sessionsLoading, sessions.length, currentSessionId, createSession]);

  const handleCreateSession = async () => {
    try {
      const newSession = await createSession();
      setCurrentSessionId(newSession.id);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions[0]?.id);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AdminOnly>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-80">
          <AdminChatSessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onCreateSession={handleCreateSession}
            onSelectSession={setCurrentSessionId}
            onRenameSession={(sessionId, name) => updateSessionName({ sessionId, name })}
            onDeleteSession={handleDeleteSession}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        </div>

        {/* Chat Area */}
        <div className="flex flex-col flex-1">
          <div className="border-b px-6 py-4">
            <h1 className="text-2xl font-bold">Marketing Intelligence Chat</h1>
            <p className="text-sm text-muted-foreground">AI-powered marketing assistant for content growth</p>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Welcome to Marketing Intelligence</h2>
                  <p className="text-muted-foreground">Ask me anything about content marketing strategies, growth ideas, or campaign suggestions.</p>
                </div>
              </div>
            ) : (
              <MessageList messages={messages} />
            )}
          </div>

          <div className="border-t px-6 py-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about marketing strategies, content ideas..."
                disabled={isLoading || !currentSessionId}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !currentSessionId}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  );
}
