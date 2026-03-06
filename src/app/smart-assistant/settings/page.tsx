'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { ChatBubbleLeftRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function SmartAssistantManagePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid credentials');
      }

      const data = await res.json();
      localStorage.setItem('assistant_manage_token', data.token ?? '');
      router.push('/smart-assistant/settings/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0B0F14]">
      <Sidebar />

      <main className="flex-1 flex items-center justify-center bg-[#0B0F14] px-4">
        <div className="w-full max-w-md">
          {/* Icon + heading */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0F1419] border border-[#1F2933] mb-4">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-[#22C55E]" />
            </div>
            <h1 className="text-2xl font-bold text-[#F9FAFB]">Assistant Manager</h1>
            <p className="mt-1 text-sm text-[#CBD5E1]">Sign in to manage your Smart Assistant</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-[#1F2933] bg-[#0F1419] p-8 shadow-2xl">
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="manage-email" className="block text-sm font-medium text-[#F9FAFB] mb-1.5">
                  Email address
                </label>
                <input
                  id="manage-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full rounded-lg border border-[#1F2933] bg-[#0B0F14] px-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#CBD5E1]/40 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E] transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="manage-password" className="block text-sm font-medium text-[#F9FAFB] mb-1.5">
                  Password
                </label>
                <input
                  id="manage-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#1F2933] bg-[#0B0F14] px-4 py-2.5 text-sm text-[#F9FAFB] placeholder-[#CBD5E1]/40 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E] transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 focus:ring-offset-[#0F1419] mt-2"
              >
                <LockClosedIcon className="h-4 w-4" />
                {loading ? 'Signing in…' : 'Sign in to Manage'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
