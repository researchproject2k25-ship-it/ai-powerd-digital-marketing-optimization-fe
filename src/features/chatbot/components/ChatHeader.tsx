'use client';

import React from 'react';

interface ChatHeaderProps {
  onOpenRecent: () => void;
  isTyping: boolean;
}

export default function ChatHeader({ onOpenRecent, isTyping }: ChatHeaderProps) {
  return (
    <div className="sa-root w-full border-b border-gray-800 bg-transparent flex-shrink-0">
      <div className="w-full flex items-center justify-between px-6 py-4">
      {/* Left: icon box + title */}
      <div className="flex items-center gap-3">
        {/* Icon box — MSR pattern */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-[#22C55E]/10 rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              <path d="M5 14v2a7 7 0 0 0 14 0v-2"/>
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-[#111111] sa-online-dot" />
        </div>

        {/* Title — MSR section header pattern */}
        <div>
          <h3 className="text-base font-semibold text-white leading-tight">
            Smart Assistant
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
            {isTyping ? 'Thinking…' : 'Online · AI-Powered'}
          </p>
        </div>
      </div>

      {/* Right: History pill button — MSR badge/pill style */}
      <button
        onClick={onOpenRecent}
        title="Chat history"
        aria-label="Open recent chats"
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B0F14]/50 hover:bg-[#1F2933] border border-[#1F2933] hover:border-[#CBD5E1]/20 text-[#CBD5E1] text-xs font-medium transition-all duration-200 backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/40"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <span>History</span>
      </button>
      </div>
    </div>
  );
}
