'use client';

import { 
  ArrowRightIcon, 
  SparklesIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  BoltIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  loadStrategyFromStorage,
  toggleRealtime,
  checkDrift,
  forceRefresh,
  type StrategyResult,
  type StrategyMeta,
  type DriftCheckResult,
} from '@/services/strategyApiService';

const POLL_INTERVAL_MS = 60_000; // 60 seconds

export default function StrategyDashboard() {
  const router = useRouter();
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [meta, setMeta] = useState<StrategyMeta | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Realtime state
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [driftStatus, setDriftStatus] = useState<DriftCheckResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = loadStrategyFromStorage();
    if (stored) {
      setStrategy(stored.strategy);
      setMeta(stored.meta);
      // Restore realtime toggle from localStorage
      const rtFlag = localStorage.getItem('realtime_enabled');
      setRealtimeEnabled(rtFlag === 'true');
    }
    setLoaded(true);
  }, []);

  // -- Drift polling --
  const runDriftCheck = useCallback(async () => {
    if (!strategy?.strategy_id) return;
    try {
      const result = await checkDrift(strategy.strategy_id);
      setDriftStatus(result);
      setPollError(null);

      // If the backend already auto-refreshed this strategy (e.g. n8n triggered),
      // swap to the new strategy automatically.
      if (result.auto_refreshed) {
        const newStrat = result.auto_refreshed.strategy;
        setStrategy(newStrat);
        localStorage.setItem('strategy_result', JSON.stringify(newStrat));
        if (meta) {
          const updatedMeta = { ...meta, generatedAt: new Date().toISOString() };
          setMeta(updatedMeta);
          localStorage.setItem('strategy_meta', JSON.stringify(updatedMeta));
        }
        setDriftStatus(null); // reset — new strategy has no drift yet
      }
    } catch (err: any) {
      setPollError(err.message || 'Drift check failed');
    }
  }, [strategy?.strategy_id, meta]);

  useEffect(() => {
    if (realtimeEnabled && strategy?.strategy_id) {
      // Run immediately, then poll
      runDriftCheck();
      pollRef.current = setInterval(runDriftCheck, POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [realtimeEnabled, strategy?.strategy_id, runDriftCheck]);

  // -- Toggle handler --
  const handleToggleRealtime = async () => {
    if (!strategy?.strategy_id) return;
    setToggling(true);
    try {
      const newState = !realtimeEnabled;
      await toggleRealtime(strategy.strategy_id, newState);
      setRealtimeEnabled(newState);
      localStorage.setItem('realtime_enabled', String(newState));
      if (!newState) {
        setDriftStatus(null);
        setPollError(null);
      }
    } catch (err: any) {
      setPollError(err.message || 'Failed to toggle');
    } finally {
      setToggling(false);
    }
  };

  // -- Force refresh handler --
  const handleForceRefresh = async () => {
    if (!strategy?.strategy_id) return;
    setRefreshing(true);
    try {
      const result = await forceRefresh(strategy.strategy_id);
      // Reload strategy from localStorage (forceRefresh already updated it)
      const stored = loadStrategyFromStorage();
      if (result.strategy && stored) {
        setStrategy(stored.strategy);
        setMeta(stored.meta);
      }
      setDriftStatus(null);
    } catch (err: any) {
      setPollError(err.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  // Derive display values from real data
  const businessName = meta
    ? [meta.businessType, meta.industry].filter(Boolean).join(' · ')
    : '';
  const businessLocation = meta?.city || '';
  const generatedDate = meta?.generatedAt
    ? new Date(meta.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const confidencePct = strategy ? Math.round(strategy.confidence_score * 100) : 0;

  // Build insights from the real strategy
  const insights: { type: 'success' | 'warning' | 'info'; message: string }[] = strategy
    ? [
        { type: 'success', message: `We're ${confidencePct}% sure this strategy fits your business well.` },
        ...(strategy.drift_level === 'HIGH'
          ? [{ type: 'warning' as const, message: 'Things have changed a lot in your market — we recommend creating a fresh strategy.' }]
          : strategy.drift_level === 'MODERATE'
          ? [{ type: 'warning' as const, message: 'Your market has shifted a bit since this strategy was made. Keep an eye on it!' }]
          : [{ type: 'info' as const, message: 'Your strategy is up to date with the latest market trends.' }]),
        {
          type: 'info' as const,
          message: `Best platforms for you: ${strategy.recommended_platforms.join(', ')}.`,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Back to Dashboard */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-[#CBD5E1] hover:text-[#22C55E] transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </button>

        {/* Loading skeleton */}
        {!loaded && (
          <div className="animate-pulse space-y-6">
            <div className="h-24 bg-[#1F2933] rounded-xl" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-[#1F2933] rounded-xl" />
              <div className="h-48 bg-[#1F2933] rounded-xl" />
            </div>
          </div>
        )}

        {/* No strategy yet — prompt user to fill the form */}
        {loaded && !strategy && (
          <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#1F2933] border border-[#22C55E]/20 rounded-xl p-10 text-center space-y-4">
            <SparklesIcon className="h-12 w-12 text-[#22C55E] mx-auto" />
            <h2 className="text-2xl font-semibold text-[#F9FAFB]">Let's build your marketing plan!</h2>
            <p className="text-[#CBD5E1] max-w-lg mx-auto">
              Tell us about your business and we'll create a personalised marketing strategy just for you.
            </p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#22C55E] text-[#0B0F14] rounded-lg font-medium hover:bg-[#16A34A] transition-all"
            >
              Get Started
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Strategy is loaded — show real data */}
        {loaded && strategy && meta && (
          <>
            {/* 1️⃣ Business Context Bar */}
            <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-[#22C55E]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#F9FAFB]">{businessName}</h2>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {businessLocation && (
                        <>
                          <span className="text-sm text-[#CBD5E1]">{businessLocation}</span>
                          <span className="text-[#64748B]">•</span>
                        </>
                      )}
                      <span className="text-sm text-[#CBD5E1]">Budget: {meta.monthlyBudget}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-[#CBD5E1]">Strategy Strength</div>
                    <div className="text-2xl font-semibold text-[#22C55E]">{confidencePct}%</div>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/my-business')}
                    className="px-4 py-2 bg-[#0B0F14] text-[#F9FAFB] rounded-lg border border-[#2D3748] hover:border-[#22C55E]/30 transition-all text-sm"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Outdated strategy banner */}
            {strategy.regenerate_flag && (
              <div className="flex items-start gap-3 p-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl">
                <ExclamationCircleIcon className="h-5 w-5 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#F59E0B]">Your strategy may be outdated</p>
                  <p className="text-sm text-[#CBD5E1] mt-0.5">
                    The market has changed since this was created. We recommend getting a fresh strategy.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard/strategy/view')}
                  className="ml-auto shrink-0 px-3 py-1.5 text-xs font-medium bg-[#F59E0B] text-[#0B0F14] rounded-lg hover:bg-[#D97706] transition-all"
                >
                  Update Strategy
                </button>
              </div>
            )}

            {/* Market change alert from polling */}
            {driftStatus && driftStatus.regenerate && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <BoltIcon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-400">Market changes detected — your strategy needs updating</p>
                  <p className="text-sm text-[#CBD5E1] mt-0.5">
                    We found new market trends that affect your business. Your current strategy is only {(driftStatus.similarity * 100).toFixed(0)}% aligned. Let us update it for you!
                  </p>
                </div>
                <button
                  onClick={handleForceRefresh}
                  disabled={refreshing}
                  className="ml-auto shrink-0 px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {refreshing && <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />}
                  {refreshing ? 'Updating...' : 'Update Now'}
                </button>
              </div>
            )}

            {/* Real-time Updates Toggle Card */}
            <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    realtimeEnabled ? 'bg-[#22C55E]/10 border border-[#22C55E]/20' : 'bg-[#0B0F14] border border-[#2D3748]'
                  }`}>
                    <SignalIcon className={`h-5 w-5 ${realtimeEnabled ? 'text-[#22C55E]' : 'text-[#64748B]'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F9FAFB]">Stay Up to Date</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {realtimeEnabled
                        ? 'We\'re watching the market for you and will let you know if anything changes'
                        : 'Turn this on so we can alert you when market trends shift'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Market status indicator */}
                  {realtimeEnabled && driftStatus && (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        driftStatus.drift_level === 'HIGH' ? 'bg-red-400 animate-pulse' :
                        driftStatus.drift_level === 'MODERATE' ? 'bg-[#F59E0B]' :
                        'bg-[#22C55E]'
                      }`} />
                      <span className={`text-xs font-medium ${
                        driftStatus.drift_level === 'HIGH' ? 'text-red-400' :
                        driftStatus.drift_level === 'MODERATE' ? 'text-[#F59E0B]' :
                        'text-[#22C55E]'
                      }`}>
                        {driftStatus.drift_level === 'HIGH' ? 'Needs update' :
                         driftStatus.drift_level === 'MODERATE' ? 'Minor changes' :
                         'All good'}
                      </span>
                    </div>
                  )}

                  {/* Poll error */}
                  {pollError && (
                    <span className="text-xs text-red-400 max-w-[200px] truncate" title={pollError}>
                      {pollError.length > 50 ? pollError.slice(0, 50) + '…' : pollError}
                    </span>
                  )}

                  {/* Toggle switch */}
                  <button
                    onClick={handleToggleRealtime}
                    disabled={toggling || !strategy.strategy_id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                      realtimeEnabled ? 'bg-[#22C55E]' : 'bg-[#2D3748]'
                    }`}
                    role="switch"
                    aria-checked={realtimeEnabled}
                    aria-label="Toggle real-time updates"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                        realtimeEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* 2️⃣ Strategy Status Card */}
              <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="h-6 w-6 text-[#22C55E]" />
                  <h3 className="text-lg font-semibold text-[#F9FAFB]">Your Marketing Plan</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#2D3748]">
                    <span className="text-sm text-[#CBD5E1]">Version</span>
                    <span className="text-sm font-medium text-[#F9FAFB]">v{strategy.version}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#2D3748]">
                    <span className="text-sm text-[#CBD5E1]">Created</span>
                    <span className="text-sm font-medium text-[#F9FAFB]">{generatedDate}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#2D3748]">
                    <span className="text-sm text-[#CBD5E1]">Platforms</span>
                    <span className="text-sm font-medium text-[#F9FAFB] text-right max-w-[200px]">
                      {strategy.recommended_platforms.slice(0, 3).join(', ')}
                      {strategy.recommended_platforms.length > 3 && ` +${strategy.recommended_platforms.length - 3}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-[#CBD5E1]">Market Status</span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                      strategy.drift_level === 'HIGH'
                        ? 'bg-red-500/10 text-red-400'
                        : strategy.drift_level === 'MODERATE'
                        ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                        : strategy.drift_level === 'LOW'
                        ? 'bg-[#22C55E]/10 text-[#22C55E]'
                        : 'text-[#64748B]'
                    }`}>
                      {strategy.drift_level === 'HIGH' ? 'Needs update'
                        : strategy.drift_level === 'MODERATE' ? 'Minor changes'
                        : strategy.drift_level === 'LOW' ? 'Up to date'
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <CheckCircleIcon className="h-5 w-5 text-[#22C55E]" />
                  <span className="text-sm text-[#22C55E]">Active</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => router.push('/dashboard/strategy/view')}
                    className="flex-1 px-4 py-2.5 bg-[#22C55E] text-[#0B0F14] rounded-lg font-medium hover:bg-[#16A34A] transition-all text-sm"
                  >
                    View Strategy
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/strategy/view')}
                    className="flex-1 px-4 py-2.5 bg-[#0B0F14] text-[#F9FAFB] rounded-lg border border-[#2D3748] hover:border-[#22C55E]/30 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Create New Version
                  </button>
                </div>
              </div>

              {/* 3️⃣ Confidence Breakdown Card */}
              <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <SparklesIcon className="h-6 w-6 text-[#22C55E]" />
                  <h3 className="text-lg font-semibold text-[#F9FAFB]">How Strong Is Your Strategy?</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Based on Latest Trends', value: strategy.trend_recency_score },
                    { label: 'Matches Your Business', value: strategy.similarity_score },
                    { label: 'Data Quality', value: strategy.data_coverage_score },
                    { label: 'Platform Fit', value: strategy.platform_stability_score },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#CBD5E1]">{label}</span>
                        <span className="text-xs text-[#64748B]">{value != null ? `${Math.round(value * 100)}%` : 'N/A'}</span>
                      </div>
                      <div className="h-1.5 bg-[#0B0F14] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22C55E] rounded-full transition-all"
                          style={{ width: `${value != null ? Math.round(value * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#2D3748]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#CBD5E1]">Overall Strength</span>
                    <span className="text-lg font-semibold text-[#22C55E]">{confidencePct}%</span>
                  </div>
                  <div className="h-2 bg-[#0B0F14] rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-[#22C55E] rounded-full"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 4️⃣ Strategy Insights */}
            <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <LightBulbIcon className="h-6 w-6 text-[#22C55E]" />
                  <h3 className="text-lg font-semibold text-[#F9FAFB]">What You Should Know</h3>
                </div>
                <button
                  onClick={() => router.push('/dashboard/strategy/view')}
                  className="text-sm text-[#22C55E] hover:text-[#16A34A] transition-colors flex items-center gap-1"
                >
                  Full Detail
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      insight.type === 'success' ? 'bg-[#22C55E]' :
                      insight.type === 'warning' ? 'bg-[#F59E0B]' :
                      'bg-[#3B82F6]'
                    }`} />
                    <span className="text-sm text-[#CBD5E1] flex-1">{insight.message}</span>
                  </div>
                ))}
              </div>

              {/* Strategy summary preview */}
              <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wider">Summary</p>
                <p className="text-sm text-[#CBD5E1] line-clamp-3">{strategy.strategy_summary}</p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
