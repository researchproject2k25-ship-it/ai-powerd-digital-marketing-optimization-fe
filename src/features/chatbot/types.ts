// ─── Smart Assistant – Shared Types ─────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';
export type KnowledgeSource = 'store' | 'general';

export interface ChatMessage {
  _id?: string;
  role: MessageRole;
  content: string;
  knowledgeSource?: KnowledgeSource;
  timestamp: Date | string;
  isStreaming?: boolean;
}

export interface ChatSession {
  _id: string;
  userId: string;
  tenantId?: string;
  title?: string;
  summary?: string;
  topicTag?: string;
  isEnded: boolean;
  insightsGenerated: boolean;
  memoryExtracted: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionSummary {
  _id: string;
  title?: string;
  summary?: string;
  topicTag?: string;
  isEnded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  response: string;
  model: string;
  usedFallback: boolean;
  knowledgeSource: KnowledgeSource;
  sources: string[];
  sessionId: string | null;
  timestamp: string;
}

export interface MemoryFact {
  _id: string;
  fact: string;
  confidence: number;
  createdAt: string;
}

export type SuggestionCategory =
  | 'Strategy'
  | 'Social Media'
  | 'Content'
  | 'Analytics'
  | 'Campaigns'
  | 'Optimization';

export interface Suggestion {
  id: SuggestionCategory;
  label: string;
  icon: string;
  prompt: string;
  color: string;
}
