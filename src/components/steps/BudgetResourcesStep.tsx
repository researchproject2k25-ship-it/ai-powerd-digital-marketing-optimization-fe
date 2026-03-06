'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type MarketingBudgetResources } from '@/types';

interface BudgetResourcesStepProps {
  data: Partial<MarketingBudgetResources>;
  onDataUpdate: (data: MarketingBudgetResources) => void;
}

const BUDGET_RANGES = [
  'Under LKR 50,000/month',
  'LKR 50,000 - 100,000/month',
  'LKR 100,000 - 250,000/month',
  'LKR 250,000 - 500,000/month',
  'LKR 500,000 - 1,000,000/month',
  'Over LKR 1,000,000/month'
];

const CONTENT_CAPACITIES = [
  'Professional photography',
  'Video creation',
  'Graphic design',
  'Content writing',
  'Social media management',
  'No content creation capacity'
];

export function BudgetResourcesStep({ data, onDataUpdate }: BudgetResourcesStepProps) {
  const { register, watch, setValue, handleSubmit, reset } = useForm<MarketingBudgetResources>({
    defaultValues: data
  });

  const watchedData = watch();
  const hasMarketingTeam = watch('hasMarketingTeam');

  useEffect(() => {
    console.log('📥 [BudgetResourcesStep] received data:', data);
    reset(data);
  }, [data, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      if (value.monthlyBudget) {
        onDataUpdate(value as MarketingBudgetResources);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataUpdate]);

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="monthlyBudget" className="block text-sm font-medium text-[#F9FAFB] mb-3">
          Monthly Marketing Budget *
        </label>
        <select
          {...register('monthlyBudget', { required: true })}
          className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
        >
          <option value="" className="text-[#CBD5E1]">Select budget range</option>
          {BUDGET_RANGES.map(range => (
            <option key={range} value={range}>{range}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Do you have a marketing team? *
        </label>
        <div className="space-y-3">
          <label className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
            <input
              type="radio"
              {...register('hasMarketingTeam', { required: true })}
              value="true"
              className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 focus:ring-[#22C55E] focus:ring-2"
            />
            <span className="ml-3 text-[#F9FAFB]">Yes, we have a marketing team</span>
          </label>
          <label className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
            <input
              type="radio"
              {...register('hasMarketingTeam', { required: true })}
              value="false"
              className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 focus:ring-[#22C55E] focus:ring-2"
            />
            <span className="ml-3 text-[#F9FAFB]">No, I handle marketing myself</span>
          </label>
        </div>
      </div>

      {hasMarketingTeam === 'true' && (
        <div>
          <label htmlFor="teamSize" className="block text-sm font-medium text-[#F9FAFB] mb-3">
            Team Size
          </label>
          <input
            type="number"
            {...register('teamSize', { min: 1, max: 100 })}
            placeholder="Number of people in marketing team"
            className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] placeholder-[#CBD5E1]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
            min="1"
            max="100"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Content Creation Capacity *
        </label>
        <div className="space-y-3">
          {CONTENT_CAPACITIES.map(capacity => (
            <label key={capacity} className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
              <input
                type="checkbox"
                {...register('contentCreationCapacity')}
                value={capacity}
                className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2"
              />
              <span className="ml-3 text-[#F9FAFB]">{capacity}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-[#CBD5E1]/60 mt-3">
          Select all that apply to your business
        </p>
      </div>
    </div>
  );
}