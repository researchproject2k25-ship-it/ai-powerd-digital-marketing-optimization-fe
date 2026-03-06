'use client';

import React, { useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    autoResize();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="sa-root flex-shrink-0 w-full bg-transparent px-4 md:px-6 py-4 border-t border-gray-800">
      {/* Input container — MSR form input style */}
      <div className="flex items-end gap-3 bg-[#1F2933] border border-[#1F2933] rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#22C55E] focus-within:border-transparent transition-all">
          {/* Attachment icon */}
          <button
            type="button"
            aria-label="Attach file"
            className="flex-shrink-0 mb-0.5 text-gray-500 hover:text-[#CBD5E1] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/40 rounded"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Message Smart Assistant…"
            aria-label="Message input"
            className="sa-input flex-1 bg-transparent resize-none text-sm text-[#F9FAFB] placeholder-[#CBD5E1]/50 leading-relaxed max-h-40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send button — MSR primary button style */}
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className={`sa-send-btn flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/40
              ${ canSend
                ? 'bg-[#22C55E] text-[#0B0F14] hover:bg-[#16A34A]'
                : 'bg-gray-800 text-gray-600'
              }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
      </div>

      <p className="text-center text-[10.5px] text-gray-500 mt-2">
        Press <kbd className="bg-black/30 border border-gray-800 rounded px-1.5 py-0.5 text-[10px] text-gray-500">Enter</kbd> to send ·{' '}
        <kbd className="bg-black/30 border border-gray-800 rounded px-1.5 py-0.5 text-[10px] text-gray-500">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
