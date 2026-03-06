'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type TargetAudience } from '@/types';

interface TargetAudienceStepProps {
  data: Partial<TargetAudience>;
  onDataUpdate: (data: TargetAudience) => void;
}

const AGE_RANGES = [
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  '65+'
];

const GENDERS = [
  'Male',
  'Female',
  'Non-binary',
  'All genders'
];

const INCOME_LEVELS = [
  'Low income (Under LKR 1M annually)',
  'Middle income (LKR 1M-2.5M annually)',
  'Upper middle (LKR 2.5M-5M annually)',
  'High income (LKR 5M+ annually)',
  'Mixed income levels'
];

const COMMON_INTERESTS = [
  'Food & Dining',
  'Fashion & Beauty',
  'Health & Fitness',
  'Technology',
  'Travel',
  'Entertainment',
  'Sports',
  'Home & Garden',
  'Business & Finance',
  'Education',
  'Family & Parenting',
  'Art & Culture'
];

const BUYING_FREQUENCIES = [
  { value: 'rare', label: 'Rare (Few times per year)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' }
];

export function TargetAudienceStep({ data, onDataUpdate }: TargetAudienceStepProps) {
  const { register, watch, setValue, reset } = useForm<TargetAudience>({
    defaultValues: data
  });

  const watchedData = watch();

  // Reset form when data prop changes
  useEffect(() => {
    console.log('📥 TargetAudienceStep received data:', data);
    reset(data);
  }, [data, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      if (value.demographics?.ageRange && value.buyingFrequency) {
        onDataUpdate(value as TargetAudience);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataUpdate]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label htmlFor="ageRange" className="block text-sm font-medium text-[#F9FAFB] mb-3">
            Primary Age Range *
          </label>
          <select
            {...register('demographics.ageRange', { required: true })}
            className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
          >
            <option value="" className="text-[#CBD5E1]">Select age range</option>
            {AGE_RANGES.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="incomeLevel" className="block text-sm font-medium text-[#F9FAFB] mb-3">
            Income Level *
          </label>
          <select
            {...register('demographics.incomeLevel', { required: true })}
            className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
          >
            <option value="" className="text-[#CBD5E1]">Select income level</option>
            {INCOME_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Gender *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {GENDERS.map(gender => (
            <label key={gender} className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
              <input
                type="checkbox"
                {...register('demographics.gender')}
                value={gender}
                className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2"
              />
              <span className="ml-3 text-[#F9FAFB]">{gender}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-[#F9FAFB] mb-3">
          Customer Location *
        </label>
        <input
          type="text"
          {...register('location', { required: true })}
          placeholder="e.g., Local area, nationwide, specific cities"
          className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] placeholder-[#CBD5E1]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Customer Interests *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COMMON_INTERESTS.map(interest => (
            <label key={interest} className="flex items-center p-3 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
              <input
                type="checkbox"
                {...register('interests')}
                value={interest}
                className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2"
              />
              <span className="ml-3 text-sm text-[#F9FAFB]">{interest}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-[#CBD5E1]/60 mt-3">
          Select interests that align with your target customers
        </p>
      </div>

      <div>
        <label htmlFor="buyingFrequency" className="block text-sm font-medium text-[#F9FAFB] mb-3">
          How often do they typically buy your type of product/service? *
        </label>
        <select
          {...register('buyingFrequency', { required: true })}
          className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
        >
          <option value="" className="text-[#CBD5E1]">Select buying frequency</option>
          {BUYING_FREQUENCIES.map(freq => (
            <option key={freq.value} value={freq.value}>{freq.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}