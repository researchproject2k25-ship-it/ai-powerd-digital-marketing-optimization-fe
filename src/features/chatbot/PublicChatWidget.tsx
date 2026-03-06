'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './chatbot.css';
import { API_BASE_URL } from '@/config/api';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  knowledgeSource?: 'store' | 'general' | null;
  timestamp: Date;
}

interface Props {
  tenantId: string;
  storeName?: string;
}

// Quick-reply suggestion chips shown on the empty state
const SUGGESTIONS = [
  'What can you help with?',
  'What are your hours?',
  'Tell me about your products',
];

// Minimal markdown: bold + inline code only (no code blocks for widget)
function renderContent(text: string): React.ReactNode {
  return text.split('\n').map((line, li, arr) => (
    <React.Fragment key={li}>
      {line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((seg, si) => {
        if (seg.startsWith('`') && seg.endsWith('`'))
          return <code key={si} className="cw-inline-code">{seg.slice(1, -1)}</code>;
        if (seg.startsWith('**') && seg.endsWith('**'))
          return <strong key={si} className="font-semibold text-white">{seg.slice(2, -2)}</strong>;
        return <span key={si}>{seg}</span>;
      })}
      {li < arr.length - 1 && <br />}
    </React.Fragment>
  ));
}

export default function PublicChatWidget({ tenantId, storeName = 'Smart Assistant' }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input,    setInput]    = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const contextRef = useRef<{ role: string; content: string }[]>([]);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed, timestamp: new Date() }]);
    contextRef.current = [...contextRef.current, { role: 'user', content: trimmed }].slice(-10);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context: contextRef.current.slice(0, -1), tenantId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || `Error ${res.status}`);
      }
      const data = await res.json();
      const assistantMsg: Msg = {
        role: 'assistant',
        content: data.response,
        knowledgeSource: data.knowledgeSource,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      contextRef.current = [...contextRef.current, { role: 'assistant', content: data.response }].slice(-10);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      setError(msg);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isTyping, tenantId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); send(input); }
  };

  // Initials for the bot avatar in header
  const initials = storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="cw-root">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="cw-header">
        <div className="cw-avatar">
          <span className="cw-avatar-initials">{initials}</span>
          <span className="cw-online-dot" />
        </div>
        <div className="cw-header-text">
          <span className="cw-store-name">{storeName}</span>
          <span className="cw-status">
            {isTyping ? (
              <><span className="cw-status-dot cw-status-typing" />Typing…</>
            ) : (
              <><span className="cw-status-dot" />Online</>  
            )}
          </span>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div className="cw-body">

        {/* Welcome state */}
        {messages.length === 0 && !isTyping && (
          <div className="cw-welcome">
            <div className="cw-welcome-avatar">{initials}</div>
            <p className="cw-welcome-title">Hi there! 👋</p>
            <p className="cw-welcome-sub">Ask me anything about <strong>{storeName}</strong>. I'm here to help.</p>
            <div className="cw-chips">
              {SUGGESTIONS.map(s => (
                <button key={s} className="cw-chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          // Only show bot avatar on first message of a consecutive bot group
          const showAvatar = !isUser && (i === 0 || messages[i - 1].role === 'user');
          return (
            <div key={i} className={`cw-msg-row ${isUser ? 'cw-msg-row--user' : 'cw-msg-row--bot'} cw-msg-enter`}>
              {/* Bot avatar spacer */}
              {!isUser && (
                <div className="cw-bot-avatar-col">
                  {showAvatar && <div className="cw-bot-avatar">{initials}</div>}
                </div>
              )}

              <div className="cw-msg-col">
                {/* Sender label on first of a group */}
                {showAvatar && <span className="cw-sender-label">{storeName}</span>}

                <div className={`cw-bubble ${isUser ? 'cw-bubble--user' : 'cw-bubble--bot'}`}>
                  {renderContent(m.content)}
                </div>

                <div className={`cw-meta ${isUser ? 'cw-meta--user' : ''}`}>
                  <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!isUser && m.knowledgeSource === 'store' && (
                    <span className="cw-kb-badge">✦ store</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="cw-msg-row cw-msg-row--bot">
            <div className="cw-bot-avatar-col">
              <div className="cw-bot-avatar">{initials}</div>
            </div>
            <div className="cw-bubble cw-bubble--bot cw-typing-bubble">
              <span className="sa-typing-dot" />
              <span className="sa-typing-dot" />
              <span className="sa-typing-dot" />
            </div>
          </div>
        )}

        {error && (
          <div className="cw-error-banner">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ────────────────────────────────────────────── */}
      <div className="cw-footer">
        <div className="cw-input-row">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            disabled={isTyping}
            className="cw-input"
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isTyping}
            aria-label="Send"
            className="cw-send-btn"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/>
            </svg>
          </button>
        </div>
        <p className="cw-poweredby">Powered by <strong>SmartAssist</strong></p>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Msg {
  role: 'user' | 'assistant';
  content: string;
  knowledgeSource?: 'store' | 'general' | null;
  timestamp: Date;
}

interface Props {
  tenantId: string;
  storeName?: string;
}


