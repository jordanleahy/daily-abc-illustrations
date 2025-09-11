export interface AgentConfig {
  id: string;
  name: string;
  type: 'chat' | 'assistant';
  intent: string;
  status: 'online' | 'offline' | 'processing';
  version: string;
  createdAt: Date;
  lastModified: Date;
  assistantId?: string;
  instructions: string;
  modelSettings: {
    model: string;
    maxCompletionTokens: number;
    topP: number;
  };
}

export const AVAILABLE_MODELS = [
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