'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * HOC to protect routes that require authentication
 * AUTH TEMPORARILY DISABLED — renders children unconditionally
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TODO: re-enable auth when ready
  return <>{children}</>;
}

/**
 * Higher-order component to wrap pages that require authentication
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
