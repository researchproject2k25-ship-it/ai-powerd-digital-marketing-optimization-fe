'use client';

import React from 'react';
import type { ChatSessionSummary } from '../types';

interface RecentChatItemProps {
  session: ChatSessionSummary;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  strategy:     'bg-violet-500/15 text-violet-400',
  social:       'bg-pink-500/15 text-pink-400',
  content:      'bg-amber-500/15 text-amber-400',
  analytics:    'bg-sky-500/15 text-sky-400',
  campaign:     'bg-emerald-500/15 text-emerald-400',
  optimization: 'bg-orange-500/15 text-orange-400',
};

function tagColor(tag?: string) {
  if (!tag) return 'bg-[#1F2937] text-[#6B7280]';
  const key = Object.keys(TAG_COLORS).find((k) => tag.toLowerCase().includes(k));
  return key ? TAG_COLORS[key] : 'bg-[#1F2937] text-[#6B7280]';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function RecentChatItem({ session, isActive, onSelect, onDelete }: RecentChatItemProps) {
  return (
    <div
      className={`sa-root sa-ci-root group relative flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl w-full min-w-0 overflow-hidden cursor-pointer ${
        isActive ? 'sa-ci-root-active' : ''
      }`}
    >
      {/* Click target */}
      <button
        type="button"
        aria-label={`Load conversation: ${session.title || 'Untitled'}`}
        onClick={() => onSelect(session._id)}
        className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]/40"
      />

      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center ${
        isActive ? 'sa-ci-icon-active' : 'sa-ci-icon'
      }`}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#22C55E' : '#3a4a62'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-1 min-w-0 overflow-hidden">
          <span className={`sa-heading text-[12px] leading-snug truncate min-w-0 overflow-hidden ${
            isActive ? 'sa-ci-title-active' : 'sa-ci-title'
          }`}>
            {session.title || 'Untitled conversation'}
          </span>
          <span className="sa-subtext sa-ci-time text-[9.5px] flex-shrink-0 ml-1 whitespace-nowrap">
            {timeAgo(session.updatedAt || session.createdAt)}
          </span>
        </div>

        {session.summary && (
          <p className="sa-subtext sa-ci-summary text-[10.5px] truncate mt-0.5">
            {session.summary}
          </p>
        )}

        {session.topicTag && (
          <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tagColor(session.topicTag)}`}>
            {session.topicTag}
          </span>
        )}
      </div>

      {/* Delete — always visible X */}
      <button
        type="button"
        aria-label="Delete conversation"
        onClick={(e) => { e.stopPropagation(); onDelete(session._id); }}
        className="sa-ci-delete relative z-10 flex-shrink-0 mt-0.5 w-5 h-5 rounded-md flex items-center justify-center focus:outline-none"
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
