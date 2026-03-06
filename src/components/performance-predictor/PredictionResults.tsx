'use client';

import { PredictionResult } from '@/app/performance-predictor/page';

interface PredictionResultsProps {
  prediction: PredictionResult;
  onClose: () => void;
}

export default function PredictionResults({ prediction, onClose }: PredictionResultsProps) {
  const { predictions, insights, recommendations, campaignData } = prediction;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-[#1A1F2E] rounded-2xl shadow-2xl border border-[#2A3441] p-8 h-full">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#2A3441]">
        <h2 className="text-2xl font-semibold text-[#F9FAFB]">
          Prediction Results
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#2A3441] rounded-lg transition-all"
          aria-label="Close results"
        >
          <svg className="w-6 h-6 text-[#94A3B8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
        {/* Overall Score */}
        <div className={`rounded-xl p-6 text-center ${getScoreColor(predictions.score)}`}>
          <div className="text-5xl font-bold mb-2">{predictions.score}</div>
          <div className="text-lg font-semibold">{getScoreLabel(predictions.score)}</div>
          <div className="text-sm opacity-75 mt-1">Performance Score</div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-[#22C55E]/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm text-[#94A3B8]">Expected Reach</span>
            </div>
            <div className="text-2xl font-bold text-[#22C55E]">
              {predictions.expectedReach.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-[#22C55E]/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-sm text-[#94A3B8]">Engagement</span>
            </div>
            <div className="text-2xl font-bold text-[#22C55E]">
              {predictions.expectedEngagement.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-[#22C55E]/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              <span className="text-sm text-[#94A3B8]">Clicks</span>
            </div>
            <div className="text-2xl font-bold text-[#22C55E]">
              {predictions.expectedClicks.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-[#22C55E]/30">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-[#94A3B8]">Conversions</span>
            </div>
            <div className="text-2xl font-bold text-[#22C55E]">
              {predictions.expectedConversions.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Rates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-[#2A3441] bg-[#0F1419] rounded-lg p-4">
            <div className="text-sm text-[#94A3B8] mb-1">Engagement Rate</div>
            <div className="text-xl font-bold text-[#F9FAFB]">{predictions.engagementRate}%</div>
          </div>
          <div className="border border-[#2A3441] bg-[#0F1419] rounded-lg p-4">
            <div className="text-sm text-[#94A3B8] mb-1">Click-Through Rate</div>
            <div className="text-xl font-bold text-[#F9FAFB]">{predictions.ctr}%</div>
          </div>
        </div>

        {/* Insights */}
        <div>
          <h3 className="text-lg font-semibold text-[#F9FAFB] mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Key Insights
          </h3>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex gap-3 p-3 bg-green-900/20 rounded-lg border border-[#22C55E]/30">
                <svg className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-[#CBD5E1]">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-lg font-semibold text-[#F9FAFB] mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex gap-3 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm text-[#CBD5E1]">{recommendation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Details Summary */}
        <div className="border-t border-[#2A3441] pt-4">
          <h4 className="text-sm font-semibold text-[#94A3B8] mb-3">Campaign Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[#64748B]">Platform:</span>
              <span className="ml-2 font-medium text-[#F9FAFB] capitalize">{campaignData.platform}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Followers:</span>
              <span className="ml-2 font-medium text-[#F9FAFB]">{campaignData.followers.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Post Date:</span>
              <span className="ml-2 font-medium text-[#F9FAFB]">{campaignData.postDate}</span>
            </div>
            <div>
              <span className="text-[#64748B]">Ad Boost:</span>
              <span className="ml-2 font-medium text-[#F9FAFB]">{campaignData.adBoost ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
