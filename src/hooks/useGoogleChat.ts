import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface SuggestedAction {
  id: string;
  label: string;
  value: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  suggestedActions?: SuggestedAction[];
}

export const useGoogleChat = () => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string | MessageContent[], displayText?: string) => {
    if (!user?.id) {
      toast.error('Please sign in to use Google chat');
      return;
    }

    // Clear suggestions from last assistant message when user sends any message
    setMessages(prev => prev.map((msg, idx) => 
      idx === prev.length - 1 && msg.role === 'assistant' 
        ? { ...msg, suggestedActions: undefined } 
        : msg
    ));

    // Add user message
    const userMessage: Message = { role: 'user', content };
    // For display purposes with images, we store the text separately
    const displayMessage: Message = { 
      role: 'user', 
      content: displayText || (typeof content === 'string' ? content : 'Uploaded an image')
    };
    setMessages(prev => [...prev, displayMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('google-chat', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) {
        // Check for specific error types
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (error.message?.includes('402') || error.message?.includes('Payment required')) {
          toast.error('AI credits required. Please add credits to continue.');
        } else {
          toast.error(error.message || 'Failed to send message');
        }
        throw error;
      }

      // Check for error in data response
      if (data?.error) {
        if (data.error.includes('Rate limit') || data.error.includes('429')) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
        } else if (data.error.includes('Payment required') || data.error.includes('402')) {
          toast.error('AI credits required. Please add credits to continue.');
        } else {
          toast.error(data.error);
        }
        throw new Error(data.error);
      }

      if (data?.content) {
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: data.content,
          suggestedActions: data.suggestedActions
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response from AI assistant');
      }
    } catch (error) {
      console.error('Google chat error:', error);
      // Remove the user message on error (the display message)
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageWithImage = async (text: string, imageDataUrl: string) => {
    const content: MessageContent[] = [
      { type: 'text', text },
      { type: 'image_url', image_url: { url: imageDataUrl } }
    ];
    await sendMessage(content, text);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    sendMessageWithImage,
    clearMessages
  };
};
