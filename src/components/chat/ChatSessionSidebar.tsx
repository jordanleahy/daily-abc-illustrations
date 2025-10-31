import { MessageSquare, Plus, Trash2, Edit2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ChatSession } from '@/hooks/useGoogleChatSessions';

interface ChatSessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
}

export function ChatSessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
}: ChatSessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  const handleStartEdit = (session: ChatSession) => {
    setEditingId(session.id);
    setEditName(session.session_name || getSessionTitle(session));
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editName.trim()) {
      onRenameSession(sessionId, editName.trim());
    }
    setEditingId(null);
  };

  const getSessionTitle = (session: ChatSession): string => {
    if (session.session_name) return session.session_name;
    
    // Generate title from first user message
    const firstUserMessage = session.messages.find((m: any) => m.role === 'user');
    if (firstUserMessage && typeof firstUserMessage.content === 'string') {
      return firstUserMessage.content.slice(0, 30) + (firstUserMessage.content.length > 30 ? '...' : '');
    }
    
    return 'New Conversation';
  };

  const getLastMessageTime = (session: ChatSession): string => {
    if (!session.last_message_at) return 'Just now';
    try {
      return formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={onCreateSession} 
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative rounded-lg p-3 cursor-pointer transition-colors hover:bg-accent",
                currentSessionId === session.id && "bg-accent"
              )}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  {editingId === session.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleSaveEdit(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(session.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 text-sm"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">
                          {getSessionTitle(session)}
                        </p>
                        {session.created_book_id && (
                          <BookOpen className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {getLastMessageTime(session)}
                      </p>
                    </>
                  )}
                </div>

                {/* Action Buttons - Show on hover */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(session);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogId(session.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogId !== null} onOpenChange={() => setDeleteDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialogId) {
                  onDeleteSession(deleteDialogId);
                  setDeleteDialogId(null);
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
