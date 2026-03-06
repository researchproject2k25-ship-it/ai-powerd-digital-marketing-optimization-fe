'use client';

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
  onExtracted: (text: string) => void;
}

export default function ImageUpload({ onExtracted }: ImageUploadProps) {
  const inputRef            = useRef<HTMLInputElement>(null);
  const [file, setFile]     = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted]   = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);

  const handleFileSelect = (selected: File) => {
    if (!selected.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WEBP)');
      return;
    }
    setFile(selected);
    setExtracted(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selected);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0];
    if (chosen) handleFileSelect(chosen);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setExtracted(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const extractText = async () => {
    if (!file) return;
    setExtracting(true);
    setError(null);

    try {
      // Read image as a data URL (base64) directly in the browser
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });

      const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
      if (!apiKey) throw new Error('Groq API key not set. Add NEXT_PUBLIC_GROQ_API_KEY to .env.local');

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text:
                    'You are an expert OCR assistant. Extract ALL visible text from this image exactly as it appears. ' +
                    'The text may be in Sinhala, English, or a mix of both. ' +
                    'Return the extracted text as a single paragraph in reading order. ' +
                    'Do NOT add any commentary, labels, or formatting — only the raw extracted text. ' +
                    'If no text is visible in the image, return exactly: "No text detected."',
                },
                {
                  type: 'image_url',
                  image_url: { url: dataUrl },
                },
              ],
            },
          ],
          temperature: 0,
          max_tokens: 2048,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error?.message || `Groq API error: ${res.status}`;
        throw new Error(msg);
      }

      const rawText: string = data?.choices?.[0]?.message?.content ?? '';
      const cleaned = rawText.replace(/\r?\n+/g, ' ').replace(/\s{2,}/g, ' ').trim() || 'No text detected.';

      setExtracted(cleaned);
      onExtracted(cleaned);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      setError(message);
    } finally {
      setExtracting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.uploadWrapper}>
      {!file ? (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {/* Image / landscape icon */}
          <svg className={styles.dropIcon} width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={1.5} />
            <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M21 15l-5-5L5 21" />
          </svg>
          <p className={styles.dropTitle}>Upload Content Image</p>
          <p className={styles.dropSubtitle}>Drag &amp; drop or click to browse</p>
          <p className={styles.dropSubtitle}>Supports JPEG, PNG, WEBP · Max 10 MB</p>
          <p className={styles.dropHint}>Text in Sinhala or English will be extracted automatically</p>
        </div>
      ) : (
        <div className={styles.previewRow}>
          {preview && (
            <img src={preview} alt="preview" className={styles.previewImage} />
          )}
          <div className={styles.previewInfo}>
            <p className={styles.previewName}>{file.name}</p>
            <p className={styles.previewSize}>{formatBytes(file.size)}</p>
          </div>
          <button className={styles.clearBtn} onClick={clearFile} type="button">
            Remove
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleChange}
      />

      {file && (
        <button
          className={styles.extractBtn}
          onClick={extractText}
          disabled={extracting}
          type="button"
        >
          {extracting ? (
            <>
              <span className={styles.spinner} />
              Extracting text...
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
              </svg>
              Extract Text from Image
            </>
          )}
        </button>
      )}

      {extracted && (
        <div className={styles.extractedPreview}>
          <p className={styles.extractedLabel}>Extracted Content</p>
          <p style={{ margin: 0 }}>{extracted}</p>
        </div>
      )}

      {error && <p className={styles.extractError}>{error}</p>}
    </div>
  );
}
