'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type CurrentChallenges } from '@/types';

interface CurrentChallengesStepProps {
  data: Partial<CurrentChallenges>;
  onDataUpdate: (data: CurrentChallenges) => void;
}

const COMMON_CHALLENGES = [
  {
    id: 'low-reach',
    title: 'Low Reach',
    description: 'Not enough people seeing my content or ads'
  },
  {
    id: 'low-conversion',
    title: 'Low Conversion',
    description: 'People see my content but don\'t take action'
  },
  {
    id: 'content-creation',
    title: 'Cannot Create Content',
    description: 'Struggle with creating engaging posts, videos, or images'
  },
  {
    id: 'competitor-pressure',
    title: 'Competitor Pressure',
    description: 'Competitors are getting more attention than me'
  },
  {
    id: 'inconsistent-posting',
    title: 'Inconsistent Posting',
    description: 'Can\'t maintain regular posting schedule'
  },
  {
    id: 'limited-budget',
    title: 'Limited Budget',
    description: 'Not enough money to invest in effective marketing'
  },
  {
    id: 'no-strategy',
    title: 'No Clear Strategy',
    description: 'Don\'t know what marketing approach to take'
  },
  {
    id: 'measuring-roi',
    title: 'Measuring ROI',
    description: 'Can\'t tell if marketing efforts are working'
  },
  {
    id: 'target-audience',
    title: 'Finding Target Audience',
    description: 'Not sure who my ideal customers are'
  },
  {
    id: 'platform-confusion',
    title: 'Platform Confusion',
    description: 'Don\'t know which platforms to focus on'
  },
  {
    id: 'time-management',
    title: 'Time Management',
    description: 'Not enough time to manage marketing effectively'
  },
  {
    id: 'staying-updated',
    title: 'Staying Updated',
    description: 'Marketing trends and algorithms change too fast'
  }
];

export function CurrentChallengesStep({ data, onDataUpdate }: CurrentChallengesStepProps) {
  const { register, watch, setValue, reset } = useForm<CurrentChallenges>({
    defaultValues: data
  });

  const watchedData = watch();

  useEffect(() => {
    console.log('📥 [CurrentChallengesStep] received data:', data);
    reset(data);
  }, [data, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      onDataUpdate(value as CurrentChallenges);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataUpdate]);

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          What are your current marketing challenges? *
        </label>
        <p className="text-sm text-[#CBD5E1] mb-4">
          Select all challenges that apply to your business. This helps us create a strategy that addresses your specific needs.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMMON_CHALLENGES.map(challenge => (
            <label key={challenge.id} className="flex items-start p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg hover:border-[#CBD5E1]/20 cursor-pointer transition-all">
              <input
                type="checkbox"
                {...register('challenges')}
                value={challenge.id}
                className="w-4 h-4 mt-1 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2 flex-shrink-0"
              />
              <div className="ml-3">
                <span className="font-medium text-[#F9FAFB] block">
                  {challenge.title}
                </span>
                <p className="text-sm text-[#CBD5E1] mt-1">
                  {challenge.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="additionalChallenges" className="block text-sm font-medium text-[#F9FAFB] mb-3">
          Additional Challenges (Optional)
        </label>
        <textarea
          {...register('additionalChallenges')}
          rows={4}
          placeholder="Describe any other specific challenges you're facing with marketing that weren't listed above..."
          className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] placeholder-[#CBD5E1]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all resize-none"
        />
        <p className="text-xs text-[#CBD5E1]/60 mt-3">
          Be as specific as possible to help us create a more targeted strategy
        </p>
      </div>
    </div>
  );
}