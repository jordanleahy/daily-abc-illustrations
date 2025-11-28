import { useState, useEffect } from 'react';
import { AdminOnly } from '@/components/AdminOnly';
import { PageLayout } from '@/components/layout/PageLayout';
import { MessageList } from '@/components/chat/MessageList';
import { useAdminChat } from '@/hooks/useAdminChat';
import { useAdminChatSessions } from '@/hooks/useAdminChatSessions';
import { AdminChatSessionSidebar } from '@/components/chat/AdminChatSessionSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Send } from 'lucide-react';

export default function AdminChat() {
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [input, setInput] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false); // Auto-close on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-create first session if none exist
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0 && !currentSessionId) {
      console.log('[AdminChat] Auto-creating first session');
      createSession().then((newSession) => {
        console.log('[AdminChat] Session created:', newSession.id);
        setCurrentSessionId(newSession.id);
      }).catch(error => {
        console.error('[AdminChat] Error creating initial session:', error);
      });
    } else if (!sessionsLoading && sessions.length > 0 && !currentSessionId) {
      // Auto-select first session if sessions exist but none selected
      console.log('[AdminChat] Auto-selecting first session:', sessions[0].id);
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessionsLoading, sessions.length, currentSessionId]);

  const handleCreateSession = async () => {
    try {
      const newSession = await createSession();
      setCurrentSessionId(newSession.id);
      if (isMobile) {
        setIsMobileSidebarOpen(false); // Close sidebar after creating on mobile
      }
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
      <PageLayout 
        title="Admin Chat" 
        showHeader={true} 
        fullHeight={true}
        onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
      >
        <div className="fixed inset-0 top-[3.5rem] flex bg-background">
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

          {/* Mobile Sidebar Sheet */}
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <AdminChatSessionSidebar
                sessions={sessions}
                currentSessionId={currentSessionId}
                onCreateSession={handleCreateSession}
                onSelectSession={(sessionId) => {
                  setCurrentSessionId(sessionId);
                  setIsMobileSidebarOpen(false);
                }}
                onRenameSession={(sessionId, name) => updateSessionName({ sessionId, name })}
                onDeleteSession={handleDeleteSession}
                hasMore={hasMore}
                onLoadMore={loadMore}
              />
            </SheetContent>
          </Sheet>

          {/* Chat Area */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center px-4">
                  <div className="max-w-md">
                    <h2 className="text-xl font-semibold mb-2">Welcome to Marketing Intelligence</h2>
                    <p className="text-sm text-muted-foreground">Ask me anything about content marketing strategies, growth ideas, or campaign suggestions.</p>
                  </div>
                </div>
              ) : (
                <MessageList messages={messages} />
              )}
            </div>

            {/* Sticky Footer */}
            <div className="border-t px-4 md:px-6 py-4 bg-background">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    !currentSessionId 
                      ? "Creating session..." 
                      : isLoading 
                        ? "Sending..." 
                        : "Ask about marketing strategies, content ideas..."
                  }
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
      </PageLayout>
    </AdminOnly>
  );
}
