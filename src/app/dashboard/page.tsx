'use client';

import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Aurora from '@/components/Aurora';
import { useRouter } from 'next/navigation';

export default function DashboardHome() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#0B0F14] overflow-hidden">
      {/* Aurora Background */}
      <div className="absolute inset-0 opacity-30">
        <Aurora
          colorStops={["#22C55E", "#1F2933", "#0B0F14"]}
          blend={0.5}
          amplitude={1.0}
          speed={0.3}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          
          {/* Main Heading */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#1F2933] bg-[#0B0F14]/50 backdrop-blur-sm">
              <SparklesIcon className="h-4 w-4 text-[#22C55E]" />
              <span className="text-sm text-[#CBD5E1]">AI-Powered Marketing Platform</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-semibold text-[#F9FAFB] tracking-tight leading-tight">
              Transform Your
              <br />
              <span className="text-[#CBD5E1]">Digital Marketing</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#CBD5E1] max-w-2xl mx-auto leading-relaxed">
              Your all-in-one marketing toolkit — strategy, content, analytics, and insights, all powered by AI
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="group px-8 py-4 bg-[#22C55E] text-[#0B0F14] rounded-xl font-medium hover:bg-[#16A34A] transition-all flex items-center gap-2"
            >
              Create My Strategy
              <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => router.push('/dashboard/strategy')}
              className="px-8 py-4 bg-[#0B0F14] text-[#F9FAFB] rounded-xl font-medium border border-[#1F2933] hover:border-[#CBD5E1]/20 transition-all backdrop-blur-sm"
            >
              View My Strategy
            </button>
          </div>

          {/* Features */}
          <div className="pt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Strategy Generation */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#0B0F14] border border-[#1F2933] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <span className="text-xs text-[#CBD5E1]">Smart Strategy</span>
            </div>
            
            {/* Content Generation */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#0B0F14] border border-[#1F2933] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-xs text-[#CBD5E1]">Content Creation</span>
            </div>
            
            {/* Campaign Performance Prediction */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#0B0F14] border border-[#1F2933] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs text-[#CBD5E1]">Track Results</span>
            </div>

            {/* Chatbot */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#0B0F14] border border-[#1F2933] flex items-center justify-center">
                <svg className="w-7 h-7 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="text-xs text-[#CBD5E1]">AI Assistant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0F14] to-transparent pointer-events-none" />
    </div>
  );
}

