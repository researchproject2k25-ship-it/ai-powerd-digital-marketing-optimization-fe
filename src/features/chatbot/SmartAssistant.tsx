'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './chatbot.css';
import Aurora from '@/components/Aurora';

import type { ChatMessage, ChatSessionSummary } from './types';
import * as api from './chatbotApi';

import ChatHeader      from './components/ChatHeader';
import SuggestionCards from './components/SuggestionCards';
import MessageList     from './components/MessageList';
import ChatInput       from './components/ChatInput';
import RecentChatsPanel from './components/RecentChatsPanel';
import AssistantLanding from './components/AssistantLanding';

export default function SmartAssistant() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [showLanding, setShowLanding]     = useState(true);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId]         = useState<string | null>(null);
  const [isTyping, setIsTyping]           = useState(false);
  const [recentOpen, setRecentOpen]       = useState(false);
  const [sessions, setSessions]           = useState<ChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // Keep a ref to the current context for the RAG endpoint
  const contextRef = useRef<{ role: string; content: string }[]>([]);

  // ── sessionId ref — always holds the current value, no stale-closure risk ──
  // Every place that calls setSessionId must also update this ref.
  const sessionIdRef = useRef<string | null>(null);
  const updateSessionId = useCallback((id: string | null) => {
    sessionIdRef.current = id;
    setSessionId(id);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Build context array from current message list (last 10 turns). */
  function buildContext(msgs: ChatMessage[]) {
    return msgs
      .slice(-10)
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as string, content: m.content }));
  }

  /** Load session list for the recent-chats panel. */
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const list = await api.listSessions();
      setSessions(list);
    } catch {
      // sessions panel is non-critical
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  /** Start a fresh chat (create a new backend session). */
  const startNewChat = useCallback(async () => {
    // End the current session if any
    if (sessionIdRef.current) {
      api.endSession(sessionIdRef.current).catch(() => {});
    }
    setMessages([]);
    updateSessionId(null);
    contextRef.current = [];
    setError(null);

    try {
      const newSession = await api.createSession();
      updateSessionId(newSession._id);
    } catch {
      // session creation is non-critical — chat works without a session id
    }
  }, [updateSessionId]);

  /** Load an existing session by id. */
  const loadSession = useCallback(async (id: string) => {
    try {
      const session = await api.getSession(id);
      const msgs: ChatMessage[] = session.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp ?? session.createdAt,
      }));
      setMessages(msgs);
      updateSessionId(session._id);
      contextRef.current = buildContext(msgs);
      setError(null);
    } catch {
      setError('Failed to load conversation.');
    }
  }, [updateSessionId]);

  /** Send a message and stream the response. */
  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);

      // Always read the CURRENT sessionId from the ref — never from a stale closure.
      const currentSessionId = sessionIdRef.current;

      const userMsg: ChatMessage = {
        _id:       `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role:      'user',
        content:   text,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const next = [...prev, userMsg];
        contextRef.current = buildContext(next);
        return next;
      });

      setIsTyping(true);

      try {
        const result = await api.sendMessage(text, contextRef.current.slice(0, -1), currentSessionId);

        const assistantMsg: ChatMessage = {
          _id:             `asst-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role:            'assistant',
          content:         result.response,
          knowledgeSource: result.knowledgeSource,
          timestamp:       result.timestamp ?? new Date(),
        };

        setMessages((prev) => {
          const next = [...prev, assistantMsg];
          contextRef.current = buildContext(next);
          return next;
        });

        // Sync if backend created/returned a different session than what we sent
        if (result.sessionId && result.sessionId !== sessionIdRef.current) {
          updateSessionId(result.sessionId);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        setError(message);

        // Show error inline as assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ ${message}\n\nPlease try again in a moment.`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [updateSessionId]  // stable — never goes stale because we read from sessionIdRef
  );

  /** Delete a session from the list. */
  const handleDeleteSession = useCallback(async (id: string) => {
    try {
      await api.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (id === sessionIdRef.current) {
        setMessages([]);
        updateSessionId(null);
        contextRef.current = [];
      }
    } catch {
      // silent
    }
  }, [updateSessionId]);

  // ── Effects ────────────────────────────────────────────────────────────────

  // Create initial session on mount (only if authenticated)
  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;
    if (!token) return;
    (async () => {
      try {
        const newSession = await api.createSession();
        updateSessionId(newSession._id);
      } catch {
        // session creation is optional
      }
    })();
  }, [updateSessionId]);

  // Load sessions when panel opens
  useEffect(() => {
    if (recentOpen) loadSessions();
  }, [recentOpen, loadSessions]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasMessages = messages.length > 0;

  // Show landing page until user clicks "Start"
  if (showLanding) {
    return <AssistantLanding onStart={() => setShowLanding(false)} />;
  }

  return (
    <div className="sa-root relative flex flex-col h-full w-full bg-[#0B0F14] items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6">
      {/* ── Aurora background (matches strategy pages) ─────────────────── */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Aurora
          colorStops={["#22C55E", "#1F2933", "#0B0F14"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.3}
        />
      </div>

      {/* ── Chat card ───────────────────────────────────────────────────── */}
      <div className="sa-strategy-card relative flex flex-col w-full max-w-[860px] flex-1 min-h-0 z-10 overflow-hidden">
        {/* Header */}
        <ChatHeader
          onOpenRecent={() => setRecentOpen(true)}
          isTyping={isTyping}
        />

        {/* Body: either suggestions or message list */}
        {hasMessages ? (
          <MessageList messages={messages} isTyping={isTyping} />
        ) : (
          <SuggestionCards onSelect={handleSend} />
        )}

        {/* Error banner */}
        {error && (
          <div className="flex-shrink-0 w-full px-4 md:px-6 mb-2">
            <div className="w-full px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-[12.5px] flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="sa-subtext">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto text-red-400/50 hover:text-red-400 transition-colors"
                aria-label="Dismiss error"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput onSend={handleSend} disabled={isTyping} />

        {/* ── Recent chats panel (absolute overlay inside card) ─────────── */}
        <RecentChatsPanel
          open={recentOpen}
          sessions={sessions}
          activeSessionId={sessionId}
          loading={sessionsLoading}
          onClose={() => setRecentOpen(false)}
          onNewChat={() => { startNewChat(); setRecentOpen(false); }}
          onSelectSession={loadSession}
          onDeleteSession={handleDeleteSession}
        />
      </div>
    </div>
  );
}
