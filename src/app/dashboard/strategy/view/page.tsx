'use client';

import { 
  ArrowLeftIcon, 
  ArrowPathIcon, 
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  loadStrategyFromStorage,
  generateNewVersion,
  fetchStrategyById,
  listVersions,
  type StrategyResult,
  type StrategyMeta,
  type StrategyVersionSummary,
} from '@/services/strategyApiService';

export default function StrategyViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  // The strategy currently being *displayed* — may be a historical version
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  // The always-current strategy loaded from localStorage (for version list + generate button)
  const [currentStrategy, setCurrentStrategy] = useState<StrategyResult | null>(null);
  const [meta, setMeta] = useState<StrategyMeta | null>(null);
  const [loaded, setLoaded] = useState(false);

  // true when the user navigated to a historical version via ?vid=
  const [isHistoricalView, setIsHistoricalView] = useState(false);

  // Version generation state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Version history state
  const [versions, setVersions] = useState<StrategyVersionSummary[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Load current strategy from localStorage once
  useEffect(() => {
    const stored = loadStrategyFromStorage();
    if (stored) {
      setCurrentStrategy(stored.strategy);
      setMeta(stored.meta);
    }
    setLoaded(true);
  }, []);

  // If ?vid= param is present, load that historical version; otherwise show current
  useEffect(() => {
    const vid = searchParams.get('vid');
    if (vid) {
      setIsHistoricalView(true);
      fetchStrategyById(vid)
        .then((hist) => setStrategy(hist))
        .catch(() => setStrategy(currentStrategy)); // fallback to current on error
    } else {
      setIsHistoricalView(false);
      setStrategy(currentStrategy);
    }
  }, [searchParams, currentStrategy]);

  // Load version history from the *current* (active) strategy
  useEffect(() => {
    if (!currentStrategy?.strategy_id) return;
    setVersionsLoading(true);
    listVersions(currentStrategy.strategy_id)
      .then((res) => setVersions(res.versions))
      .catch(() => setVersions([]))
      .finally(() => setVersionsLoading(false));
  }, [currentStrategy?.strategy_id]);

  const handleGenerateNewVersion = async () => {
    // Always generate from the active (current) strategy, not a historical one
    const activeId = currentStrategy?.strategy_id;
    if (!activeId) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const newStrat = await generateNewVersion(activeId);
      setCurrentStrategy(newStrat);
      // Exit historical view and show the new version
      setIsHistoricalView(false);
      setStrategy(newStrat);
      router.replace('/dashboard/strategy/view');
      const stored = loadStrategyFromStorage();
      if (stored) setMeta(stored.meta);
      // Refresh version list
      const updated = await listVersions(newStrat.strategy_id!);
      setVersions(updated.versions);
    } catch (err: any) {
      setGenerateError(err.message || 'Failed to generate new version');
    } finally {
      setGenerating(false);
    }
  };

  const generatedDate = meta?.generatedAt
    ? new Date(meta.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  const confidencePct = strategy ? Math.round(strategy.confidence_score * 100) : 0;

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'platforms', name: 'Platforms' },
    { id: 'content', name: 'Content Plan' },
    { id: 'budget', name: 'Budget' },
    { id: 'confidence', name: 'Strategy Health' },
    { id: 'versions', name: versions.length > 0 ? `Past Versions (${versions.length})` : 'Past Versions' },
  ];

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="animate-pulse text-[#CBD5E1]">Loading strategy...</div>
      </div>
    );
  }

  if (!strategy || !meta) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <ExclamationCircleIcon className="h-12 w-12 text-[#64748B] mx-auto" />
          <h2 className="text-xl font-semibold text-[#F9FAFB]">No strategy found</h2>
          <p className="text-[#CBD5E1]">Please complete the business profile form first.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#22C55E] text-[#0B0F14] rounded-lg font-medium hover:bg-[#16A34A] transition-all"
          >
            Go to Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Historical version notice */}
        {isHistoricalView && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-[#F59E0B]" />
              <span className="text-sm text-[#F59E0B] font-medium">
                Viewing historical Version {strategy.version} — this is not the current active strategy
              </span>
            </div>
            <button
              onClick={() => router.push('/dashboard/strategy/view')}
              className="text-xs text-[#CBD5E1] hover:text-[#F9FAFB] underline underline-offset-2 transition-colors"
            >
              ← Back to current version
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard/strategy')}
              className="p-2 hover:bg-[#1F2933] rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-[#CBD5E1]" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-[#F9FAFB]">Strategy v{strategy.version}</h1>
                {isHistoricalView ? (
                  <span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-full text-sm font-medium border border-[#F59E0B]/20">
                    Historical
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded-full text-sm font-medium border border-[#22C55E]/20">
                    Active
                  </span>
                )}
                {strategy.drift_level && strategy.drift_level !== 'LOW' && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                    strategy.drift_level === 'HIGH'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                  }`}>
                    {strategy.drift_level} Drift
                  </span>
                )}
              </div>
              <p className="text-sm text-[#CBD5E1] mt-1">
                {meta.businessType}{meta.industry ? ` · ${meta.industry}` : ''} • Generated {generatedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {generateError && (
              <span className="text-xs text-red-400 max-w-[200px] truncate" title={generateError}>
                {generateError}
              </span>
            )}
            <button
              onClick={handleGenerateNewVersion}
              disabled={generating || !strategy?.strategy_id}
              className="px-4 py-2.5 bg-[#22C55E] text-[#0B0F14] rounded-lg font-medium hover:bg-[#16A34A] transition-all text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Creating...' : 'Create New Version'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#2D3748]">
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-sm font-medium transition-colors relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-[#22C55E]'
                    : 'text-[#CBD5E1] hover:text-[#F9FAFB]'
                }`}
              >
                {tab.name}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22C55E]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6">

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Your Strategy at a Glance</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                  <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Business Type</div>
                  <div className="text-[#F9FAFB] font-medium">{meta.businessType}</div>
                </div>
                {meta.industry && (
                  <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                    <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Industry</div>
                    <div className="text-[#F9FAFB] font-medium">{meta.industry}</div>
                  </div>
                )}
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                  <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Primary Goal</div>
                  <div className="text-[#F9FAFB] font-medium capitalize">{meta.primaryGoal.replace(/-/g, ' ')}</div>
                </div>
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                  <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Target Location</div>
                  <div className="text-[#F9FAFB] font-medium">{meta.targetLocation || meta.city || 'N/A'}</div>
                </div>
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748] md:col-span-2">
                  <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Monthly Budget</div>
                  <div className="text-[#F9FAFB] font-medium">{meta.monthlyBudget}</div>
                </div>
              </div>

              <div className="p-5 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                <div className="flex items-center gap-2 mb-3">
                  <ChartBarIcon className="h-4 w-4 text-[#22C55E]" />
                  <span className="text-sm font-medium text-[#F9FAFB]">Strategy Summary</span>
                </div>
                <p className="text-[#CBD5E1] text-sm leading-relaxed whitespace-pre-wrap">{strategy.strategy_summary}</p>
              </div>

              <div className="p-5 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="h-4 w-4 text-[#22C55E]" />
                  <span className="text-sm font-medium text-[#F9FAFB]">Why We Chose This</span>
                </div>
                <p className="text-[#CBD5E1] text-sm leading-relaxed whitespace-pre-wrap">{strategy.reasoning}</p>
              </div>
            </div>
          )}

          {/* ── Platforms ── */}
          {activeTab === 'platforms' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Recommended Platforms</h2>
              {strategy.recommended_platforms.map((platform, index) => {
                const budgetPct = strategy.budget_allocation[platform] ?? null;
                return (
                  <div key={index} className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
                        <h3 className="text-[#F9FAFB] font-medium">{platform}</h3>
                      </div>
                      {budgetPct != null && (
                        <span className="px-3 py-1 bg-[#22C55E]/10 text-[#22C55E] rounded-full text-sm font-medium border border-[#22C55E]/20">
                          {budgetPct}% of budget
                        </span>
                      )}
                    </div>
                    {budgetPct != null && (
                      <div className="mt-3 h-1.5 bg-[#1F2933] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22C55E] rounded-full"
                          style={{ width: `${Math.min(budgetPct, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Any budget items not in recommended_platforms */}
              {Object.entries(strategy.budget_allocation)
                .filter(([channel]) => !strategy.recommended_platforms.includes(channel))
                .map(([channel, pct], index) => (
                  <div key={`extra-${index}`} className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[#CBD5E1] font-medium">{channel}</h3>
                      <span className="text-sm text-[#64748B]">{pct}% of budget</span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* ── Content Plan ── */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Your Content Plan</h2>
              <div className="p-5 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                <p className="text-[#CBD5E1] text-sm leading-relaxed whitespace-pre-wrap">{strategy.content_strategy}</p>
              </div>
            </div>
          )}

          {/* ── Budget ── */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Where Your Budget Goes</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                  <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Monthly Budget</div>
                  <div className="text-2xl font-semibold text-[#F9FAFB]">{meta.monthlyBudget}</div>
                </div>
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                  <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Channels</div>
                  <div className="text-2xl font-semibold text-[#F9FAFB]">{Object.keys(strategy.budget_allocation).length}</div>
                </div>
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                  <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">Strategy Strength</div>
                  <div className="text-2xl font-semibold text-[#22C55E]">{confidencePct}%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#CBD5E1]">Channel Breakdown</h3>
                {Object.entries(strategy.budget_allocation)
                  .sort(([, a], [, b]) => b - a)
                  .map(([channel, pct], index) => (
                    <div key={index} className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#F9FAFB] font-medium">{channel}</span>
                        <span className="text-[#22C55E] font-semibold">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-[#1F2933] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22C55E] rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── Strategy Health ── */}
          {activeTab === 'confidence' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-[#F9FAFB]">How Strong Is Your Strategy?</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Overall Strength', value: strategy.confidence_score, highlight: true },
                  { label: 'Latest Trends', value: strategy.trend_recency_score },
                  { label: 'Business Match', value: strategy.similarity_score },
                  { label: 'Data Quality', value: strategy.data_coverage_score },
                  { label: 'Platform Fit', value: strategy.platform_stability_score },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className={`p-4 rounded-lg border ${highlight ? 'bg-[#22C55E]/5 border-[#22C55E]/20' : 'bg-[#0B0F14] border-[#2D3748]'}`}>
                    <div className="text-xs text-[#64748B] uppercase tracking-wider mb-1">{label}</div>
                    <div className={`text-2xl font-semibold ${highlight ? 'text-[#22C55E]' : 'text-[#F9FAFB]'}`}>
                      {value != null ? `${Math.round(value * 100)}%` : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[#CBD5E1]">Market Freshness</h3>
                <div className="p-4 bg-[#0B0F14] rounded-lg border border-[#2D3748] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#CBD5E1]">Market Status</span>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${
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
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#CBD5E1]">How aligned?</span>
                    <span className="text-sm font-medium text-[#F9FAFB]">
                      {strategy.drift_similarity != null ? `${Math.round(strategy.drift_similarity * 100)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#CBD5E1]">Update recommended?</span>
                    <span className={`text-sm font-medium ${strategy.regenerate_flag ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
                      {strategy.regenerate_flag ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#CBD5E1]">Version</span>
                    <span className="text-sm font-medium text-[#F9FAFB]">v{strategy.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#CBD5E1]">Created</span>
                    <div className="flex items-center gap-2 text-sm text-[#64748B]">
                      <ClockIcon className="h-4 w-4" />
                      {generatedDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Past Versions ── */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#F9FAFB]">Past Versions</h2>
                <button
                  onClick={handleGenerateNewVersion}
                  disabled={generating || !strategy?.strategy_id}
                  className="px-4 py-2 bg-[#22C55E] text-[#0B0F14] rounded-lg font-medium hover:bg-[#16A34A] transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Creating...' : 'Create New Version'}
                </button>
              </div>

              {generateError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <ExclamationCircleIcon className="h-4 w-4 text-red-400 shrink-0" />
                  <span className="text-sm text-red-400">{generateError}</span>
                </div>
              )}

              {versionsLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-[#0B0F14] rounded-lg animate-pulse border border-[#2D3748]" />
                  ))}
                </div>
              )}

              {!versionsLoading && versions.length === 0 && (
                <div className="text-center py-10 text-[#64748B]">
                  <ClockIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No past versions yet. Click "Create New Version" to get started!</p>
                </div>
              )}

              {!versionsLoading && versions.map((v) => {
                const isActive = v.strategy_id === strategy?.strategy_id;
                const confPct = v.confidence_score != null ? Math.round(v.confidence_score * 100) : null;
                const vDate = new Date(v.created_at).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                });
                const vTime = new Date(v.created_at).toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit',
                });

                return (
                  <div
                    key={v.strategy_id}
                    className={`p-5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-[#22C55E]/5 border-[#22C55E]/30'
                        : 'bg-[#0B0F14] border-[#2D3748] hover:border-[#3D4A5C]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-[#22C55E]/10' : 'bg-[#1F2933]'
                        }`}>
                          <span className={`text-sm font-bold ${isActive ? 'text-[#22C55E]' : 'text-[#CBD5E1]'}`}>
                            v{v.version}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#F9FAFB]">
                              Version {v.version}
                            </span>
                            {isActive && (
                              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#22C55E]/10 text-[#22C55E] rounded-full text-xs font-medium border border-[#22C55E]/20">
                                <CheckCircleIcon className="h-3 w-3" />
                                Active
                              </span>
                            )}
                            {v.auto_updated_at && (
                              <span className="px-2 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full text-xs border border-[#3B82F6]/20">
                                Auto-refreshed
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#64748B]">
                            <ClockIcon className="h-3 w-3" />
                            {vDate} at {vTime}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {confPct != null && (
                          <span className="text-sm font-semibold text-[#22C55E]">{confPct}% strength</span>
                        )}
                        {v.drift_level && (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                            v.drift_level === 'HIGH'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : v.drift_level === 'MODERATE'
                              ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                              : 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20'
                          }`}>
                            {v.drift_level === 'HIGH' ? 'Needs update'
                              : v.drift_level === 'MODERATE' ? 'Minor changes'
                              : 'Up to date'}
                          </span>
                        )}
                        {!isActive && (
                          <button
                            onClick={() => router.push(`/dashboard/strategy/view?vid=${v.strategy_id}`)}
                            className="px-3 py-1.5 text-xs font-medium bg-[#1F2933] text-[#CBD5E1] rounded-lg border border-[#2D3748] hover:border-[#22C55E]/30 hover:text-[#22C55E] transition-all"
                          >
                            Details
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Platform pills */}
                    {v.recommended_platforms.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-[#2D3748]/50">
                        {v.recommended_platforms.map((p) => (
                          <span key={p} className="px-2.5 py-1 bg-[#1F2933] text-[#CBD5E1] rounded-full text-xs border border-[#2D3748]">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Summary preview */}
                    {v.strategy_summary && (
                      <p className="mt-2 text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {v.strategy_summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
