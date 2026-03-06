/**
 * SME Profile persistence service.
 *
 * Saves the submitted form data directly to the `sme_profiles` table
 * in the Supabase database shared with the FastAPI backend.
 * Returns the newly created profile row's UUID so it can be linked to
 * the generated strategy.
 */
import { supabase } from '@/lib/supabaseClient';

export interface SavedSMEProfile {
  id: string;
  created_at: string;
  updated_at: string;
  business_type: string;
  industry: string | null;
  business_size: string | null;
  business_stage: string | null;
  city: string | null;
  district: string | null;
  country: string | null;
  products_services: string | null;
  unique_selling_proposition: string | null;
  monthly_budget: string | null;
  has_marketing_team: boolean;
  team_size: number | null;
  primary_goal: string | null;
  secondary_goals: string[];
  age_range: string | null;
  gender: string[];
  income_level: string | null;
  target_location: string | null;
  interests: string[];
  buying_frequency: string | null;
  preferred_platforms: string[];
  current_platforms: string[];
  challenges: string[];
  strengths: string[];
  opportunities: string[];
  raw_profile_json: Record<string, unknown> | null;
}

/**
 * Persist a completed form submission to Supabase.
 *
 * @param formData  Raw form data object from the 9-step wizard
 * @param rawProfile  The already-built SMEProfile payload (from buildSMEProfile)
 * @returns The newly inserted row's UUID (used to link to strategies)
 */
export async function saveSMEProfile(
  formData: any,
  rawProfile: Record<string, unknown>,
): Promise<string | null> {
  // Extract flat fields for indexed columns (easier to query later)
  const bp = getSection(formData, 'business-profile');
  const br = getSection(formData, 'budget-resources');
  const bg = getSection(formData, 'business-goals');
  const ta = getSection(formData, 'target-audience');
  const pp = getSection(formData, 'platforms-preferences');
  const cc = getSection(formData, 'current-challenges');
  const so = getSection(formData, 'strengths-opportunities');

  const record = {
    // Business identity
    business_type: bp.businessType || null,
    industry: bp.industry || null,
    business_size: bp.businessSize || null,
    business_stage: bp.businessStage || null,
    city: bp.location?.city || null,
    district: bp.location?.district || null,
    country: bp.location?.country || null,
    products_services: bp.productsServices || null,
    unique_selling_proposition: bp.uniqueSellingProposition || null,

    // Budget & team
    monthly_budget: br.monthlyBudget == null ? null : String(br.monthlyBudget),
    has_marketing_team: br.hasMarketingTeam ?? false,
    team_size: br.teamSize || null,

    // Goals
    primary_goal: bg.primaryGoal || null,
    secondary_goals: bg.secondaryGoals || [],

    // Target audience
    age_range: ta.demographics?.ageRange || null,
    gender: ta.demographics?.gender || [],
    income_level: ta.demographics?.incomeLevel || null,
    target_location: ta.location || null,
    interests: ta.interests || [],
    buying_frequency: ta.buyingFrequency || null,

    // Platforms
    preferred_platforms: pp.preferredPlatforms || [],
    current_platforms: pp.preferredPlatforms || [],

    // Challenges & strengths
    challenges: cc.challenges || [],
    strengths: so.strengths || [],
    opportunities: so.opportunities || [],

    // Full snapshot for backend compatibility
    raw_profile_json: rawProfile,
  };

  const { data, error } = await supabase
    .from('sme_profiles')
    .insert(record)
    .select('id')
    .single();

  if (error) {
    console.error('[smeProfileService] Insert failed:', error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Load the most recent SME profiles.
 */
export async function listSMEProfiles(limit = 10): Promise<SavedSMEProfile[]> {
  const { data, error } = await supabase
    .from('sme_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[smeProfileService] Fetch failed:', error.message);
    return [];
  }

  return (data as SavedSMEProfile[]) ?? [];
}

/**
 * Load a single SME profile by ID.
 */
export async function getSMEProfile(id: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('sme_profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[smeProfileService] Get failed:', error.message);
    return null;
  }

  return data;
}
/**
 * Update an existing SME profile row.
 */
export async function updateSMEProfile(
  id: string,
  updates: Partial<Omit<SavedSMEProfile, 'id' | 'created_at' | 'updated_at'>>,
): Promise<boolean> {
  const { error } = await supabase
    .from('sme_profiles')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('[smeProfileService] Update failed:', error.message);
    return false;
  }

  return true;
}
// ── Internal helper (mirrors strategyApiService.ts) ──────────────────────────
function stepKey(stepId: string): string {
  return stepId.replace('-', '');
}

function getSection(formData: any, stepId: string): any {
  return formData[stepKey(stepId)] || {};
}
