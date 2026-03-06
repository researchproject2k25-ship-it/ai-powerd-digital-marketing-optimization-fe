'use client';

import styles from './PredictionResults.module.css';
import type { PredictionOutput, FormValues } from './PredictionForm';

interface PredictionResultsProps {
  result: PredictionOutput | null;
  platform: string;
  loading: boolean;
  onReset: () => void;
}

const metrics: { key: keyof Omit<PredictionOutput, 'timing_quality_score'>; label: string }[] = [
  { key: 'likes',    label: 'Predicted Likes' },
  { key: 'comments', label: 'Predicted Comments' },
  { key: 'shares',   label: 'Predicted Shares' },
  { key: 'clicks',   label: 'Predicted Clicks' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}

function scoreClass(score: number): string {
  if (score >= 0.8) return styles.scoreHigh;
  if (score >= 0.6) return styles.scoreGood;
  if (score >= 0.4) return styles.scoreMed;
  return styles.scoreLow;
}

export default function PredictionResults({
  result,
  platform,
  loading,
  onReset,
}: PredictionResultsProps) {
  if (loading) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>Running Transformer model inference...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>No predictions yet</p>
        <p className={styles.emptyHint}>
          Fill in post details and click{' '}
          <span className={styles.highlight}>Predict Performance</span> to see AI-powered results.
        </p>
      </div>
    );
  }

  const score = result.timing_quality_score;
  const scorePercent = Math.round(score * 100);

  return (
    <div className={styles.resultsWrapper}>
      {/* Metrics card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Prediction Results</h2>
          {platform && (
            <span className={styles.platformBadge}>{platform}</span>
          )}
        </div>

        <div className={styles.metricsGrid}>
          {metrics.map(({ key, label }) => (
            <div key={key} className={styles.metricCard}>
              <span className={styles.metricLabel}>{label}</span>
              <span className={styles.metricValue}>
                {formatNumber(result[key])}
              </span>
            </div>
          ))}
        </div>

        {/* Timing quality score – full width */}
        <div className={styles.timingCard}>
          <div style={{ flex: 1 }}>
            <p className={styles.timingLabel}>Timing Quality Score</p>
            <p className={styles.timingSubLabel}>How optimal is your posting time</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${scorePercent}%` }}
              />
            </div>
          </div>
          <span className={`${styles.timingScoreText} ${scoreClass(score)}`}>
            {scorePercent}%
          </span>
        </div>
      </div>

      {/* Reset */}
      <button className={styles.resetBtn} onClick={onReset}>
        Start New Prediction
      </button>
    </div>
  );
}
