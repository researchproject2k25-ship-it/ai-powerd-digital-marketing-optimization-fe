'use client';

import { useState, useEffect } from 'react';
import styles from './ExplainabilityPanel.module.css';
import type { PredictionOutput, FormValues } from './PredictionForm';
import { CAMPAIGN_API_BASE_URL } from '@/config/api';

interface ExplainabilityPanelProps {
  prediction: PredictionOutput;
  formValues: FormValues;
  predictionId?: string | null;
  preloadedExplanation?: Record<string, unknown> | null;
}

interface Improvement {
  metric: string;
  current_score: string;
  potential_score?: string;
  root_cause?: string;
  improvement_tips: string[];
}

interface BestPostingTime {
  recommended_days: string[];
  recommended_hours: string;
  reasoning: string;
}

interface LinguisticAnalysis {
  tone: string;
  tone_explanation: string;
  sentiment: string;
  sentiment_impact: string;
  language_mix: string;
  readability_verdict: string;
  bilingual_effectiveness: string;
  keyword_density: string;
}

interface PresentTrigger {
  trigger: string;
  evidence: string;
  strength: string;
  strength_reason: string;
  metric_impact: string;
}

interface MissingTrigger {
  trigger: string;
  why_it_matters: string;
  how_to_add: string;
  expected_uplift: string;
}

interface PsychologicalTriggers {
  present: PresentTrigger[];
  missing: MissingTrigger[];
}

interface EngagementPsychology {
  current_motivation: string;
  friction_points: string;
  desired_action: string;
  cognitive_load: string;
  emotional_hook: string;
}

interface StructuralScoring {
  hook_strength: string;
  cta_clarity: string;
  emoji_usage: string;
  urgency_level: string;
  question_engagement: string;
  hashtag_placement: string;
}

interface CaptionAnalysis {
  score: string;
  structural_scoring?: StructuralScoring;
  strengths: string[];
  weaknesses: string[];
  language_effectiveness?: string;
  rewritten_caption: string;
}

interface ContentAnalysis {
  score: string;
  current_length_verdict: string;
  storytelling_analysis?: string;
  value_proposition?: string;
  visual_content_recommendation?: string;
  improvement_tips: string[];
}

interface PlatformTip {
  tip: string;
  detail: string;
  algorithm_reason: string;
  implementation: string;
  expected_impact: string;
}

interface NoveltyInsight {
  insight: string;
  research_basis: string;
  application: string;
  competitive_advantage: string;
}

interface PeakTimesAnalysis {
  recommended_days: string[];
  recommended_hours: string;
  why_these_days: string;
  why_these_hours: string;
  missed_opportunity_cost?: string;
  category_timing_note: string;
  current_vs_optimal: string;
}

interface WorkingElement {
  element: string;
  why_it_works: string;
  impact?: string;
}

interface MissingElement {
  missing_element: string;
  why_add_it: string;
  example: string;
  expected_uplift: string;
}

interface ImprovedCaptionVersion {
  version_label: string;
  caption?: string;
  content?: string;
  changes_made: string[];
}

interface CaptionWordAnalysis {
  original: string;
  what_is_working: WorkingElement[];
  what_is_missing: MissingElement[];
  improved_versions: ImprovedCaptionVersion[];
}

interface ContentWordAnalysis {
  original: string;
  what_is_working: WorkingElement[];
  what_is_missing: MissingElement[];
  improved_versions: ImprovedCaptionVersion[];
}

interface PriorityAction {
  rank: number;
  action: string;
  why: string;
  expected_impact: string;
}

interface CombinedScore {
  score: string;
  summary: string;
  alignment_issue: string;
  top_3_priority_actions: PriorityAction[];
}

interface CaptionContentExplainability {
  caption_word_analysis: CaptionWordAnalysis;
  content_word_analysis: ContentWordAnalysis;
  combined_caption_content_score: CombinedScore;
}

interface Explanation {
  overall_assessment: string;
  performance_level: string;
  improvements: Improvement[];
  caption_advice?: string;
  hashtag_suggestions: string[];
  content_quality_tips?: string[];
  best_posting_time: BestPostingTime;
  platform_specific_tips: (string | PlatformTip)[];
  ad_boost_advice?: string;
  novelty_insight: string | NoveltyInsight;
  caption_analysis?: CaptionAnalysis;
  content_analysis?: ContentAnalysis;
  caption_content_explainability?: CaptionContentExplainability;
  linguistic_analysis?: LinguisticAnalysis;
  psychological_triggers?: PsychologicalTriggers;
  engagement_psychology?: EngagementPsychology;
  peak_times_analysis?: PeakTimesAnalysis;
}

// ── SHAP / LIME types ─────────────────────────────────────────────────────────

interface SHAPFeature {
  feature: string;
  label: string;
  display_value: string;
  shap_value: number;
  direction: 'positive' | 'negative';
  importance_pct: number;
}

interface LIMENumericFeature {
  feature_range: string;
  label: string;
  weight: number;
  direction: 'positive' | 'negative';
  importance_pct: number;
}

interface LIMETextWord {
  word: string;
  weight: number;
  direction: 'positive' | 'negative';
  importance_pct: number;
}

interface ConcordanceEntry {
  agree: boolean;
  shap_top: string;
  lime_top: string;
  message: string;
}

interface ShapLimeData {
  shap_numeric:   Record<string, SHAPFeature[]>;
  lime_numeric:   Record<string, LIMENumericFeature[]>;
  lime_text:      Record<string, LIMETextWord[]>;
  summaries:      Record<string, string>;
  concordance:    Record<string, ConcordanceEntry>;
  feature_labels: Record<string, string>;
  target_labels:  Record<string, string>;
  targets:        string[];
  method_notes:   Record<string, string>;
}

type ShapLimeTab = 'shap' | 'lime' | 'text';

// ─────────────────────────────────────────────────────────────────────────────

const METRIC_TARGETS = ['likes', 'comments', 'shares', 'clicks', 'timing_quality_score'] as const;
const METRIC_LABELS: Record<string, string> = {
  likes: 'Likes', comments: 'Comments', shares: 'Shares',
  clicks: 'Clicks', timing_quality_score: 'Timing',
};

const badgeClass: Record<string, string> = {
  Low: styles.badgeLow,
  Moderate: styles.badgeModerate,
  Good: styles.badgeGood,
  Excellent: styles.badgeExcellent,
};

/** Returns true if the stored explanation is just the error fallback — not real data */
function isErrorFallback(exp: Record<string, unknown> | null | undefined): boolean {
  if (!exp) return false;
  const assessment = (exp as unknown as Explanation).overall_assessment;
  return typeof assessment === 'string' && assessment.includes('temporarily unavailable');
}

export default function ExplainabilityPanel({ prediction, formValues, predictionId, preloadedExplanation }: ExplainabilityPanelProps) {
  // Only use preloaded data if it contains a real (non-fallback) explanation
  const hasRealData = Boolean(preloadedExplanation) && !isErrorFallback(preloadedExplanation);

  const [explanation, setExplanation] = useState<Explanation | null>(
    hasRealData ? (preloadedExplanation as unknown as Explanation) : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (hasRealData) return; // already have real saved explanation
    const controller = new AbortController();
    fetchExplanation(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchExplanation(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CAMPAIGN_API_BASE_URL}/api/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formValues,
          followers: Number(formValues.followers),
          ad_boost: formValues.ad_boost ? 1 : 0,
          ...prediction,
          predictionId: predictionId ?? undefined,
        }),
        signal,
      });
      if (signal?.aborted) return;
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load insights');
      setExplanation(json.explanation);
    } catch (err: unknown) {
      if (signal?.aborted) return; // cancelled by StrictMode cleanup — not a real error
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  const copyHashtag = (tag: string) => {
    navigator.clipboard.writeText(tag).then(() => {
      setCopied(tag);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  if (loading) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle} style={{ margin: 0 }}>Explainability Insights</h2>
        <div className={styles.loadingBox}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Generating expert insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.panel}>
        <h2 className={styles.panelTitle} style={{ margin: 0 }}>Explainability Insights</h2>
        <p className={styles.errorBox}>{error}</p>
        <button
          style={{ fontSize: 12, color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => fetchExplanation()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!explanation) return null;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>Explainability Insights</h2>
          <p className={styles.panelSubtitle}>
            AI-powered recommendations to maximise your post engagement
          </p>
        </div>
        <span className={`${styles.performanceBadge} ${badgeClass[explanation.performance_level] || styles.badgeModerate}`}>
          {explanation.performance_level}
        </span>
      </div>

      {/* Overall assessment */}
      <p className={styles.assessment}>{explanation.overall_assessment}</p>

      {/* ── Linguistic Analysis ──────────────────────────────────────────── */}
      {explanation.linguistic_analysis && (() => {
        const la = explanation.linguistic_analysis!;
        return (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Linguistic Analysis</h3>
            <div className={styles.lingGrid}>
              <div className={styles.lingItem}>
                <span className={styles.lingKey}>Tone</span>
                <span className={styles.lingVal}>{la.tone}</span>
              </div>
              <div className={styles.lingItem}>
                <span className={styles.lingKey}>Sentiment</span>
                <span className={styles.lingVal}>{la.sentiment}</span>
              </div>
              <div className={styles.lingItem}>
                <span className={styles.lingKey}>Readability</span>
                <span className={styles.lingVal}>{la.readability_verdict?.split(' — ')[0] || la.readability_verdict}</span>
              </div>
              <div className={styles.lingItem}>
                <span className={styles.lingKey}>Language Mix</span>
                <span className={styles.lingVal}>{la.language_mix?.split(' — ')[0] || la.language_mix}</span>
              </div>
            </div>
            {la.tone_explanation && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Tone Analysis</p>
                <p className={styles.subCardText}>{la.tone_explanation}</p>
              </div>
            )}
            {la.sentiment_impact && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Sentiment Impact</p>
                <p className={styles.subCardText}>{la.sentiment_impact}</p>
              </div>
            )}
            {la.bilingual_effectiveness && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Bilingual Effectiveness</p>
                <p className={styles.subCardText}>{la.bilingual_effectiveness}</p>
              </div>
            )}
            {la.keyword_density && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Keyword Themes</p>
                <p className={styles.subCardText}>{la.keyword_density}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Psychological Triggers ─────────────────────────────────────────── */}
      {explanation.psychological_triggers && (() => {
        const pt = explanation.psychological_triggers!;
        return (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Psychological Triggers</h3>
            {pt.present?.length > 0 && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>✓ Active Triggers</p>
                {pt.present.map((t, i) => (
                  <div key={i} className={styles.triggerRow}>
                    <div className={styles.triggerHeader}>
                      <span className={styles.triggerName}>{t.trigger}</span>
                      <span className={`${styles.strengthBadge} ${t.strength === 'Strong' ? styles.strengthStrong : t.strength === 'Moderate' ? styles.strengthModerate : styles.strengthWeak}`}>{t.strength}</span>
                    </div>
                    <p className={styles.triggerEvidence}>&ldquo;{t.evidence}&rdquo;</p>
                    <p className={styles.triggerReason}>{t.strength_reason}</p>
                    {t.metric_impact && <span className={styles.impactTag}>{t.metric_impact}</span>}
                  </div>
                ))}
              </div>
            )}
            {pt.missing?.length > 0 && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>✗ Missing Triggers</p>
                {pt.missing.map((m, i) => (
                  <div key={i} className={styles.missingRow}>
                    <div className={styles.missingHeader}>
                      <span className={styles.missingTag}>{m.trigger}</span>
                      <span className={styles.upliftTag}>{m.expected_uplift}</span>
                    </div>
                    <p className={styles.missingReason}>{m.why_it_matters}</p>
                    <div className={styles.exampleBox}>
                      <span className={styles.exampleLabel}>How to add: </span>
                      <span className={styles.exampleText}>{m.how_to_add}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Engagement Psychology ──────────────────────────────────────────── */}
      {explanation.engagement_psychology && (() => {
        const ep = explanation.engagement_psychology!;
        return (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Engagement Psychology</h3>
            {ep.current_motivation && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Current Motivation Activated</p>
                <p className={styles.subCardText}>{ep.current_motivation}</p>
              </div>
            )}
            {ep.friction_points && (
              <div className={styles.frictionBox}>
                <p className={styles.frictionLabel}>Friction Points</p>
                <p className={styles.frictionText}>{ep.friction_points}</p>
              </div>
            )}
            {ep.desired_action && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Desired Action Clarity</p>
                <p className={styles.subCardText}>{ep.desired_action}</p>
              </div>
            )}
            {ep.cognitive_load && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Cognitive Load</p>
                <p className={styles.subCardText}>{ep.cognitive_load}</p>
              </div>
            )}
            {ep.emotional_hook && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Emotional Hook</p>
                <p className={styles.subCardText}>{ep.emotional_hook}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Per-metric improvements */}
      {explanation.improvements && explanation.improvements.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>How to Improve Each Metric</h3>
          {explanation.improvements.map((imp, i) => (
            <div key={i} className={styles.improvementCard}>
              <div className={styles.improvementHeader}>
                <span className={styles.improvementMetric}>{imp.metric}</span>
                <span className={styles.improvementScore}>Current: {imp.current_score}</span>
              </div>
              {imp.root_cause && (
                <div className={styles.rootCauseBox}>
                  <span className={styles.rootCauseLabel}>Root Cause: </span>
                  <span className={styles.rootCauseText}>{imp.root_cause}</span>
                </div>
              )}
              <ul className={styles.tipList}>
                {imp.improvement_tips?.map((tip, j) => (
                  <li key={j} className={styles.tipItem}>
                    <span className={styles.tipDot} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Caption advice */}
      {explanation.caption_advice && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Caption Recommendations</h3>
          <p className={styles.adviceText}>{explanation.caption_advice}</p>
        </div>
      )}

      {/* ── Caption & Content Explainability ───────────────────────────── */}

      {/* Caption Analysis */}
      {explanation.caption_analysis && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Caption Analysis
            <span className={styles.scoreTag}>{explanation.caption_analysis.score}</span>
          </h3>

          {/* Strengths */}
          {explanation.caption_analysis.strengths?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>✓ What's Working</p>
              <ul className={styles.tipList}>
                {explanation.caption_analysis.strengths.map((s, i) => (
                  <li key={i} className={styles.tipItem}>
                    <span className={`${styles.tipDot} ${styles.tipDotGreen}`} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {explanation.caption_analysis.weaknesses?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>✗ What's Missing</p>
              <ul className={styles.tipList}>
                {explanation.caption_analysis.weaknesses.map((w, i) => (
                  <li key={i} className={styles.tipItem}>
                    <span className={`${styles.tipDot} ${styles.tipDotOrange}`} />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rewritten caption */}
          {explanation.caption_analysis.rewritten_caption && (
            <div className={styles.rewrittenBox}>
              <p className={styles.rewrittenLabel}>Improved Caption</p>
              <p className={styles.rewrittenText}>&ldquo;{explanation.caption_analysis.rewritten_caption}&rdquo;</p>
            </div>
          )}

          {/* Structural Scoring */}
          {explanation.caption_analysis.structural_scoring && (() => {
            const ss = explanation.caption_analysis!.structural_scoring!;
            const rows: [string, string][] = [
              ['Hook Strength', ss.hook_strength],
              ['CTA Clarity', ss.cta_clarity],
              ['Emoji Usage', ss.emoji_usage],
              ['Urgency Level', ss.urgency_level],
              ['Question Engagement', ss.question_engagement],
              ['Hashtag Placement', ss.hashtag_placement],
            ];
            return (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Structural Scoring</p>
                {rows.filter(([, v]) => v).map(([label, val], i) => (
                  <div key={i} className={styles.scoringRow}>
                    <span className={styles.scoringLabel}>{label}</span>
                    <span className={styles.scoringVal}>{val}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Language effectiveness */}
          {explanation.caption_analysis.language_effectiveness && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>Bilingual / Language Effectiveness</p>
              <p className={styles.subCardText}>{explanation.caption_analysis.language_effectiveness}</p>
            </div>
          )}
        </div>
      )}

      {/* Content Analysis */}
      {explanation.content_analysis && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Content Analysis
            <span className={styles.scoreTag}>{explanation.content_analysis.score}</span>
          </h3>

          {explanation.content_analysis.current_length_verdict && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>Length Verdict</p>
              <p className={styles.subCardText}>{explanation.content_analysis.current_length_verdict}</p>
            </div>
          )}

          {explanation.content_analysis.storytelling_analysis && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>Storytelling Analysis</p>
              <p className={styles.subCardText}>{explanation.content_analysis.storytelling_analysis}</p>
            </div>
          )}

          {explanation.content_analysis.value_proposition && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>Value Proposition</p>
              <p className={styles.subCardText}>{explanation.content_analysis.value_proposition}</p>
            </div>
          )}

          {explanation.content_analysis.visual_content_recommendation && (
            <div className={styles.rewrittenBox}>
              <p className={styles.rewrittenLabel}>Visual Content Recommendation</p>
              <p className={styles.rewrittenText}>{explanation.content_analysis.visual_content_recommendation}</p>
            </div>
          )}

          {explanation.content_analysis.improvement_tips?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>Improvement Tips</p>
              <ul className={styles.tipList}>
                {explanation.content_analysis.improvement_tips.map((tip, i) => (
                  <li key={i} className={styles.tipItem}>
                    <span className={styles.tipDot} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Caption Deep Dive */}
      {explanation.caption_content_explainability?.caption_word_analysis && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Caption Deep Dive</h3>

          {/* Original */}
          <div className={styles.originalBox}>
            <span className={styles.originalLabel}>Original Caption</span>
            <span className={styles.originalText}>&ldquo;{explanation.caption_content_explainability.caption_word_analysis.original}&rdquo;</span>
          </div>

          {/* What's working */}
          {explanation.caption_content_explainability.caption_word_analysis.what_is_working?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>✓ Effective Elements</p>
              {explanation.caption_content_explainability.caption_word_analysis.what_is_working.map((el, i) => (
                <div key={i} className={styles.elementRow}>
                  <p className={styles.elementPhrase}>&ldquo;{el.element}&rdquo;</p>
                  <p className={styles.elementReason}>{el.why_it_works}</p>
                  {el.impact && <span className={styles.impactTag}>{el.impact}</span>}
                </div>
              ))}
            </div>
          )}

          {/* What's missing */}
          {explanation.caption_content_explainability.caption_word_analysis.what_is_missing?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>✗ Missing Elements</p>
              {explanation.caption_content_explainability.caption_word_analysis.what_is_missing.map((m, i) => (
                <div key={i} className={styles.missingRow}>
                  <div className={styles.missingHeader}>
                    <span className={styles.missingTag}>{m.missing_element}</span>
                    <span className={styles.upliftTag}>{m.expected_uplift}</span>
                  </div>
                  <p className={styles.missingReason}>{m.why_add_it}</p>
                  {m.example && (
                    <div className={styles.exampleBox}>
                      <span className={styles.exampleLabel}>Example: </span>
                      <span className={styles.exampleText}>{m.example}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Improved versions */}
          {explanation.caption_content_explainability.caption_word_analysis.improved_versions?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>Improved Versions</p>
              {explanation.caption_content_explainability.caption_word_analysis.improved_versions.map((v, i) => (
                <div key={i} className={styles.versionCard}>
                  <p className={styles.versionLabel}>{v.version_label}</p>
                  <p className={styles.versionCaption}>&ldquo;{v.caption || v.content}&rdquo;</p>
                  {v.changes_made?.length > 0 && (
                    <ul className={styles.changesList}>
                      {v.changes_made.map((c, j) => (
                        <li key={j} className={styles.changesItem}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content Deep Dive */}
      {explanation.caption_content_explainability?.content_word_analysis && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Content Deep Dive</h3>

          {/* Original */}
          <div className={styles.originalBox}>
            <span className={styles.originalLabel}>Original Content</span>
            <span className={styles.originalText}>&ldquo;{explanation.caption_content_explainability.content_word_analysis.original}&rdquo;</span>
          </div>

          {/* What's working */}
          {explanation.caption_content_explainability.content_word_analysis.what_is_working?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>✓ Effective Elements</p>
              {explanation.caption_content_explainability.content_word_analysis.what_is_working.map((el, i) => (
                <div key={i} className={styles.elementRow}>
                  <p className={styles.elementPhrase}>&ldquo;{el.element}&rdquo;</p>
                  <p className={styles.elementReason}>{el.why_it_works}</p>
                  {el.impact && <span className={styles.impactTag}>{el.impact}</span>}
                </div>
              ))}
            </div>
          )}

          {/* What's missing */}
          {explanation.caption_content_explainability.content_word_analysis.what_is_missing?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>✗ Missing Elements</p>
              {explanation.caption_content_explainability.content_word_analysis.what_is_missing.map((m, i) => (
                <div key={i} className={styles.missingRow}>
                  <div className={styles.missingHeader}>
                    <span className={styles.missingTag}>{m.missing_element}</span>
                    <span className={styles.upliftTag}>{m.expected_uplift}</span>
                  </div>
                  <p className={styles.missingReason}>{m.why_add_it}</p>
                  {m.example && (
                    <div className={styles.exampleBox}>
                      <span className={styles.exampleLabel}>Example: </span>
                      <span className={styles.exampleText}>{m.example}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Improved versions */}
          {explanation.caption_content_explainability.content_word_analysis.improved_versions?.length > 0 && (
            <div className={styles.subCard}>
              <p className={styles.subCardLabel}>Improved Versions</p>
              {explanation.caption_content_explainability.content_word_analysis.improved_versions.map((v, i) => (
                <div key={i} className={styles.versionCard}>
                  <p className={styles.versionLabel}>{v.version_label}</p>
                  <p className={styles.versionCaption}>&ldquo;{v.caption || v.content}&rdquo;</p>
                  {v.changes_made?.length > 0 && (
                    <ul className={styles.changesList}>
                      {v.changes_made.map((c, j) => (
                        <li key={j} className={styles.changesItem}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Combined Caption + Content Score */}
      {explanation.caption_content_explainability?.combined_caption_content_score && (() => {
        const combined = explanation.caption_content_explainability!.combined_caption_content_score;
        return (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Caption &amp; Content Combined Score
              <span className={styles.scoreTag}>{combined.score}</span>
            </h3>

            {combined.summary && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Overall Verdict</p>
                <p className={styles.subCardText}>{combined.summary}</p>
              </div>
            )}

            {combined.alignment_issue && (
              <div className={styles.alignmentBox}>
                <p className={styles.alignmentLabel}>Alignment Check</p>
                <p className={styles.alignmentText}>{combined.alignment_issue}</p>
              </div>
            )}

            {combined.top_3_priority_actions?.length > 0 && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Top Priority Actions</p>
                {combined.top_3_priority_actions.map((act, i) => (
                  <div key={i} className={styles.priorityRow}>
                    <span className={styles.priorityRank}>#{act.rank}</span>
                    <div className={styles.priorityContent}>
                      <p className={styles.priorityAction}>{act.action}</p>
                      <p className={styles.priorityWhy}>{act.why}</p>
                      <span className={styles.upliftTag}>{act.expected_impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Hashtag suggestions */}
      {explanation.hashtag_suggestions && explanation.hashtag_suggestions.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Suggested Hashtags <span style={{ color: '#4b5563', fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(click to copy)</span></h3>
          <div className={styles.hashtagGrid}>
            {explanation.hashtag_suggestions.map((tag, i) => (
              <span
                key={i}
                className={styles.hashtag}
                onClick={() => copyHashtag(tag)}
                title="Click to copy"
              >
                {copied === tag ? '✓ Copied' : tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Best posting time — use rich peak_times_analysis if available */}
      {(explanation.peak_times_analysis || explanation.best_posting_time) && (() => {
        const pta = explanation.peak_times_analysis;
        const bpt = explanation.best_posting_time;
        const days = pta?.recommended_days || bpt?.recommended_days;
        const hours = pta?.recommended_hours || bpt?.recommended_hours;
        return (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Best Posting Window</h3>
            <div className={styles.timeCard}>
              <div className={styles.timeRow}>
                <span className={styles.timeKey}>Days</span>
                <span className={styles.timeValue}>{days?.join(', ')}</span>
              </div>
              <div className={styles.timeRow}>
                <span className={styles.timeKey}>Hours</span>
                <span className={styles.timeValue}>{hours}</span>
              </div>
              {(pta?.why_these_days || bpt?.reasoning) && (
                <div className={styles.timeRow}>
                  <span className={styles.timeKey}>Why Days</span>
                  <span className={styles.timeValue}>{pta?.why_these_days || bpt?.reasoning}</span>
                </div>
              )}
              {pta?.why_these_hours && (
                <div className={styles.timeRow}>
                  <span className={styles.timeKey}>Why Hours</span>
                  <span className={styles.timeValue}>{pta.why_these_hours}</span>
                </div>
              )}
            </div>
            {pta?.missed_opportunity_cost && (
              <div className={styles.frictionBox}>
                <p className={styles.frictionLabel}>Missed Opportunity Cost</p>
                <p className={styles.frictionText}>{pta.missed_opportunity_cost}</p>
              </div>
            )}
            {pta?.current_vs_optimal && (
              <div className={styles.subCard}>
                <p className={styles.subCardLabel}>Current vs Optimal Schedule</p>
                <p className={styles.subCardText}>{pta.current_vs_optimal}</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Content quality tips */}
      {explanation.content_quality_tips && explanation.content_quality_tips.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Content Quality Tips</h3>
          <ul className={styles.bulletList}>
            {explanation.content_quality_tips.map((tip, i) => (
              <li key={i} className={styles.bulletItem}>
                <span className={styles.bulletNumber}>{i + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Platform-specific tips — handles both string[] and PlatformTip[] */}
      {explanation.platform_specific_tips && explanation.platform_specific_tips.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Platform-Specific Tips</h3>
          {explanation.platform_specific_tips.map((tip, i) => {
            if (typeof tip === 'string') {
              return (
                <div key={i} className={styles.platformTipCard}>
                  <span className={styles.bulletNumber}>{i + 1}</span>
                  <p className={styles.platformTipDetail}>{tip}</p>
                </div>
              );
            }
            const t = tip as PlatformTip;
            return (
              <div key={i} className={styles.platformTipCard}>
                <p className={styles.platformTipTitle}>{t.tip}</p>
                {t.detail && <p className={styles.platformTipDetail}>{t.detail}</p>}
                {t.algorithm_reason && (
                  <div className={styles.algoReasonBox}>
                    <span className={styles.algoReasonLabel}>Algorithm Mechanism: </span>
                    <span className={styles.algoReasonText}>{t.algorithm_reason}</span>
                  </div>
                )}
                {t.implementation && (
                  <div className={styles.exampleBox}>
                    <span className={styles.exampleLabel}>How to implement: </span>
                    <span className={styles.exampleText}>{t.implementation}</span>
                  </div>
                )}
                {t.expected_impact && <span className={styles.upliftTag}>{t.expected_impact}</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Ad boost advice */}
      {explanation.ad_boost_advice && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Ad Boost Strategy</h3>
          <p className={styles.adviceText}>{explanation.ad_boost_advice}</p>
        </div>
      )}

      {/* Novelty insight — handles both string and object */}
      {explanation.novelty_insight && (() => {
        const ni = explanation.novelty_insight;
        if (typeof ni === 'string') {
          return (
            <div className={styles.noveltyBox}>
              <p className={styles.noveltyLabel}>Research Insight</p>
              <p className={styles.noveltyText}>{ni}</p>
            </div>
          );
        }
        const n = ni as NoveltyInsight;
        return (
          <div className={styles.noveltyBox}>
            <p className={styles.noveltyLabel}>Insight</p>
            {n.insight && <p className={styles.noveltyText}>{n.insight}</p>}
            {n.research_basis && (
              <div style={{ marginTop: 10 }}>
                <p className={styles.noveltySubLabel}>Basis</p>
                <p className={styles.noveltySubText}>{n.research_basis}</p>
              </div>
            )}
            {n.application && (
              <div style={{ marginTop: 8 }}>
                <p className={styles.noveltySubLabel}>Application to This Post</p>
                <p className={styles.noveltySubText}>{n.application}</p>
              </div>
            )}
            {n.competitive_advantage && (
              <div style={{ marginTop: 8 }}>
                <p className={styles.noveltySubLabel}>Competitive Advantage</p>
                <p className={styles.noveltySubText}>{n.competitive_advantage}</p>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
