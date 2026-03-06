'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  FlagIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  listSMEProfiles,
  getSMEProfile,
  updateSMEProfile,
  type SavedSMEProfile,
} from '@/services/smeProfileService';

type EditableField = {
  key: keyof SavedSMEProfile;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'tags' | 'number';
  options?: string[];
};

const BUSINESS_SECTIONS: {
  title: string;
  icon: React.ElementType;
  fields: EditableField[];
}[] = [
  {
    title: 'Business Info',
    icon: BuildingOfficeIcon,
    fields: [
      { key: 'business_type', label: 'Business Type', type: 'text' },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'business_size', label: 'Business Size', type: 'select', options: ['micro', 'small', 'medium', 'large'] },
      { key: 'business_stage', label: 'Stage', type: 'select', options: ['new', 'growing', 'established'] },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'district', label: 'District', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'products_services', label: 'Products / Services', type: 'text' },
      { key: 'unique_selling_proposition', label: 'What Makes You Special', type: 'text' },
    ],
  },
  {
    title: 'Budget & Team',
    icon: CurrencyDollarIcon,
    fields: [
      { key: 'monthly_budget', label: 'Monthly Budget', type: 'text' },
      { key: 'has_marketing_team', label: 'Has Marketing Team', type: 'boolean' },
      { key: 'team_size', label: 'Team Size', type: 'number' },
    ],
  },
  {
    title: 'Goals',
    icon: FlagIcon,
    fields: [
      { key: 'primary_goal', label: 'Main Goal', type: 'text' },
      { key: 'secondary_goals', label: 'Other Goals', type: 'tags' },
    ],
  },
  {
    title: 'Target Audience',
    icon: UserGroupIcon,
    fields: [
      { key: 'age_range', label: 'Age Range', type: 'text' },
      { key: 'gender', label: 'Gender', type: 'tags' },
      { key: 'income_level', label: 'Income Level', type: 'text' },
      { key: 'target_location', label: 'Target Location', type: 'text' },
      { key: 'interests', label: 'Interests', type: 'tags' },
      { key: 'buying_frequency', label: 'Buying Frequency', type: 'text' },
    ],
  },
  {
    title: 'Platforms',
    icon: DevicePhoneMobileIcon,
    fields: [
      { key: 'preferred_platforms', label: 'Preferred Platforms', type: 'tags' },
      { key: 'current_platforms', label: 'Currently Using', type: 'tags' },
    ],
  },
  {
    title: 'Challenges & Strengths',
    icon: ExclamationTriangleIcon,
    fields: [
      { key: 'challenges', label: 'Challenges', type: 'tags' },
      { key: 'strengths', label: 'Strengths', type: 'tags' },
      { key: 'opportunities', label: 'Opportunities', type: 'tags' },
    ],
  },
];

export default function MyBusinessPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SavedSMEProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    // First try the profile ID saved at generation time
    const meta = localStorage.getItem('strategy_meta');
    let profileId: string | null = null;
    if (meta) {
      try {
        const parsed = JSON.parse(meta);
        profileId = parsed.smeProfileId || null;
      } catch { /* ignore */ }
    }

    if (profileId) {
      const data = await getSMEProfile(profileId);
      if (data) {
        setProfile(data as unknown as SavedSMEProfile);
        setLoading(false);
        return;
      }
    }

    // Fallback: load the most recent profile
    const profiles = await listSMEProfiles(1);
    if (profiles.length > 0) {
      setProfile(profiles[0]);
    }
    setLoading(false);
  }

  function startEdit(field: EditableField) {
    const currentVal = profile?.[field.key];
    setEditingField(field.key);
    if (field.type === 'tags') {
      setEditValue(Array.isArray(currentVal) ? (currentVal as string[]).join(', ') : '');
    } else if (field.type === 'boolean') {
      setEditValue(!!currentVal);
    } else {
      setEditValue(currentVal ?? '');
    }
  }

  async function saveEdit(field: EditableField) {
    if (!profile) return;
    setSaving(true);

    let finalValue: any = editValue;
    if (field.type === 'tags') {
      finalValue = typeof editValue === 'string'
        ? editValue.split(',').map((s: string) => s.trim()).filter(Boolean)
        : editValue;
    } else if (field.type === 'number') {
      finalValue = editValue === '' ? null : Number(editValue);
    }

    const ok = await updateSMEProfile(profile.id, { [field.key]: finalValue } as any);
    if (ok) {
      setProfile({ ...profile, [field.key]: finalValue });
      setSaveSuccess(field.key);
      setTimeout(() => setSaveSuccess(null), 2000);
    }
    setSaving(false);
    setEditingField(null);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue('');
  }

  function renderFieldValue(field: EditableField) {
    const val = profile?.[field.key];

    if (editingField === field.key) {
      if (field.type === 'boolean') {
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditValue(!editValue)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editValue ? 'bg-[#22C55E]' : 'bg-[#2D3748]'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                editValue ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className="text-sm text-[#CBD5E1]">{editValue ? 'Yes' : 'No'}</span>
            <button onClick={() => saveEdit(field)} disabled={saving} className="p-1 text-[#22C55E] hover:bg-[#22C55E]/10 rounded">
              <CheckIcon className="h-4 w-4" />
            </button>
            <button onClick={cancelEdit} className="p-1 text-[#64748B] hover:bg-[#1F2933] rounded">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      }

      if (field.type === 'select') {
        return (
          <div className="flex items-center gap-2">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="bg-[#0B0F14] border border-[#2D3748] text-[#F9FAFB] text-sm rounded-lg px-3 py-1.5 focus:border-[#22C55E] focus:outline-none"
            >
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button onClick={() => saveEdit(field)} disabled={saving} className="p-1 text-[#22C55E] hover:bg-[#22C55E]/10 rounded">
              <CheckIcon className="h-4 w-4" />
            </button>
            <button onClick={cancelEdit} className="p-1 text-[#64748B] hover:bg-[#1F2933] rounded">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit(field);
              if (e.key === 'Escape') cancelEdit();
            }}
            className="bg-[#0B0F14] border border-[#2D3748] text-[#F9FAFB] text-sm rounded-lg px-3 py-1.5 focus:border-[#22C55E] focus:outline-none flex-1 min-w-0"
            autoFocus
            placeholder={field.type === 'tags' ? 'Comma separated values' : ''}
          />
          <button onClick={() => saveEdit(field)} disabled={saving} className="p-1 text-[#22C55E] hover:bg-[#22C55E]/10 rounded shrink-0">
            <CheckIcon className="h-4 w-4" />
          </button>
          <button onClick={cancelEdit} className="p-1 text-[#64748B] hover:bg-[#1F2933] rounded shrink-0">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // Display mode
    if (field.type === 'boolean') {
      return <span className="text-sm text-[#F9FAFB]">{val ? 'Yes' : 'No'}</span>;
    }
    if (field.type === 'tags') {
      const arr = Array.isArray(val) ? (val as string[]) : [];
      if (arr.length === 0) return <span className="text-sm text-[#64748B] italic">Not set</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {arr.map((item) => (
            <span key={item} className="px-2.5 py-1 bg-[#0B0F14] text-[#CBD5E1] rounded-full text-xs border border-[#2D3748]">
              {item}
            </span>
          ))}
        </div>
      );
    }
    if (val == null || val === '') {
      return <span className="text-sm text-[#64748B] italic">Not set</span>;
    }
    return <span className="text-sm text-[#F9FAFB]">{String(val)}</span>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="animate-pulse text-[#CBD5E1]">Loading your business profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <BuildingOfficeIcon className="h-12 w-12 text-[#64748B] mx-auto" />
          <h2 className="text-xl font-semibold text-[#F9FAFB]">No business profile yet</h2>
          <p className="text-[#CBD5E1]">Fill out the form to create your business profile and get a marketing strategy.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#22C55E] text-[#0B0F14] rounded-lg font-medium hover:bg-[#16A34A] transition-all"
          >
            Create Your Profile
          </button>
        </div>
      </div>
    );
  }

  const createdDate = new Date(profile.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const updatedDate = new Date(profile.updated_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-[#1F2933] rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-[#CBD5E1]" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#F9FAFB]">My Business Profile</h1>
              <p className="text-sm text-[#CBD5E1] mt-1">
                Created {createdDate} {updatedDate !== createdDate && `· Last updated ${updatedDate}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-[#0B0F14] text-[#F9FAFB] rounded-lg border border-[#2D3748] hover:border-[#22C55E]/30 transition-all text-sm flex items-center gap-2"
            >
              <SparklesIcon className="h-4 w-4" />
              Fill Form Again
            </button>
          </div>
        </div>

        {/* Business name hero */}
        <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
              <BuildingOfficeIcon className="h-7 w-7 text-[#22C55E]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#F9FAFB]">
                {profile.business_type}{profile.industry ? ` · ${profile.industry}` : ''}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#CBD5E1] flex-wrap">
                {profile.city && <span>{profile.city}{profile.country ? `, ${profile.country}` : ''}</span>}
                {profile.business_size && (
                  <>
                    <span className="text-[#64748B]">•</span>
                    <span className="capitalize">{profile.business_size} business</span>
                  </>
                )}
                {profile.business_stage && (
                  <>
                    <span className="text-[#64748B]">•</span>
                    <span className="capitalize">{profile.business_stage}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tip: click to edit */}
        <p className="text-xs text-[#64748B] flex items-center gap-1.5">
          <PencilIcon className="h-3 w-3" />
          Click the edit icon next to any field to update it
        </p>

        {/* Section cards */}
        {BUSINESS_SECTIONS.map((section) => (
          <div key={section.title} className="bg-[#1F2933] border border-[#2D3748] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#2D3748] flex items-center gap-3">
              <section.icon className="h-5 w-5 text-[#22C55E]" />
              <h3 className="text-sm font-semibold text-[#F9FAFB]">{section.title}</h3>
            </div>
            <div className="divide-y divide-[#2D3748]/50">
              {section.fields.map((field) => (
                <div key={field.key} className="px-5 py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-[#64748B] mb-1">{field.label}</div>
                    {renderFieldValue(field)}
                    {saveSuccess === field.key && (
                      <span className="text-xs text-[#22C55E] mt-1 block">Saved!</span>
                    )}
                  </div>
                  {editingField !== field.key && (
                    <button
                      onClick={() => startEdit(field)}
                      className="p-1.5 text-[#64748B] hover:text-[#F9FAFB] hover:bg-[#0B0F14] rounded-lg transition-colors shrink-0 mt-3"
                      title={`Edit ${field.label}`}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
