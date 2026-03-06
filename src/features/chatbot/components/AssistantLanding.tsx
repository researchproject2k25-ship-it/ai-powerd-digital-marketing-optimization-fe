'use client';

import React, { useState, useEffect } from 'react';
import './AssistantLanding.css';
import Aurora from '@/components/Aurora';

interface AssistantLandingProps {
  onStart: () => void;
}

const CAPABILITIES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Store Knowledge Base',
    desc: 'Answers questions directly from your uploaded business documents — product info, policies, pricing and more.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Persistent Memory',
    desc: 'Remembers context across sessions — no need to repeat yourself. Every conversation builds on the last.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    title: 'Instant Responses',
    desc: 'Powered by a local AI engine with cloud fallback — fast answers even in low-connectivity environments.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Multi-tenant Isolation',
    desc: 'Your data is cryptographically scoped to your store. No other business can ever access your knowledge base.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Full Chat History',
    desc: 'Every conversation is saved and searchable. Resume any previous session right where you left off.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Knowledge Gap Detection',
    desc: "Automatically flags questions it couldn't answer from your docs — so you always know what to upload next.",
  },
];

const PRIVACY_POINTS = [
  { label: 'End-to-end tenant isolation', sub: 'Unique namespace per store — zero cross-tenant leakage' },
  { label: 'No data sent to third parties', sub: 'Primary LLM runs fully offline on local hardware' },
  { label: 'JWT-protected endpoints', sub: 'Every request is authenticated and role-verified' },
  { label: 'You own your data', sub: 'Delete any document or conversation at any time' },
];

export default function AssistantLanding({ onStart }: AssistantLandingProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const vis = visible ? 'sai-visible' : '';

  return (
    <div className="sai-root">
      {/* ── Aurora background (matches strategy pages) ────────────────── */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <Aurora
          colorStops={["#22C55E", "#1F2933", "#0B0F14"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.3}
        />
      </div>

      <div className="sai-content">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className={`sai-hero ${vis}`}>
          {/* MSR icon circle */}
          <div className="w-16 h-16 rounded-full bg-[#0B0F14] border border-[#1F2933] flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>

          {/* Badge — MSR pill style */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1F2933] bg-[#0B0F14]/50 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] inline-block" />
            <span className="text-sm text-[#CBD5E1]">AI-Powered · Offline-First · Secure</span>
          </div>

          {/* Headline */}
          <h1 className="sai-headline">Smart Assistant</h1>

          <p className="text-lg text-[#CBD5E1] max-w-2xl text-center leading-relaxed">
            Your store&#39;s dedicated AI — trained on your own documents, aware of your business context,
            and available 24/7. Ask anything, get answers grounded in your actual knowledge base.
          </p>

          {/* CTA — MSR primary button style */}
          <button onClick={onStart} className="group px-8 py-4 bg-[#22C55E] text-[#0B0F14] rounded-xl font-medium hover:bg-[#16A34A] transition-all flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Start a Conversation
            <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </section>

        {/* ── CAPABILITIES GRID ─────────────────────────────────────────────── */}
        <section className={`sai-section sai-d1 ${vis}`}>
          <div className="sai-section-header">
            <h2 className="sai-section-title">What it can do</h2>
            <p className="sai-section-sub">Built for real business workflows, not generic chatbots</p>
          </div>

          <div className="sai-caps-grid">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className="sai-cap-card">
                <div className="sai-cap-icon">{cap.icon}</div>
                <div className="min-w-0">
                  <p className="sai-cap-title">{cap.title}</p>
                  <p className="sai-cap-desc">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
        <section className={`sai-section sai-d2 ${vis}`}>
          <div className="sai-section-header">
            <h2 className="sai-section-title">How it works</h2>
          </div>

          <div className="sai-how-steps">
            <div className="sai-how-connector" />
            {[
              { step: '01', label: 'Ask anything',    desc: 'Type your question in natural language.' },
              { step: '02', label: 'AI searches',     desc: 'Retrieves relevant chunks from your documents.' },
              { step: '03', label: 'Grounded answer', desc: 'Responds with source-cited, accurate information.' },
            ].map((item) => (
              <div key={item.step} className="sai-how-step">
                <div className="sai-step-num">{item.step}</div>
                <p className="sai-step-label">{item.label}</p>
                <p className="sai-step-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRIVACY & SECURITY ────────────────────────────────────────────── */}
        <section className={`sai-section sai-d3 ${vis}`}>
          <div className="sai-privacy-card">
            <div className="sai-privacy-header">
              <div className="sai-privacy-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h2 className="sai-privacy-title">Privacy &amp; Security</h2>
                <p className="sai-privacy-subtitle">Built with enterprise-grade isolation from day one</p>
              </div>
            </div>

            <div className="sai-privacy-grid">
              {PRIVACY_POINTS.map((pt) => (
                <div key={pt.label} className="sai-privacy-row">
                  <svg
                    className="sai-check-icon"
                    width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <div>
                    <p className="sai-pt-label">{pt.label}</p>
                    <p className="sai-pt-sub">{pt.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ────────────────────────────────────────────────────── */}
        <section className={`sai-footer-section ${vis}`}>
          <p className="sai-footer-text">Ready to get started?</p>
          <button onClick={onStart} className="sai-cta-secondary">
            Open Smart Assistant
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </section>

      </div>
    </div>
  );
}
