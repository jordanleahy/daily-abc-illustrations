import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const useGoogleChat = () => {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!user?.id) {
      toast.error('Please sign in to use Google chat');
      return;
    }

    // Add user message
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
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
        const assistantMessage: Message = { role: 'assistant', content: data.content };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No response from AI assistant');
      }
    } catch (error) {
      console.error('Google chat error:', error);
      // Remove the user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
};
