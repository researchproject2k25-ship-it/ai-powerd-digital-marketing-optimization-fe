'use client';

import React, { useEffect } from 'react';
import type { ChatSessionSummary } from '../types';
import RecentChatItem from './RecentChatItem';

interface RecentChatsPanelProps {
  open: boolean;
  sessions: ChatSessionSummary[];
  activeSessionId: string | null;
  loading: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function RecentChatsPanel({
  open,
  sessions,
  activeSessionId,
  loading,
  onClose,
  onNewChat,
  onSelectSession,
  onDeleteSession,
}: RecentChatsPanelProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <div
      className={`absolute inset-0 z-30 transition-all duration-200 ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`sa-hist-backdrop absolute inset-0 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* ── Floating glass drawer ─────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-label="Chat history"
        className={`sa-root sa-hist-drawer flex flex-col rounded-[18px] overflow-hidden
          transition-all duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-full opacity-0 scale-[0.96] pointer-events-none'
        }`}
      >
        {/* Top shimmer accent line */}
        <div className="sa-hist-shimmer h-px flex-shrink-0" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="sa-hist-icon w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="sa-heading text-white text-[13.5px]">History</span>
            {sessions.length > 0 && (
              <span className="sa-subtext sa-hist-badge text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums">
                {sessions.length}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close history"
            onClick={onClose}
            className="sa-hist-close w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── New conversation ─────────────────────────────────────────────── */}
        <div className="px-3 pb-3 flex-shrink-0">
          <button
            type="button"
            onClick={onNewChat}
            className="sa-subtext sa-hist-new-btn w-full flex items-center gap-2 px-3.5 py-2.5 rounded-[14px] text-[11.5px] font-medium focus:outline-none"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New conversation
          </button>
        </div>

        {/* ── Separator ───────────────────────────────────────────────────── */}
        <div className="sa-hist-sep mx-3 h-px flex-shrink-0" />

        {/* ── Recent label ────────────────────────────────────────────────── */}
        {sessions.length > 0 && (
          <div className="px-4 pt-3 pb-1 flex-shrink-0">
            <span className="sa-subtext sa-hist-label text-[9.5px] uppercase tracking-widest font-semibold">
              Recent
            </span>
          </div>
        )}

        {/* ── Session list ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto sa-chat-scroll px-2 pb-3">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="sa-hist-spinner w-5 h-5 rounded-full border-2 animate-spin" />
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="relative mb-4">
                <div className="sa-hist-empty-box w-14 h-14 rounded-2xl flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2d3a50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="sa-hist-empty-glow absolute inset-0 rounded-2xl" />
              </div>
              <p className="sa-heading sa-hist-empty-title text-[12.5px] mb-1.5">
                No conversations yet
              </p>
              <p className="sa-subtext sa-hist-empty-body text-[11px] leading-relaxed">
                Start a chat and your history will appear here.
              </p>
            </div>
          )}

          {!loading && sessions.length > 0 && (
            <div className="space-y-px">
              {sessions.map((s) => (
                <RecentChatItem
                  key={s._id}
                  session={s}
                  isActive={s._id === activeSessionId}
                  onSelect={(id) => { onSelectSession(id); onClose(); }}
                  onDelete={onDeleteSession}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
