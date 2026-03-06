'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type PlatformsPreferences } from '@/types';

interface PlatformsPreferencesStepProps {
  data: Partial<PlatformsPreferences>;
  onDataUpdate: (data: PlatformsPreferences) => void;
}

const PLATFORMS = [
  { name: 'Facebook', description: 'Great for local businesses and community building' },
  { name: 'Instagram', description: 'Visual content, younger audience, stories & reels' },
  { name: 'TikTok', description: 'Short videos, very young audience, viral potential' },
  { name: 'YouTube', description: 'Long-form video content, educational content' },
  { name: 'WhatsApp Business', description: 'Direct customer communication, local markets' },
  { name: 'Google Ads', description: 'Search-based advertising, immediate intent' },
  { name: 'LinkedIn', description: 'B2B networking, professional services' },
  { name: 'Twitter/X', description: 'News, updates, customer service' }
];

const EXPERIENCE_LEVELS = [
  { value: 'none', label: 'No experience' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const BRAND_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FECA57', // Yellow
  '#FF9FF3', // Pink
  '#54A0FF', // Light Blue
  '#5F27CD', // Purple
  '#00D2D3', // Cyan
  '#FF9F43', // Orange
  '#10AC84', // Emerald
  '#EE5A24'  // Orange Red
];

export function PlatformsPreferencesStep({ data, onDataUpdate }: PlatformsPreferencesStepProps) {
  const { register, watch, setValue, getValues, reset } = useForm<PlatformsPreferences>({
    defaultValues: data
  });

  const watchedData = watch();

  useEffect(() => {
    console.log('📥 [PlatformsPreferencesStep] received data:', data);
    reset(data);
  }, [data, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      onDataUpdate(value as PlatformsPreferences);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataUpdate]);

  const handlePlatformExperience = (platform: string, experience: string) => {
    const currentExp = getValues('platformExperience') || {};
    setValue('platformExperience', {
      ...currentExp,
      [platform]: experience as 'none' | 'beginner' | 'intermediate' | 'advanced'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Which platforms would you prefer to focus on? *
        </label>
        <div className="space-y-3">
          {PLATFORMS.map(platform => (
            <label key={platform.name} className="flex items-start p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg hover:border-[#CBD5E1]/20 cursor-pointer transition-all">
              <input
                type="checkbox"
                {...register('preferredPlatforms')}
                value={platform.name}
                className="w-4 h-4 mt-1 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2"
              />
              <div className="ml-3">
                <span className="font-medium text-[#F9FAFB]">{platform.name}</span>
                <p className="text-sm text-[#CBD5E1] mt-1">{platform.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[#F9FAFB] mb-4">
          Platform Experience
        </h3>
        <p className="text-sm text-[#CBD5E1] mb-4">
          For each platform you selected, what's your experience level?
        </p>
        <div className="space-y-4">
          {PLATFORMS.map(platform => (
            <div key={platform.name} className="flex items-center justify-between p-3 bg-[#1F2933] rounded-lg">
              <span className="font-medium text-[#F9FAFB]">{platform.name}</span>
              <div className="flex space-x-2">
                {EXPERIENCE_LEVELS.map(level => (
                  <label key={level.value} className="flex items-center">
                    <input
                      type="radio"
                      name={`experience-${platform.name}`}
                      value={level.value}
                      onChange={(e) => handlePlatformExperience(platform.name, e.target.value)}
                      className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 focus:ring-[#22C55E] focus:ring-2"
                    />
                    <span className="ml-1 text-xs text-[#CBD5E1]">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[#F9FAFB] mb-4">
          Brand Assets
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
            <input
              type="checkbox"
              {...register('brandAssets.hasLogo')}
              className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2"
            />
            <span className="ml-3 text-[#F9FAFB]">I have a business logo</span>
          </label>
          
          <label className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
            <input
              type="checkbox"
              {...register('brandAssets.hasBrandStyle')}
              className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2"
            />
            <span className="ml-3 text-[#F9FAFB]">I have established brand style guidelines</span>
          </label>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[#F9FAFB] mb-3">
            Brand Colors (Select up to 3)
          </label>
          <div className="grid grid-cols-6 gap-2">
            {BRAND_COLORS.map(color => (
              <label key={color} className="flex items-center justify-center">
                <input
                  type="checkbox"
                  {...register('brandAssets.brandColors')}
                  value={color}
                  className="sr-only"
                />
                <div 
                  className="w-8 h-8 rounded-full border-2 border-[#1F2933] shadow-md cursor-pointer hover:scale-110 transition-transform hover:border-[#CBD5E1]"
                  style={{ backgroundColor: color }}
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-[#CBD5E1]/60 mt-3">
            Choose colors that represent your brand
          </p>
        </div>
      </div>
    </div>
  );
}