import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageSquarePlus, Pencil, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/hooks/useGoogleChat';
import type { AdminChatSession } from '@/hooks/useAdminChatSessions';

interface AdminChatSessionSidebarProps {
  sessions: AdminChatSession[];
  currentSessionId: string | undefined;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
  hasMore: boolean;
  onLoadMore?: () => void;
}

export function AdminChatSessionSidebar({
  sessions,
  currentSessionId,
  onCreateSession,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  hasMore,
  onLoadMore,
}: AdminChatSessionSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const getSessionTitle = (session: AdminChatSession) => {
    if (session.session_name) return session.session_name;
    
    const userMessages = session.messages.filter((m: Message) => m.role === 'user');
    if (userMessages.length > 0) {
      const firstMessage = userMessages[0].content;
      const contentText = typeof firstMessage === 'string' ? firstMessage : firstMessage[0]?.text || '';
      return contentText.length > 50 ? contentText.substring(0, 50) + '...' : contentText;
    }
    return 'New Chat';
  };

  const getLastMessageTime = (session: AdminChatSession) => {
    if (!session.last_message_at) return '';
    try {
      return formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const startRename = (session: AdminChatSession) => {
    setEditingSessionId(session.id);
    const title = session.session_name || getSessionTitle(session);
    setEditingName(title);
  };

  const saveRename = () => {
    if (editingSessionId && editingName.trim()) {
      onRenameSession(editingSessionId, editingName.trim());
      setEditingSessionId(null);
      setEditingName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRename();
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
      setEditingName('');
    }
  };

  const sessionsWithMessages = sessions.filter(s => s.messages.some((m: Message) => m.role === 'user'));

  return (
    <div className="h-full flex flex-col border-r bg-muted/10">
      <div className="p-4 border-b">
        <Button
          onClick={onCreateSession}
          className="w-full"
          variant="default"
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessionsWithMessages.map((session) => (
            <div
              key={session.id}
              className={`group relative rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted ${
                currentSessionId === session.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              {editingSessionId === session.id ? (
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  onBlur={saveRename}
                  autoFocus
                  className="h-8"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getSessionTitle(session)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getLastMessageTime(session)}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(session);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionId(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {hasMore && onLoadMore && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={onLoadMore}
            >
              Load More
            </Button>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteSessionId !== null} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteSessionId) {
                  onDeleteSession(deleteSessionId);
                  setDeleteSessionId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
