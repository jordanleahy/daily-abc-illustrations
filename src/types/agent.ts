export interface AgentConfig {
  id: string;
  name: string;
  type: 'chat' | 'assistant' | 'book-creation';
  intent: string;
  status: 'online' | 'offline' | 'processing';
  version: string;
  createdAt: Date;
  lastModified: Date;
  assistantId?: string;
  instructions: string;
  whatChanged?: string;
  lastChangeDescription?: string;
  versionNumber?: number;
  isLatest?: boolean;
  parentAgentId?: string;
  modelSettings: {
    model: string;
    maxCompletionTokens: number;
    topP: number;
  };
}

export const AVAILABLE_MODELS = [
  { value: 'gpt-5-2025-08-07', label: 'GPT-5' },
  { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  id: 'abc-cards-001',
  name: 'ABC Cards',
  type: 'chat',
  intent: 'Assists users with ABC Cards related questions and tasks',
  status: 'online',
  version: 'v1.0.0',
  createdAt: new Date('2024-01-15'),
  lastModified: new Date(),
  assistantId: undefined,
  instructions: 'You are ABC Cards, a helpful AI assistant focused on providing accurate and helpful responses about ABC Cards products and services. Be friendly, professional, and always aim to be helpful.',
  modelSettings: {
    model: 'gpt-4o',
    maxCompletionTokens: 1000,
    topP: 1.0,
  },
};

export const BOOK_CREATION_AGENT_CONFIG: AgentConfig = {
  id: 'book-creation-001',
  name: 'Book Creation Agent',
  type: 'book-creation',
  intent: 'Specializes in converting educational conversations into structured ABC books for children',
  status: 'online',
  version: 'v1.0.0',
  createdAt: new Date('2024-01-15'),
  lastModified: new Date(),
  assistantId: undefined,
  instructions: 'You are a specialized Book Creation Agent that converts educational conversations into structured ABC books for children. You analyze conversation history to extract the main educational theme and create themed ABC books with exactly 26 pages (A-Z). Each page should be age-appropriate, educational, and consistent with the conversation theme.',
  modelSettings: {
    model: 'gpt-5-mini-2025-08-07',
    maxCompletionTokens: 4000,
    topP: 1.0,
  },
};

export const AGENT_TYPE_CONFIGS = {
  'chat': DEFAULT_AGENT_CONFIG,
  'assistant': DEFAULT_AGENT_CONFIG,
  'book-creation': BOOK_CREATION_AGENT_CONFIG,
} as const;