import { useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SuggestedAction {
  id: string;
  label: string;
  value: string;
}

export interface AgentCreatorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestedActions?: SuggestedAction[];
}

export interface GeneratedAgentConfig {
  bookTypeId: string;
  bookTypeLabel: string;
  bookTypeDescription: string;
  bookTypeColor: string;
  iconName: string;
  agentType: string;
  targetAgeRange: string;
  pageTitleFormat: string;
  pageTitleExamples: string[];
  discoveryQuestions: Array<{
    questionKey: string;
    questionText: string;
    options: Array<{ id: string; label: string }>;
  }>;
  validationRules: string[];
  educationalBadges: {
    ageRange: string;
    learningType: string;
    skillFocus: string;
  };
}

export const useAgentCreatorChat = () => {
  const { session } = useAuthContext();
  const [messages, setMessages] = useState<AgentCreatorMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<GeneratedAgentConfig | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!session?.access_token) {
      toast.error('Please sign in to continue');
      return;
    }

    // Add user message
    const userMessage: AgentCreatorMessage = { role: 'user', content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-creator`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Request failed');
      }

      if (!response.body) {
        throw new Error('No response stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      // Add empty assistant message
      let assistantMessage: AgentCreatorMessage = { role: 'assistant', content: '' };
      setMessages([...updatedMessages, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (let line of lines) {
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              // Strip suggest tags during streaming
              const displayContent = fullContent.replace(/\[SUGGEST\][\s\S]*?(\[\/SUGGEST\])?$/g, '').trim();
              setMessages([...updatedMessages, { role: 'assistant', content: displayContent }]);
            }
          } catch (e) {
            // Incomplete JSON, wait for more data
          }
        }
      }

      // Parse suggestions and config from final content
      const { cleanContent, suggestedActions, config } = parseResponse(fullContent);
      
      if (config) {
        setGeneratedConfig(config);
      }

      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: cleanContent, suggestedActions }
      ]);

    } catch (error) {
      console.error('Agent creator chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      setMessages(updatedMessages); // Revert to before assistant message
    } finally {
      setIsLoading(false);
    }
  }, [messages, session]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setGeneratedConfig(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    generatedConfig,
    resetChat
  };
};

function parseResponse(text: string): {
  cleanContent: string;
  suggestedActions?: SuggestedAction[];
  config?: GeneratedAgentConfig;
} {
  // Strip internal tags
  let cleanedText = text
    .replace(/\[CLARIFICATION_NEEDED:.*?\]/g, '')
    .replace(/\[INTAKE_COMPLETE\]/g, '')
    .trim();

  // Parse [SUGGEST] blocks
  const suggestRegex = /\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/;
  const suggestMatch = cleanedText.match(suggestRegex);
  let suggestedActions: SuggestedAction[] | undefined;

  if (suggestMatch) {
    const suggestionsText = suggestMatch[1].trim();
    cleanedText = cleanedText.replace(suggestRegex, '').trim();

    const actions = suggestionsText
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return null;
        const id = line.substring(0, colonIndex).trim();
        const label = line.substring(colonIndex + 1).trim();
        return { id, label, value: label };
      })
      .filter((action): action is SuggestedAction => action !== null);

    if (actions.length > 0) {
      suggestedActions = actions;
    }
  }

  // Parse [CONFIG] blocks for generated config
  const configRegex = /\[CONFIG\]([\s\S]*?)\[\/CONFIG\]/;
  const configMatch = cleanedText.match(configRegex);
  let config: GeneratedAgentConfig | undefined;

  if (configMatch) {
    try {
      config = JSON.parse(configMatch[1].trim());
      cleanedText = cleanedText.replace(configRegex, '').trim();
    } catch (e) {
      console.error('Failed to parse config:', e);
    }
  }

  return { cleanContent: cleanedText, suggestedActions, config };
}
