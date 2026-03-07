'use client';

import { useState, useRef, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Aurora from '@/components/Aurora';
import PredictionForm, { type PredictionOutput, type FormValues } from '@/components/campaigns/PredictionForm';
import PredictionResults from '@/components/campaigns/PredictionResults';
import ExplainabilityPanel from '@/components/campaigns/ExplainabilityPanel';
import RecommendationsPanel from '@/components/campaigns/RecommendationsPanel';
import { CAMPAIGN_API_BASE_URL } from '@/config/api';
import styles from './styles/campaigns.module.css';

/* ─── Types ──────────────────────────────────────────────────── */
export interface CampaignData {
  caption: string;
  contentImage: File | null;
  contentText: string;
  platform: string;
  postDate: string;
  postTime: string;
  followers: number;
  adBoost: boolean;
}

export interface PredictionResult {
  id: string;
  timestamp: string;
  campaignData: CampaignData;
  predictions: {
    score: number;
    expectedReach: number;
    expectedEngagement: number;
    expectedClicks: number;
    expectedConversions: number;
    engagementRate: number;
    ctr: number;
  };
  insights: string[];
  recommendations: string[];
}

interface HistoryItem {
  _id: string;
  caption: string;
  content: string;
  platform: string;
  post_date: string;
  post_time: string;
  followers: number;
  ad_boost: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  timing_quality_score: number;
  explanation: Record<string, unknown> | null;
  createdAt: string;
}

type PageView = 'hero' | 'predictor' | 'history' | 'view-detail';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

/* ─── History List Item ──────────────────────────────────────── */
function HistoryCard({
  item,
  onView,
  onDelete,
  deleting,
}: {
  item: HistoryItem;
  onView: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className={styles.historyCard}>
      <div className={styles.historyCardTop}>
        <span className={styles.historyPlatformBadge}>{item.platform}</span>
        <span className={styles.historyDate}>
          {new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          {' '}
          {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {item.explanation && (
          <span className={styles.historyExplainBadge}>✓ Explained</span>
        )}
      </div>

      <p className={styles.historyCaption}>
        {item.caption ? item.caption.slice(0, 100) + (item.caption.length > 100 ? '…' : '') : <em>No caption</em>}
      </p>

      <div className={styles.historyMetrics}>
        <div className={styles.historyMetric}>
          <span className={styles.historyMetricVal}>{formatNumber(item.likes)}</span>
          <span className={styles.historyMetricLbl}>Likes</span>
        </div>
        <div className={styles.historyMetric}>
          <span className={styles.historyMetricVal}>{formatNumber(item.comments)}</span>
          <span className={styles.historyMetricLbl}>Comments</span>
        </div>
        <div className={styles.historyMetric}>
          <span className={styles.historyMetricVal}>{formatNumber(item.shares)}</span>
          <span className={styles.historyMetricLbl}>Shares</span>
        </div>
        <div className={styles.historyMetric}>
          <span className={styles.historyMetricVal}>{formatNumber(item.clicks)}</span>
          <span className={styles.historyMetricLbl}>Clicks</span>
        </div>
        <div className={styles.historyMetric}>
          <span className={styles.historyMetricVal}>{Math.round(item.timing_quality_score * 100)}%</span>
          <span className={styles.historyMetricLbl}>Timing</span>
        </div>
      </div>

      <div className={styles.historyActions}>
        <button className={styles.historyViewBtn} onClick={onView}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>
        <button
          className={styles.historyDeleteBtn}
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? (
            <span className={styles.deletingSpinner} />
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
          Delete
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function PerformancePredictorPage() {
  const [view, setView]               = useState<PageView>('hero');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<PredictionOutput | null>(null);
  const [savedForm, setSavedForm]     = useState<FormValues | null>(null);
  const [savedId, setSavedId]         = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<'results' | 'explain' | 'recommend'>('results');

  // History state
  const [historyItems, setHistoryItems]     = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [viewingItem, setViewingItem]       = useState<HistoryItem | null>(null);
  const [viewDetailTab, setViewDetailTab]   = useState<'results' | 'explain' | 'recommend'>('results');

  const resultsSectionRef = useRef<HTMLDivElement>(null);

  const handleResult = (prediction: PredictionOutput, formValues: FormValues, id: string | null) => {
    setResult(prediction);
    setSavedForm(formValues);
    setSavedId(id);
    setActiveTab('results');
    setTimeout(() => {
      resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleReset = () => {
    setResult(null);
    setSavedForm(null);
    setSavedId(null);
    setActiveTab('results');
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${CAMPAIGN_API_BASE_URL}/api/history`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load history');
      setHistoryItems(json.data);
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const openHistory = () => {
    setView('history');
    loadHistory();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${CAMPAIGN_API_BASE_URL}/api/history/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      setHistoryItems((prev) => prev.filter((x) => x._id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = async (id: string) => {
    try {
      const res = await fetch(`${CAMPAIGN_API_BASE_URL}/api/history/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load');
      setViewingItem(json.data);
      setViewDetailTab('results');
      setView('view-detail');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to load detail');
    }
  };

  /* ── Render the inner content based on current view ── */
  const renderContent = () => {
    // ─── Hero Landing View ─────────────────────────────────────────────
    if (view === 'hero') {
      return (
        <div className="relative min-h-screen bg-[#0B0F14] overflow-hidden">
          {/* Aurora Background */}
          <div className="absolute inset-0 opacity-30">
            <Aurora
              colorStops={['#22C55E', '#1F2933', '#0B0F14']}
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
                  <svg className="h-4 w-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm text-[#CBD5E1]">AI-Powered Performance Prediction</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-semibold text-[#F9FAFB] tracking-tight leading-tight">
                  Predict Campaign
                  <br />
                  <span className="text-[#22C55E]">Performance</span>
                </h1>

                <p className="text-lg text-[#CBD5E1] max-w-2xl mx-auto leading-relaxed">
                  Our AI-powered system helps Sri Lankan SMEs optimize social media campaigns by predicting engagement, analyzing content in Sinhala and English, and providing smart recommendations.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setView('predictor')}
                  className="group px-8 py-4 bg-[#22C55E] text-[#0B0F14] rounded-xl font-medium hover:bg-[#16A34A] transition-all flex items-center gap-2"
                >
                  Start Prediction
                  <svg className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </button>
                <button
                  onClick={openHistory}
                  className="px-8 py-4 bg-[#0B0F14] text-[#F9FAFB] rounded-xl font-medium border border-[#1F2933] hover:border-[#CBD5E1]/20 transition-all backdrop-blur-sm flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View History
                </button>
              </div>

            </div>
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0B0F14] to-transparent pointer-events-none" />
        </div>
      );
    }

    // ─── History View ──────────────────────────────────────────────────
    if (view === 'history') {
      return (
        <div className={styles.predictorPage}>
          <div className={styles.predictorCenter}>
            <div className={styles.historyPageHeader}>
              <button className={styles.backLinkBtn} onClick={() => setView('hero')}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to overview
              </button>
              <div style={{ flex: 1 }}>
                <h1 className={styles.centeredTitle} style={{ textAlign: 'left' }}>Prediction History</h1>
                <p className={styles.centeredSubtitle} style={{ textAlign: 'left' }}>All saved predictions with explainability and recommendations</p>
              </div>
              <button className={styles.historyRefreshBtn} onClick={loadHistory} disabled={historyLoading}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: historyLoading ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {historyLoading && (
              <div className={styles.historyLoadingBox}>
                <div className={styles.loadingSpinnerSm} />
                <p style={{ color: '#64748b', margin: 0 }}>Loading history...</p>
              </div>
            )}

            {historyError && (
              <div className={styles.historyErrorBox}>{historyError}</div>
            )}

            {!historyLoading && !historyError && historyItems.length === 0 && (
              <div className={styles.historyEmpty}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#374151">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No saved predictions yet.</p>
                <button className={styles.tryNowBtn} onClick={() => setView('predictor')} style={{ marginTop: 8 }}>
                  Run a Prediction
                </button>
              </div>
            )}

            {!historyLoading && historyItems.length > 0 && (
              <div className={styles.historyList}>
                {historyItems.map((item) => (
                  <HistoryCard
                    key={item._id}
                    item={item}
                    onView={() => handleView(item._id)}
                    onDelete={() => handleDelete(item._id)}
                    deleting={deletingId === item._id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ─── View Detail (History Item) ─────────────────────────────────────
    if (view === 'view-detail' && viewingItem) {
      const detailPrediction: PredictionOutput = {
        likes:                viewingItem.likes,
        comments:             viewingItem.comments,
        shares:               viewingItem.shares,
        clicks:               viewingItem.clicks,
        timing_quality_score: viewingItem.timing_quality_score,
      };
      const detailForm: FormValues = {
        caption:   viewingItem.caption,
        content:   viewingItem.content,
        platform:  viewingItem.platform,
        post_date: viewingItem.post_date,
        post_time: viewingItem.post_time,
        followers: String(viewingItem.followers),
        ad_boost:  viewingItem.ad_boost === 1,
      };

      return (
        <div className={styles.predictorPage}>
          <div className={styles.predictorWide}>
            <div className={styles.historyPageHeader}>
              <button className={styles.backLinkBtn} onClick={() => setView('history')}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to history
              </button>
              <div style={{ flex: 1 }}>
                <h1 className={styles.centeredTitle} style={{ textAlign: 'left', fontSize: '22px' }}>
                  Saved Prediction
                </h1>
                <p className={styles.centeredSubtitle} style={{ textAlign: 'left' }}>
                  {viewingItem.platform} · {new Date(viewingItem.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                className={styles.historyDeleteBtn}
                style={{ padding: '8px 16px' }}
                onClick={async () => {
                  await handleDelete(viewingItem._id);
                  setView('history');
                  loadHistory();
                }}
                disabled={deletingId === viewingItem._id}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>

            <div className={styles.tabsRow}>
              <button
                className={`${styles.tab} ${viewDetailTab === 'results' ? styles.tabActive : ''}`}
                onClick={() => setViewDetailTab('results')}
              >
                Predictions
              </button>
              <button
                className={`${styles.tab} ${viewDetailTab === 'explain' ? styles.tabActive : ''}`}
                onClick={() => setViewDetailTab('explain')}
              >
                Explainability {viewingItem.explanation ? '✓' : ''}
              </button>
              <button
                className={`${styles.tab} ${viewDetailTab === 'recommend' ? styles.tabActive : ''}`}
                onClick={() => setViewDetailTab('recommend')}
              >
                Recommendations
              </button>
            </div>

            <div style={{ display: viewDetailTab === 'results' ? 'block' : 'none' }}>
              <PredictionResults
                result={detailPrediction}
                platform={viewingItem.platform}
                loading={false}
                onReset={() => setView('history')}
              />
            </div>

            <div style={{ display: viewDetailTab === 'explain' ? 'block' : 'none' }}>
              <ExplainabilityPanel
                prediction={detailPrediction}
                formValues={detailForm}
                predictionId={viewingItem._id}
                preloadedExplanation={viewingItem.explanation}
              />
            </div>

            <div style={{ display: viewDetailTab === 'recommend' ? 'block' : 'none' }}>
              <RecommendationsPanel
                prediction={detailPrediction}
                formValues={detailForm}
              />
            </div>
          </div>
        </div>
      );
    }

    // ─── Predictor View ────────────────────────────────────────────────
    return (
      <div className={styles.predictorPage}>
        <div className={result ? styles.predictorWide : styles.predictorCenter}>

          {/* Page heading */}
          <div className={styles.centeredHeader}>
            <h1 className={styles.centeredTitle}>Campaign Performance Predictor</h1>
            <p className={styles.centeredSubtitle}>
              Enter your post details to predict engagement and get AI-powered recommendations.
            </p>
          </div>

          {/* Side-by-side layout: form left, results right */}
          <div className={result ? styles.sideLayout : ''}>

            {/* Form card */}
            <div className={result ? styles.sideLeft : ''}>
              <PredictionForm
                onResult={handleResult}
                onLoading={setLoading}
                loading={loading}
              />
            </div>

            {/* Results + Explainability */}
            {result && (
              <div className={styles.sideRight} ref={resultsSectionRef}>
                {savedId && (
                  <div className={styles.savedBanner}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Prediction saved to history
                  </div>
                )}

                <div className={styles.tabsRow}>
                  <button
                    className={`${styles.tab} ${activeTab === 'results' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('results')}
                  >
                    Predictions
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'explain' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('explain')}
                  >
                    Explainability
                  </button>
                  <button
                    className={`${styles.tab} ${activeTab === 'recommend' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('recommend')}
                  >
                    Recommendations
                  </button>
                </div>

                <div style={{ display: activeTab === 'results' ? 'block' : 'none' }}>
                  <PredictionResults
                    result={result}
                    platform={savedForm?.platform || ''}
                    loading={loading}
                    onReset={handleReset}
                  />
                </div>

                {savedForm && (
                  <>
                    <div style={{ display: activeTab === 'explain' ? 'block' : 'none' }}>
                      <ExplainabilityPanel
                        prediction={result}
                        formValues={savedForm}
                        predictionId={savedId}
                      />
                    </div>

                    <div style={{ display: activeTab === 'recommend' ? 'block' : 'none' }}>
                      <RecommendationsPanel
                        prediction={result}
                        formValues={savedForm}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Bottom nav */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              className={styles.backLinkBtn}
              onClick={() => { setView('hero'); handleReset(); }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to overview
            </button>
            <button className={styles.backLinkBtn} onClick={openHistory}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View History
            </button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#0B0F14]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#0B0F14]">
          {renderContent()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
