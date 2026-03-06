'use client';

import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto sa-chat-scroll bg-transparent">
      <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-5">
      {messages.map((msg, idx) => (
        <MessageBubble key={msg._id || idx} message={msg} />
      ))}

      {isTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
