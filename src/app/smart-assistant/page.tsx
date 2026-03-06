'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import SmartAssistant from '@/features/chatbot';

export default function SmartAssistantPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#0B0F14]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#0B0F14]">
          <SmartAssistant />
        </main>
      </div>
    </ProtectedRoute>
  );
}
