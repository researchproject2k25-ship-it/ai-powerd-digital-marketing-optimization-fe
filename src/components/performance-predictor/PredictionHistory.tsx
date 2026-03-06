'use client';

import { PredictionResult } from '@/app/performance-predictor/page';

interface PredictionHistoryProps {
  predictions: PredictionResult[];
  onSelectPrediction: (prediction: PredictionResult) => void;
}

export default function PredictionHistory({ predictions, onSelectPrediction }: PredictionHistoryProps) {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      facebook: 'FB',
      instagram: 'IG',
      twitter: 'X',
      linkedin: 'IN',
      tiktok: 'TT',
      youtube: 'YT'
    };
    return icons[platform.toLowerCase()] || platform.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-[#1A1F2E] rounded-2xl shadow-2xl border border-[#2A3441] p-8 h-full">
      <h2 className="text-2xl font-semibold text-[#F9FAFB] mb-6 pb-4 border-b border-[#2A3441]">
        Prediction History
      </h2>

      {predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#0F1419] border-2 border-[#2A3441] flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-[#CBD5E1] text-lg">
            No prediction history yet. Make your first prediction above!
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              onClick={() => onSelectPrediction(prediction)}
              className="border border-[#2A3441] bg-[#0F1419] rounded-lg p-4 hover:border-[#22C55E] hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0B0F14] border border-[#2A3441] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#22C55E]">{getPlatformIcon(prediction.campaignData.platform)}</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#F9FAFB] capitalize">
                      {prediction.campaignData.platform}
                    </p>
                    <p className="text-sm text-[#94A3B8]">{formatDate(prediction.timestamp)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-900/30 px-3 py-1 rounded-full border border-[#22C55E]/30">
                  <span className="text-lg font-bold text-[#22C55E]">
                    {prediction.predictions.score}
                  </span>
                  <span className="text-xs text-[#22C55E] font-medium">SCORE</span>
                </div>
              </div>

              <p className="text-sm text-[#94A3B8] line-clamp-2 mb-3">
                {prediction.campaignData.caption}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-[#94A3B8]">
                    {prediction.predictions.expectedReach.toLocaleString()} reach
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-[#94A3B8]">
                    {prediction.predictions.engagementRate}% engagement
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#2A3441] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  {prediction.campaignData.followers.toLocaleString()} followers
                </span>
                <span className="text-xs text-[#22C55E] font-medium group-hover:text-[#16A34A]">
                  View Details →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
