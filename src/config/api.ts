/**
 * Shared API configuration
 * -------------------------------------------------
 * Import API_BASE_URL from here when building any
 * service that calls the backend.  This ensures
 * every module picks up the same env variable and
 * avoids hard-coded URL duplication across branches.
 *
 *  Usage:
 *    import { API_BASE_URL } from '@/config/api';
 *    fetch(`${API_BASE_URL}/api/your-route`, ...)
 *
 * Set NEXT_PUBLIC_API_BASE_URL in your .env.local to
 * point at the backend. Defaults to localhost:8000.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const CAMPAIGN_API_BASE_URL =
  process.env.NEXT_PUBLIC_CAMPAIGN_BASE_URL || 'http://localhost:5000';

/** Convenience helper – returns JSON headers, with optional Bearer token */
export function buildHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
