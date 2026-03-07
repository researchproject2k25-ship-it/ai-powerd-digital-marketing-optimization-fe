'use client';

import type { ChatSessionSummary } from '../types';

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Props {
  session: ChatSessionSummary;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RecentChatItem({ session, onSelect, onDelete }: Props) {
  return (
    <div className="sa-recent-item" tabIndex={0} onClick={() => onSelect(session._id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(session._id); }}>
      <div className="sa-recent-item-top">
        <span className="sa-recent-item-title">{session.title || 'Untitled chat'}</span>
        <span className="sa-recent-item-time">{timeAgo(session.createdAt)}</span>
      </div>
      {session.summary && <p className="sa-recent-item-summary">{session.summary}</p>}
      <div className="sa-recent-item-bottom">
        {session.topicTag && (
          <span className="sa-topic-tag" data-topic={session.topicTag || 'other'}>
            {session.topicTag}
          </span>
        )}
        <button
          className="sa-delete-btn"
          title="Delete session"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session._id);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}
