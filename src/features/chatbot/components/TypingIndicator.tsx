'use client';

import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="sa-root flex items-end gap-3 mb-5 sa-message-enter">
      {/* AI avatar — matches MessageBubble AI side */}
      <div className="w-8 h-8 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center flex-shrink-0 self-end">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <path d="M5 14v2a7 7 0 0 0 14 0v-2"/>
        </svg>
      </div>

      {/* Typing bubble */}
      <div className="flex flex-col gap-1.5 items-start">
        <span className="text-[10.5px] font-medium px-1 text-[#22C55E]">
          Smart Assistant
        </span>
        <div className="bg-black/30 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="flex items-center gap-1.5 h-4">
            <span className="sa-typing-dot" />
            <span className="sa-typing-dot" />
            <span className="sa-typing-dot" />
          </div>
        </div>
      </div>
    </div>
  );
}
