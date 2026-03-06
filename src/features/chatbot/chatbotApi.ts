import { API_BASE_URL, buildHeaders } from '@/config/api';
import type {
  SendMessageResponse,
  ChatSession,
  ChatSessionSummary,
  MemoryFact,
} from './types';

// ─── Helper ───────────────────────────────────────────────────────────────────
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return buildHeaders(token ?? undefined);
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

/** Send a message via the authenticated admin chat endpoint. */
export async function sendMessage(
  message: string,
  context: { role: string; content: string }[] = [],
  sessionId?: string | null
): Promise<SendMessageResponse> {
  const res = await fetch(`${API_BASE_URL}/api/admin/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      message,
      context,
      ...(sessionId ? { sessionId } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/** List all sessions for the current user (no messages). */
export async function listSessions(): Promise<ChatSessionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/sessions`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to load sessions: HTTP ${res.status}`);

  const data = await res.json();
  return data.sessions ?? [];
}

/** Create a new session. */
export async function createSession(): Promise<ChatSession> {
  const res = await fetch(`${API_BASE_URL}/api/admin/sessions`, {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.session;
}

/** Load a single session with full message history. */
export async function getSession(sessionId: string): Promise<ChatSession> {
  const res = await fetch(`${API_BASE_URL}/api/admin/sessions/${sessionId}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`Session not found: HTTP ${res.status}`);

  const data = await res.json();
  return data.session;
}

/** Delete a session. */
export async function deleteSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to delete session: HTTP ${res.status}`);
}

/** End a session (triggers insights + memory extraction in background). */
export async function endSession(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/sessions/${sessionId}/end`, {
    method: 'PATCH',
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to end session: HTTP ${res.status}`);
}

// ─── Memory ───────────────────────────────────────────────────────────────────

/** Retrieve persistent cross-session memory facts. */
export async function getMemory(): Promise<MemoryFact[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/memory`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to load memory: HTTP ${res.status}`);

  const data = await res.json();
  return data.facts ?? [];
}

/** Delete a single memory fact. */
export async function deleteMemoryFact(factId: string): Promise<MemoryFact[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/memory/${factId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error(`Failed to delete memory fact: HTTP ${res.status}`);

  const data = await res.json();
  return data.facts ?? [];
}
