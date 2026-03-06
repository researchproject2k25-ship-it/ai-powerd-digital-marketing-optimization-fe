'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export function AuthHeader() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-[#1F2933] border-b border-[#CBD5E1]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-[#F9FAFB] font-semibold text-lg">
              Serendib AI
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-[#CBD5E1] text-sm">
              {user?.email}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-[#F9FAFB] bg-[#0F1419] hover:bg-[#1F2933] border border-[#CBD5E1]/20 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
