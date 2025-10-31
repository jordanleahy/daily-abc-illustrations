import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Sparkles, Book, Trash2, Image as ImageIcon, Copy, ArrowLeft, ArrowRight, Check, BookOpen } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { useGoogleChat, type SuggestedAction } from '@/hooks/useGoogleChat';
import { useGoogleCreateBook } from '@/hooks/useGoogleCreateBook';
import { useGoogleChatSessions } from '@/hooks/useGoogleChatSessions';
import { useBookPageImages } from '@/hooks/useBookPageImages';
import { ChatSessionSidebar } from '@/components/chat/ChatSessionSidebar';
import { toast } from 'sonner';
import { BOOK_TYPES } from '@/config/bookTypes';

interface PageDetail {
  pageNumber: number;
  title: string;
  description: string;
}

const parsePageDetailsFromMessages = (messages: any[]): PageDetail[] | null => {
  // Find the last assistant message containing the book outline
  const lastAssistantMsg = [...messages].reverse().find(
    msg => msg.role === 'assistant' && 
    typeof msg.content === 'string' && 
    /\*\*Page\s+\d+:/i.test(msg.content)
  );
  
  if (!lastAssistantMsg || typeof lastAssistantMsg.content !== 'string') {
    return null;
  }
  
  // Regex pattern to match: **Page 16: "I"*** OR **Page 16: my** (quotes optional)
  const pagePattern = /\*\*Page\s+(\d+):\s*["']?([^"'\n*]+)["']?\*+\s*\n([^\n]+(?:\n(?!\*\*Page)[^\n]+)*)/gi;
  const pages: PageDetail[] = [];
  let match;
  
  while ((match = pagePattern.exec(lastAssistantMsg.content)) !== null) {
    const [, pageNum, title, description] = match;
    pages.push({
      pageNumber: parseInt(pageNum, 10),
      title: title.trim(),
      description: description.trim().replace(/\n/g, ' ') // Single line
    });
  }
  
  return pages.length > 0 ? pages : null;
};
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function GoogleChat() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    sessions,
    isLoading: sessionsLoading,
    createSession,
    updateSessionMessages,
    updateSessionName,
    deleteSession,
    linkBookToSession,
    updateQAPageImages,
  } = useGoogleChatSessions();

  const { messages, isLoading, sendMessage, sendMessageWithImage, clearMessages } = useGoogleChat(
    currentSessionId || undefined,
    async (updatedMessages) => {
      // Auto-save messages to database
      if (currentSessionId) {
        await updateSessionMessages({
          sessionId: currentSessionId,
          messages: updatedMessages,
        });
      }
    }
  );

  const createBookMutation = useGoogleCreateBook();

  // Get the created book ID from current session
  const selectedSession = sessions?.find(s => s.id === currentSessionId);
  const createdBookId = selectedSession?.created_book_id || null;

  // Fetch book images from storage if book exists
  const { data: bookPageImages, isLoading: bookImagesLoading } = useBookPageImages(createdBookId);

  // QA Checkpoint state
  const [currentQAPage, setCurrentQAPage] = useState(1);
  const [qaPageImages, setQAPageImages] = useState<Record<number, string>>({});
  const [showQACheckpoint, setShowQACheckpoint] = useState(false);

  // Priority: Show book images from storage if book exists, otherwise show QA checkpoint images
  const displayImages = (createdBookId && bookPageImages) ? bookPageImages : qaPageImages;
  const isBookCreated = !!createdBookId;

  // Detect when book outline is ready for QA checkpoint
  const shouldShowQACheckpoint = useMemo(() => {
    if (isLoading || messages.length === 0) return false;
    const pageDetails = parsePageDetailsFromMessages(messages);
    const hasPages = pageDetails !== null && pageDetails.length >= 10;
    return hasPages && !createBookMutation.isSuccess;
  }, [messages, isLoading, createBookMutation.isSuccess]);

  const pageCount = useMemo(() => {
    const details = parsePageDetailsFromMessages(messages);
    return details?.length || 0;
  }, [messages]);

  // Helper to get current page prompt
  const getCurrentPagePrompt = (messages: any[], pageNum: number): string | null => {
    const pageDetails = parsePageDetailsFromMessages(messages);
    if (!pageDetails || pageDetails.length === 0) return null;
    
    const page = pageDetails.find((p: any) => p.pageNumber === pageNum);
    if (!page) return null;
    
    return `**Page ${page.pageNumber}: "${page.title}"**\n\n${page.description}`;
  };

  // Create initial session on mount if none exists
  useEffect(() => {
    if (!sessionsLoading && sessions.length === 0) {
      handleCreateNewSession();
    } else if (!sessionsLoading && sessions.length > 0 && !currentSessionId) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessionsLoading, sessions.length]);

  // Auto-show QA checkpoint when page details are ready
  useEffect(() => {
    if (shouldShowQACheckpoint && !showQACheckpoint) {
      setShowQACheckpoint(true);
      setCurrentQAPage(1);
      
      // Scroll to bottom to show the banner
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [shouldShowQACheckpoint, showQACheckpoint]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const message = input.trim() || 'What do you think of this style for inspiration?';
      setInput('');
      setShowImageUpload(false);
      await sendMessageWithImage(message, base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleBookTypeSelect = async (bookType: typeof BOOK_TYPES[0]) => {
    if (bookType.needsClarification && bookType.clarificationContext) {
      // Send clarification request to AI
      const clarificationPrompt = `${bookType.prompt}\n\n[CLARIFICATION_NEEDED: ${bookType.clarificationContext}]`;
      await sendMessage(clarificationPrompt);
    } else {
      // Send direct prompt
      await sendMessage(bookType.prompt);
    }
  };

  const handleQuickReply = async (action: SuggestedAction) => {
    if (action.value) {
      // Send the predefined response
      await sendMessage(action.value);
    } else {
      // "Custom" option - just focus the input field
      const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  };

  const handleCreateNewSession = async () => {
    try {
      const newSession = await createSession(undefined);
      setCurrentSessionId(newSession.id);
      setCurrentQAPage(1);
      setQAPageImages({});
      setShowQACheckpoint(false);
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    if (sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
      setCurrentQAPage(1);
      setShowQACheckpoint(false);
      
      // Load QA images from the selected session
      const session = sessions.find(s => s.id === sessionId);
      if (session?.qa_page_images) {
        setQAPageImages(session.qa_page_images);
      } else {
        setQAPageImages({});
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
    
    // If we deleted the current session, switch to another one
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      if (remainingSessions.length > 0) {
        setCurrentSessionId(remainingSessions[0].id);
      } else {
        handleCreateNewSession();
      }
    }
  };

  const handleRenameSession = async (sessionId: string, name: string) => {
    await updateSessionName({ sessionId, name });
  };

  const handleQAImageUpload = async (imageDataUrl: string) => {
    // Store image for the current page
    const updatedImages = {
      ...qaPageImages,
      [currentQAPage]: imageDataUrl
    };
    setQAPageImages(updatedImages);
    
    // Persist to database
    if (currentSessionId) {
      try {
        await updateQAPageImages({ sessionId: currentSessionId, qaPageImages: updatedImages });
      } catch (error) {
        console.error('Failed to save QA image:', error);
      }
    }
    
    toast.success(`Page ${currentQAPage} image uploaded!`, {
      description: `Image saved. ${currentQAPage < pageCount ? 'Moving to next page...' : 'All pages reviewed!'}`
    });
    
    // Auto-advance to next page if not the last page
    if (currentQAPage < pageCount) {
      setTimeout(() => {
        setCurrentQAPage(currentQAPage + 1);
      }, 500);
    } else {
      toast.success('All pages reviewed!', {
        description: 'Click "Create Book" when ready to finalize.'
      });
    }
  };

  const handleQAPageNavigation = (direction: 'next' | 'prev') => {
    const pageDetails = parsePageDetailsFromMessages(messages);
    if (!pageDetails) return;
    
    if (direction === 'next' && currentQAPage < pageDetails.length) {
      setCurrentQAPage(currentQAPage + 1);
    } else if (direction === 'prev' && currentQAPage > 1) {
      setCurrentQAPage(currentQAPage - 1);
    }
  };

  const handleCreateBook = async () => {
    if (!currentSessionId) {
      toast.error('No active session');
      return;
    }

    if (messages.length === 0) {
      toast.error('Please have a conversation first');
      return;
    }

    // Parse structured page details from conversation
    const pageDetails = parsePageDetailsFromMessages(messages);
    
    if (pageDetails) {
      console.log(`Extracted ${pageDetails.length} page details from conversation`);
    } else {
      console.log('No structured page details found, will let AI generate structure');
    }

    // Convert messages to simple text format for book creation
    const textMessages = messages.map(msg => ({
      role: msg.role,
      content: typeof msg.content === 'string' ? msg.content : '[Image uploaded]'
    }));

    toast.success('Creating book in background...', {
      description: 'You can continue chatting. Check your library shortly.'
    });

    try {
      const result = await createBookMutation.mutateAsync({
        conversationHistory: textMessages,
        pageDetails: pageDetails || undefined,
        qaImages: Object.keys(qaPageImages).length > 0 ? qaPageImages : undefined
      });
      
      // Link book to current session
      await linkBookToSession({ 
        sessionId: currentSessionId, 
        bookId: result.bookId 
      });
      
      toast.success('Book created successfully!', {
        description: 'Click "View Created Book" to see your new book.'
      });
      
      // Reset QA checkpoint state
      setShowQACheckpoint(false);
      setCurrentQAPage(1);
      setQAPageImages({});
    } catch (error) {
      console.error('Book creation error:', error);
      // Error toast is handled by the mutation
    }
  };

  return (
    <PageLayout 
      title="Chat with Google Gemini"
      showHeader={true}
      fullHeight={true}
    >
      <div className="fixed inset-0 top-[3.5rem] flex">
        {/* Chat History Sidebar */}
        <div className="w-64 border-r bg-muted/30 flex flex-col h-full resize-x overflow-auto" style={{ minWidth: '200px', maxWidth: '600px' }}>
          <ChatSessionSidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onCreateSession={handleCreateNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-6">
              <div className="max-w-4xl w-full space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h2 className="text-2xl font-bold">What would you like to create?</h2>
                  <p className="text-muted-foreground">
                    Choose a book type below or describe your own custom idea
                  </p>
                </div>

                {/* Book Type Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <TooltipProvider>
                    {BOOK_TYPES.map((bookType) => {
                      const IconComponent = bookType.icon;
                      return (
                        <Tooltip key={bookType.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              onClick={() => handleBookTypeSelect(bookType)}
                              disabled={isLoading}
                              className="h-auto flex flex-col items-center gap-3 p-4 hover:bg-accent hover:scale-105 transition-all"
                            >
                              <IconComponent className={`h-8 w-8 ${bookType.color}`} />
                              <span className="text-sm font-medium text-center leading-tight">
                                {bookType.label}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs">{bookType.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or describe your own idea
                    </span>
                  </div>
                </div>

                {/* Example prompt */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Example: "Create an ABC book about dinosaurs" or "Numbers book with space theme"
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-[80%] space-y-2">
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.role === 'assistant' && typeof msg.content === 'string' && /^\d+\./.test(msg.content) ? (
                        // Enhanced formatting for numbered lists (page ideas)
                        <div className="space-y-3">
                          {msg.content
                            .replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '')
                            .trim()
                            .split(/\n(?=\d+\.)/)
                            .map((item, i) => {
                              const match = item.match(/^(\d+)\.\s+(.+)/s);
                              if (match) {
                                const [, number, content] = match;
                                // Check if content has bold markers (**text**)
                                const parts = content.split(/(\*\*.*?\*\*)/g);
                                
                                const handleCopyPage = () => {
                                  navigator.clipboard.writeText(content.trim());
                                  toast.success(`Page ${number} description copied to clipboard`);
                                };
                                
                                return (
                                  <div key={i} className="relative flex gap-3 p-3 rounded-md bg-background/50 border border-border/50 hover:border-primary/50 transition-colors group">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                                      {number}
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                      <p className="text-sm leading-relaxed">
                                        {parts.map((part, j) => {
                                          if (part.startsWith('**') && part.endsWith('**')) {
                                            return (
                                              <span key={j} className="font-semibold text-foreground">
                                                {part.slice(2, -2)}
                                              </span>
                                            );
                                          }
                                          return <span key={j}>{part}</span>;
                                        })}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={handleCopyPage}
                                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              }
                              return (
                                <p key={i} className="text-sm whitespace-pre-wrap">
                                  {item.trim()}
                                </p>
                              );
                            })}
                        </div>
                      ) : (
                        // Regular text content
                        <p className="text-sm whitespace-pre-wrap">
                          {typeof msg.content === 'string' 
                            ? msg.content.replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '').trim()
                            : 'Image uploaded'
                          }
                        </p>
                      )}
                    </div>
                    
                    {/* Quick Reply Buttons */}
                    {msg.role === 'assistant' && msg.suggestedActions && idx === messages.length - 1 && !isLoading && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground px-1">
                          Quick options (or type your own below):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestedActions.map((action) => (
                            <Button
                              key={action.id}
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickReply(action)}
                              className="text-xs h-8"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Google Gemini is thinking...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QA Checkpoint Banner - Shows page-by-page review */}
        {showQACheckpoint && !createBookMutation.isSuccess && (
          <div className="border-t-2 border-primary/20 bg-gradient-to-b from-primary/5 to-background px-4 py-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Book Created Banner */}
              {isBookCreated && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Book Created Successfully!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Images below are from your created book
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/books/${createdBookId}`)}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Book
                    </Button>
                  </div>
                </div>
              )}

              {/* Header with Progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                    {currentQAPage}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">
                      Review & Test Page {currentQAPage}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {pageCount} pages total • Test this prompt in your AI tool
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {isBookCreated 
                    ? `${Object.keys(displayImages).length} images in book`
                    : `${Object.keys(qaPageImages).length} images uploaded`
                  }
                </Badge>
              </div>

              {/* Page Prompt Display & Image Upload - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Page Prompt Display */}
                <div className="relative bg-background/80 backdrop-blur-sm border-2 border-primary/20 rounded-lg p-5 aspect-square flex flex-col">
                  <div className="absolute top-3 right-3 z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const prompt = getCurrentPagePrompt(messages, currentQAPage);
                        if (prompt) {
                          navigator.clipboard.writeText(prompt);
                          toast.success(`Page ${currentQAPage} prompt copied!`, {
                            description: 'Paste this in MidJourney, DALL-E, or your AI tool'
                          });
                        }
                      }}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Prompt
                    </Button>
                  </div>
                  
                  <div className="pr-24 space-y-2 flex-shrink-0">
                    <p className="text-xs font-medium text-primary uppercase tracking-wider">
                      Page {currentQAPage} Prompt
                    </p>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto flex-1 pr-2">
                    {getCurrentPagePrompt(messages, currentQAPage)}
                  </div>
                </div>

                {/* Image Upload Area */}
                <div className="space-y-2">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-primary/30 bg-muted/30">
                    {displayImages[currentQAPage] ? (
                      <div className="relative w-full h-full group">
                        <img 
                          src={displayImages[currentQAPage]} 
                          alt={`Page ${currentQAPage} preview`}
                          className="w-full h-full object-contain rounded-lg"
                        />
                        {/* Only show replace button for pre-book-creation images */}
                        {!isBookCreated && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={async () => {
                              const updatedImages = { ...qaPageImages };
                              delete updatedImages[currentQAPage];
                              setQAPageImages(updatedImages);
                              
                              if (currentSessionId) {
                                try {
                                  await updateQAPageImages({ sessionId: currentSessionId, qaPageImages: updatedImages });
                                } catch (error) {
                                  console.error('Failed to remove QA image:', error);
                                }
                              }
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Replace Image
                          </Button>
                        )}
                        <div className="absolute bottom-2 left-2 right-2">
                          <div className="flex items-center gap-2 text-sm bg-green-600/90 text-white px-3 py-1.5 rounded-md">
                            <Check className="h-4 w-4" />
                            <span>{isBookCreated ? 'From your book' : 'Image uploaded'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Only allow upload if book not created yet
                      !isBookCreated && (
                        <ImageUpload 
                          onImageSelect={(file) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              handleQAImageUpload(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }}
                          disabled={createBookMutation.isPending}
                          className="h-full"
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowQACheckpoint(false);
                    toast.info('Continue chatting to refine prompts');
                  }}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Adjust Feedback
                </Button>
                
                <div className="flex gap-2 flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQAPageNavigation('prev')}
                    disabled={currentQAPage === 1}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleQAPageNavigation('next')}
                    disabled={currentQAPage === pageCount}
                    className="flex-1"
                  >
                    {currentQAPage === pageCount ? 'Review' : `Page ${currentQAPage + 1}`}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Create Book Button */}
              {Object.keys(qaPageImages).length > 0 && !isBookCreated && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={handleCreateBook}
                    disabled={createBookMutation.isPending || isBookCreated}
                    className="w-full gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    {isBookCreated 
                      ? 'Book Already Created' 
                      : `Create Book with ${Object.keys(qaPageImages).length} Image${Object.keys(qaPageImages).length > 1 ? 's' : ''}`
                    }
                  </Button>
                </div>
              )}

              {/* View Created Book Button */}
              {isBookCreated && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => navigate(`/books/${createdBookId}`)}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    View Created Book
                  </Button>
                </div>
              )}

              {/* Help Text */}
              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                💡 Tip: Upload images for each page, then click "Create Book" when ready. Continue in chat - no redirect!
              </div>
            </div>
          </div>
        )}

        {/* Image Upload Area */}
        {showImageUpload && (
          <div className="border-t px-4 py-3 bg-muted/30">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Upload inspiration image</p>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowImageUpload(false)}
                >
                  Cancel
                </Button>
              </div>
              <ImageUpload 
                onImageSelect={handleImageSelect}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Input Area - Fixed Footer */}
        <div className="border-t bg-background px-4 py-4 shrink-0">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={showImageUpload ? "Optional: Add a message with your image..." : "Type your message..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => setShowImageUpload(!showImageUpload)} 
              variant="outline"
              size="icon"
              disabled={isLoading}
              title="Upload inspiration image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          </div>
        </div>
      </div>

    </PageLayout>
  );
}
