/**
 * Content API Service
 * Connects Research Frontend (Next.js) to Content Generator Backend (FastAPI)
 */

// API Base URL from environment variable
const API_BASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CONTENT_API_URL) || 'http://localhost:8000';

// Type Definitions
export interface GenerateTextRequest {
  product_name: string;
  description?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'luxurious';
  language?: 'english' | 'sinhala' | 'both';
}

export interface GenerateSmartPosterRequest {
  product_name: string;
  description?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'luxurious';
  language?: 'english' | 'sinhala' | 'both';
  season?: string;
  discount?: string;
  business_name?: string;
  phone_number?: string;
  tags?: string[];
  size?: 'facebook' | 'instagram' | 'story' | 'twitter';
  pipeline?: 'gemini+harfbuzz' | 'finetuned+pillow' | '';
}

export interface TextResponse {
  product_name: string;
  content: string;
  language: string;
  model_used: string;
  polished: boolean;
}

export interface PosterResponse {
  product_name: string;
  content: string;
  language: string;
  model_used?: string;
  polished?: boolean;
  poster_path: string;
  poster_url?: string;
  background_path?: string;
  season_detected?: string;
  background_generated?: boolean;
  pipeline?: string;
  shaping_info?: {
    has_sinhala: boolean;
    rakaransaya_count: number;
    yansaya_count: number;
    zwj_count: number;
    nfc_normalized: boolean;
  };
  hashtags?: string[];
  gpt2_draft?: string;
  gemini_polished?: string;
  context?: Record<string, string>;
}

export interface HealthResponse {
  status: string;
  version?: string;
  models_loaded?: {
    content_generator: boolean;
    gemini_generator: boolean;
    image_generator: boolean;
    gemini_polisher: boolean;
    sinhala_engine: boolean;
    html_renderer: boolean;
  };
  components?: {
    content_generator: boolean;
    gemini_polish: boolean;
    stability_backgrounds: boolean;
    image_generator: boolean;
  };
  config: {
    use_finetuned: boolean;
    use_gemini_generation?: boolean;
    use_html_rendering?: boolean;
    use_gemini_polish: boolean;
    use_stability_backgrounds?: boolean;
    use_image_ai?: boolean;
  };
  pipeline?: {
    active: string;
    text_generation: string;
    sinhala_shaping: string;
    poster_rendering: string;
    polish: string;
    backgrounds: string;
  };
}

/**
 * Generate text-only content
 */
export async function generateText(data: GenerateTextRequest): Promise<TextResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate_text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
}

/**
 * Generate smart poster with contextual background + text overlay
 */
export async function generateSmartPoster(data: GenerateSmartPosterRequest): Promise<PosterResponse> {
  try {
    console.log('Sending request to backend:', data);
    
    const response = await fetch(`${API_BASE_URL}/api/generate-smart-poster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      
      let errorDetail;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorText;
      } catch {
        errorDetail = errorText;
      }
      
      throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating smart poster:', error);
    throw error;
  }
}

/**
 * Generate poster with uploaded/provided image
 */
export async function generateWithImage(
  data: GenerateTextRequest & { image_url?: string }
): Promise<PosterResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-with-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating with image:', error);
    throw error;
  }
}

/**
 * Get full URL for a poster image
 */
export function getPosterUrl(posterPath: string): string {
  const cleanPath = posterPath.startsWith('/') ? posterPath.substring(1) : posterPath;
  return `${API_BASE_URL}/${cleanPath}`;
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking backend health:', error);
    throw error;
  }
}

/**
 * Helper to build description from tags and discount
 */
export function buildDescription(params: {
  discount?: string;
  tags?: string[];
  season?: string;
}): string {
  const parts: string[] = [];
  
  if (params.discount) {
    parts.push(params.discount);
  }
  
  if (params.season && params.season !== 'No specific season') {
    parts.push(`${params.season} special`);
  }
  
  if (params.tags && params.tags.length > 0) {
    const tagLabels = params.tags.map(tag => 
      tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    parts.push(tagLabels.join(', '));
  }
  
  return parts.join(' - ') || 'Quality product';
}

/**
 * Map frontend tone to backend tone
 */
export function mapTone(tags: string[]): 'professional' | 'casual' | 'friendly' | 'urgent' | 'luxurious' {
  if (tags.includes('premium-quality') || tags.includes('limited-stock')) {
    return 'luxurious';
  }
  if (tags.includes('fast-delivery')) {
    return 'urgent';
  }
  if (tags.includes('eco-friendly') || tags.includes('family-friendly')) {
    return 'friendly';
  }
  return 'professional';
}

export default {
  generateText,
  generateSmartPoster,
  generateWithImage,
  getPosterUrl,
  checkHealth,
  buildDescription,
  mapTone,
};
