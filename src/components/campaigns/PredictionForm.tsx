'use client';

import { useState, useCallback } from 'react';
import styles from './PredictionForm.module.css';
import ImageUpload from './ImageUpload';

export interface FormValues {
  caption: string;
  content: string;
  platform: string;
  post_date: string;
  post_time: string;
  followers: string;
  ad_boost: boolean;
}

export interface PredictionOutput {
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  timing_quality_score: number;
}

interface PredictionFormProps {
  onResult: (result: PredictionOutput, formValues: FormValues, id: string | null) => void;
  onLoading: (loading: boolean) => void;
  loading: boolean;
}

const PLATFORMS = ['Facebook', 'Instagram', 'TikTok', 'Twitter', 'YouTube'];

const today = new Date().toISOString().split('T')[0];

export default function PredictionForm({ onResult, onLoading, loading }: PredictionFormProps) {
  const [form, setForm] = useState<FormValues>({
    caption: '',
    content: '',
    platform: 'Facebook',
    post_date: today,
    post_time: '',
    followers: '',
    ad_boost: false,
  });
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormValues, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleExtracted = useCallback((text: string) => {
    set('content', text);
  }, []);

  const isValid =
    form.caption.trim() !== '' &&
    form.platform.trim() !== '' &&
    form.post_date.trim() !== '' &&
    form.post_time.trim() !== '' &&
    form.followers.trim() !== '' &&
    Number(form.followers) > 0;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setError(null);
    onLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          followers: Number(form.followers),
          ad_boost: form.ad_boost ? 1 : 0,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Prediction failed');
      onResult(json.prediction, form, json.id ?? null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Prediction failed';
      setError(message);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className={styles.formWrapper}>
      {/* Badge */}
      <div className={styles.modelBadge}>
        <span className={styles.modelBadgeDot} />
        ENGAGEMENT PREDICTION
      </div>

      {/* Caption */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          CAPTION <span className={styles.required}>*</span>
        </label>
        <textarea
          className={styles.textarea}
          rows={4}
          placeholder="Write an engaging caption for your post..."
          value={form.caption}
          onChange={(e) => set('caption', e.target.value)}
          maxLength={500}
        />
      </div>

      {/* Image upload for content extraction */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>UPLOAD IMAGE (AUTO-EXTRACTS CONTENT TEXT)</label>
        <ImageUpload onExtracted={handleExtracted} />
      </div>

      {/* Content */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          CONTENT <span className={styles.required}>*</span>
          <span className={styles.labelNote}>(auto-filled from image, or type manually)</span>
        </label>
        <textarea
          className={styles.textarea}
          rows={4}
          placeholder="Content text of your post or image..."
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
        />
      </div>

      {/* Platform */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          PLATFORM <span className={styles.required}>*</span>
        </label>
        <div className={styles.pillGroup}>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pillBtn} ${form.platform === p ? styles.pillBtnActive : ''}`}
              onClick={() => set('platform', p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Post Date & Time */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            POST DATE <span className={styles.required}>*</span>
          </label>
          <input
            type="date"
            className={styles.input}
            value={form.post_date}
            onChange={(e) => set('post_date', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            POST TIME <span className={styles.required}>*</span>
          </label>
          <input
            type="time"
            className={styles.input}
            value={form.post_time}
            onChange={(e) => set('post_time', e.target.value)}
          />
        </div>
      </div>

      {/* Followers & Ad Boost */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            FOLLOWERS <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            className={styles.input}
            placeholder="e.g. 1000"
            min={0}
            value={form.followers}
            onChange={(e) => set('followers', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label}>
            AD BOOST <span className={styles.required}>*</span>
          </label>
          <div className={styles.segmentedGroup}>
            <button
              type="button"
              className={`${styles.segmentBtn} ${!form.ad_boost ? styles.segmentBtnActive : ''}`}
              onClick={() => set('ad_boost', false)}
            >
              No Boost
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${form.ad_boost ? styles.segmentBtnActive : ''}`}
              onClick={() => set('ad_boost', true)}
            >
              Boosted
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
      )}

      <button
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!isValid || loading}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            Analysing...
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Predict Performance
          </>
        )}
      </button>
    </div>
  );
}
