import { MessageSquare, Plus, Trash2, Edit2, BookOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
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
  onDeleteSession: (sessionId: string, deleteBook: boolean) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onPrefetchSession?: (sessionId: string) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function ChatSessionSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onPrefetchSession,
  hasMore = false,
  onLoadMore,
}: ChatSessionSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleteBookToo, setDeleteBookToo] = useState(false);

  // Filter out empty sessions (sessions with no user messages)
  const sessionsWithMessages = sessions.filter((session) => {
    if (!Array.isArray(session.messages)) return false;
    return session.messages.some((msg: any) => msg.role === 'user');
  });

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
    <div className="flex flex-col h-full w-full">
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
          {sessionsWithMessages.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative rounded-lg p-3 cursor-pointer transition-colors hover:bg-accent",
                currentSessionId === session.id && "bg-accent"
              )}
              onClick={() => onSelectSession(session.id)}
              onMouseEnter={() => onPrefetchSession?.(session.id)}
            >
              <div className="flex items-start gap-2">
                {session.created_book_id ? (
                  <Check className="h-4 w-4 mt-1 flex-shrink-0 text-green-500" />
                ) : (
                  <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                )}
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
                        <p className="text-sm font-medium line-clamp-2">
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
          
          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="px-2 pb-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onLoadMore}
                className="w-full"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogId !== null} onOpenChange={(open) => {
        if (!open) {
          setDeleteDialogId(null);
          setDeleteBookToo(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Show checkbox only if this session has a created book */}
          {sessions.find(s => s.id === deleteDialogId)?.created_book_id && (
            <div className="flex items-center space-x-2 px-6">
              <Checkbox 
                id="delete-book" 
                checked={deleteBookToo}
                onCheckedChange={(checked) => setDeleteBookToo(checked === true)}
              />
              <label 
                htmlFor="delete-book" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Also delete the book created from this conversation
              </label>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialogId) {
                  onDeleteSession(deleteDialogId, deleteBookToo);
                  setDeleteDialogId(null);
                  setDeleteBookToo(false);
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
