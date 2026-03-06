'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDownIcon } from 'lucide-react';
import { type MarketSituation } from '@/types';

interface MarketSituationStepProps {
  data: Partial<MarketSituation>;
  onDataUpdate: (data: MarketSituation) => void;
}

const SEASONALITY_CATEGORIES = {
  'Religious & Cultural Festivals': [
    'Sinhala & Tamil New Year (April)',
    'Vesak (May)',
    'Poson (June)',
    'Christian Festivals',
    'Christmas (December)',
    'New Year (January 1st)',
    'Diwali / Deepavali (Oct–Nov)',
    'Nallur Festival (Aug–Sept)',
    'Ramadan & Eid-ul-Fitr (Dates vary)',
    'Eid-ul-Adha (Dates vary)',
    'Kandy Esala Perahera (July–Aug)',
    'Kataragama Festival (July)'
  ],
  'Education-Related Seasons': [
    'Back-to-School season (Dec–Jan)',
    'O/L Exam season (December)',
    'A/L Exam season (August)',
    'University admission periods (Feb–Mar & Oct–Nov)'
  ],
  'Weather & Climate Seasons': [
    'South-West Monsoon (May–Sept)',
    'North-East Monsoon (Dec–Feb)',
    'December – April (Tourist peak)',
    'July – August (Regional tourism for cultural festivals)',
    'Rainy season boosts food delivery, reduces physical shopping',
    'Dry season boosts outdoor events, travel, clothing'
  ],
  'Economic & Financial Cycles': [
    'Salary Cycle (25th–5th of every month)',
    'Mid-month low-spending period',
    'Government Budget Season (November)',
    'Inflation spikes / economic uncertainty months',
    'Harvest seasons impacting food prices'
  ],
  'Industry-Specific Seasons': [
    'Wedding Seasons (December–March)',
    'Wedding Seasons (August–September)',
    'Foreign tourist peak (Dec–April)',
    'Festival-driven tourism (July–August)'
  ],
  'Holiday & Lifestyle Seasons': [
    'School holidays (April, August, December)',
    'Summer/long vacation period (April–August)',
    'Special shopping seasons (Year-end December)',
    'Fitness/New Year resolution season (January)'
  ],
  'Sports Seasons': [
    'Major cricket series (varies)',
    'World Cup / Asia Cup seasons',
    'IPL season (March–May)'
  ],
  'Local Event Seasons': [
    'Jaffna festivals & cultural events',
    'Colombo International Book Fair (Sept)',
    'Trade exhibitions (BMICH season)',
    'Local fairs & seasonal pop-ups'
  ],
  'Low-Spending Periods': [
    'September (traditionally slow month)',
    'Post–New Year slump (May)',
    'Post-festival months (after April, after December)'
  ]
};

const STOCK_AVAILABILITY_OPTIONS = [
  { value: 'always-available', label: 'Always Available', description: 'Products/services are consistently available' },
  { value: 'seasonal', label: 'Seasonal', description: 'Availability depends on seasons or specific times' },
  { value: 'limited', label: 'Limited Stock', description: 'Limited quantity, first-come-first-served' },
  { value: 'pre-order', label: 'Pre-order/Made-to-order', description: 'Custom orders or advance booking required' }
];

export function MarketSituationStep({ data, onDataUpdate }: MarketSituationStepProps) {
  const { register, watch, setValue, getValues, reset } = useForm<MarketSituation>({
    defaultValues: {
      ...data,
      seasonality: data.seasonality || []
    }
  });

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedSeasonality, setSelectedSeasonality] = useState<{
    category: string;
    subcategories: string[];
  }[]>(data.seasonality || []);

  const recentPriceChanges = watch('recentPriceChanges');
  const seasonalityOther = watch('seasonalityOther');

  useEffect(() => {
    console.log('📥 [MarketSituationStep] received data:', data);
    reset({
      ...data,
      seasonality: data.seasonality || []
    });
    setSelectedSeasonality(data.seasonality || []);
  }, [data, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      const updatedData = {
        ...value,
        seasonality: selectedSeasonality
      } as MarketSituation;
      onDataUpdate(updatedData);
    });
    return () => subscription.unsubscribe();
  }, [watch, onDataUpdate, selectedSeasonality]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSubcategoryChange = (category: string, subcategory: string, checked: boolean) => {
    setSelectedSeasonality(prev => {
      const existingCategoryIndex = prev.findIndex(item => item.category === category);
      
      if (checked) {
        if (existingCategoryIndex >= 0) {
          // Add to existing category
          const updated = [...prev];
          updated[existingCategoryIndex] = {
            ...updated[existingCategoryIndex],
            subcategories: [...updated[existingCategoryIndex].subcategories, subcategory]
          };
          return updated;
        } else {
          // Create new category
          return [...prev, { category, subcategories: [subcategory] }];
        }
      } else {
        if (existingCategoryIndex >= 0) {
          // Remove from existing category
          const updated = [...prev];
          const filteredSubcategories = updated[existingCategoryIndex].subcategories.filter(
            sub => sub !== subcategory
          );
          
          if (filteredSubcategories.length === 0) {
            // Remove category if no subcategories left
            return updated.filter((_, index) => index !== existingCategoryIndex);
          } else {
            updated[existingCategoryIndex] = {
              ...updated[existingCategoryIndex],
              subcategories: filteredSubcategories
            };
            return updated;
          }
        }
        return prev;
      }
    });
  };

  const isSubcategorySelected = (category: string, subcategory: string) => {
    const categoryData = selectedSeasonality.find(item => item.category === category);
    return categoryData ? categoryData.subcategories.includes(subcategory) : false;
  };

  return (
    <div className="space-y-8">
      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Seasonality Factors *
        </label>
        <p className="text-sm text-[#CBD5E1] mb-4">
          When does your business typically perform better or face challenges? Select relevant seasonal factors that affect your business.
        </p>
        
        <div className="space-y-4">
          {Object.entries(SEASONALITY_CATEGORIES).map(([category, subcategories]) => (
            <div key={category} className="border border-[#1F2933] rounded-lg bg-[#1F2933]">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0B0F14] transition-colors rounded-lg"
              >
                <span className="font-medium text-[#F9FAFB]">{category}</span>
                <ChevronDownIcon 
                  className={`w-5 h-5 text-[#CBD5E1] transition-transform ${
                    expandedCategories[category] ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {expandedCategories[category] && (
                <div className="border-t border-[#0B0F14] p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subcategories.map(subcategory => (
                      <label key={subcategory} className="flex items-start p-3 border border-[#0B0F14] rounded hover:bg-[#0B0F14] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isSubcategorySelected(category, subcategory)}
                          onChange={(e) => handleSubcategoryChange(category, subcategory, e.target.checked)}
                          className="w-4 h-4 mt-1 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 rounded focus:ring-[#22C55E] focus:ring-2"
                        />
                        <span className="ml-2 text-sm text-[#CBD5E1]">{subcategory}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Other category with input field */}
          <div className="border border-[#1F2933] rounded-lg bg-[#1F2933]">
            <button
              type="button"
              onClick={() => toggleCategory('Other')}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#0B0F14] transition-colors rounded-lg"
            >
              <span className="font-medium text-[#F9FAFB]">Other</span>
              <ChevronDownIcon 
                className={`w-5 h-5 text-[#CBD5E1] transition-transform ${
                  expandedCategories['Other'] ? 'rotate-180' : ''
                }`}
              />
            </button>
            
            {expandedCategories['Other'] && (
              <div className="border-t border-[#0B0F14] p-4">
                <label className="block text-sm font-medium text-[#F9FAFB] mb-3">
                  Please specify other seasonal factors:
                </label>
                <textarea
                  {...register('seasonalityOther')}
                  rows={3}
                  placeholder="Describe any other seasonal factors that affect your business..."
                  className="w-full px-4 py-3 bg-[#0B0F14] border border-[#0B0F14] text-[#F9FAFB] placeholder-[#CBD5E1]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="competitorBehavior" className="block text-sm font-medium text-[#F9FAFB] mb-3">
          Current Competitor Behavior
        </label>
        <textarea
          {...register('competitorBehavior')}
          rows={4}
          placeholder="What are your competitors doing lately? Any new ads, promotions, or strategies you've noticed?"
          className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] placeholder-[#CBD5E1]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all resize-none"
        />
        <p className="text-xs text-[#CBD5E1]/60 mt-3">
          This helps us understand the competitive landscape and find opportunities
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Stock/Service Availability *
        </label>
        <div className="space-y-3">
          {STOCK_AVAILABILITY_OPTIONS.map(option => (
            <label key={option.value} className="flex items-start p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg hover:border-[#CBD5E1]/20 cursor-pointer transition-all">
              <input
                type="radio"
                {...register('stockAvailability', { required: true })}
                value={option.value}
                className="w-4 h-4 mt-1 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 focus:ring-[#22C55E] focus:ring-2"
              />
              <div className="ml-3">
                <span className="font-medium text-[#F9FAFB]">{option.label}</span>
                <p className="text-sm text-[#CBD5E1] mt-1">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#F9FAFB] mb-4">
          Recent Price Changes *
        </label>
        <div className="space-y-3">
          <label className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
            <input
              type="radio"
              {...register('recentPriceChanges', { required: true })}
              value="true"
              className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 focus:ring-[#22C55E] focus:ring-2"
            />
            <span className="ml-3 text-[#F9FAFB]">Yes, we've recently changed our prices</span>
          </label>
          <label className="flex items-center p-4 bg-[#1F2933] border border-[#1F2933] rounded-lg cursor-pointer hover:border-[#CBD5E1]/20 transition-all">
            <input
              type="radio"
              {...register('recentPriceChanges', { required: true })}
              value="false"
              className="w-4 h-4 text-[#22C55E] bg-[#1F2933] border-[#CBD5E1]/30 focus:ring-[#22C55E] focus:ring-2"
            />
            <span className="ml-3 text-[#F9FAFB]">No recent price changes</span>
          </label>
        </div>
      </div>

      {recentPriceChanges === 'true' && (
        <div>
          <label htmlFor="priceChangeDetails" className="block text-sm font-medium text-[#F9FAFB] mb-3">
            Price Change Details
          </label>
          <textarea
            {...register('priceChangeDetails')}
            rows={3}
            placeholder="Describe the price changes (increased/decreased, by how much, when, reasons)..."
            className="w-full px-4 py-3 bg-[#1F2933] border border-[#1F2933] text-[#F9FAFB] placeholder-[#CBD5E1]/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all resize-none"
          />
          <p className="text-xs text-[#CBD5E1]/60 mt-3">
            This helps us craft messaging around value proposition and positioning
          </p>
        </div>
      )}

      <div className="bg-[#1F2933] border border-[#1F2933] rounded-lg p-6">
        <h4 className="font-medium text-[#F9FAFB] mb-2">
          Why This Information Matters
        </h4>
        <p className="text-sm text-[#CBD5E1]">
          Understanding your market situation helps us recommend the right timing for campaigns, 
          messaging strategies, and competitive positioning to maximize your marketing effectiveness.
        </p>
      </div>
    </div>
  );
}