'use client';

import { LightBulbIcon, ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function InsightsPage() {
  const router = useRouter();
  
  // Mock insights data
  const insights = {
    week: "Jan 1 – Jan 7, 2026",
    whatWorked: [
      {
        title: "Instagram Reels High Engagement",
        metric: "+45% engagement rate",
        description: "Reels featuring product demos and quick tips performed exceptionally well."
      },
      {
        title: "WhatsApp Story Views",
        metric: "3.2K views",
        description: "Behind-the-scenes content resonated with your audience."
      }
    ],
    whatDidnt: [
      {
        title: "Facebook Ad CPC Increased",
        metric: "+LKR 45 per click",
        description: "Increased competition in your target demographic raised costs."
      },
      {
        title: "Low Twitter Engagement",
        metric: "-20% engagement",
        description: "Text-only posts underperformed compared to visual content."
      }
    ],
    recommendations: [
      {
        title: "Reduce Facebook Spend",
        impact: "High",
        action: "Shift 20% of Facebook budget to Instagram Reels",
        reason: "Better ROI on Instagram with current audience behavior"
      },
      {
        title: "Increase Reels Frequency",
        impact: "Medium",
        action: "Post 4 Reels per week (currently 2)",
        reason: "Capitalize on high engagement momentum"
      },
      {
        title: "Add Visual Content to Twitter",
        impact: "Medium",
        action: "Include images/videos in all Twitter posts",
        reason: "Visual content drives 3x more engagement"
      }
    ],
    decision: {
      status: "Calendar Updated",
      appliedAt: "Jan 7, 2026",
      changes: [
        "Increased Instagram Reels from 2 to 4 per week",
        "Reduced Facebook posts from 3 to 2 per week",
        "All Twitter posts now include visuals"
      ]
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14]">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-[#1F2933] rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 text-[#CBD5E1]" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-[#F9FAFB]">Weekly Insights</h1>
              <p className="text-sm text-[#CBD5E1] mt-1">{insights.week}</p>
            </div>
          </div>
        </div>

        {/* What Worked */}
        <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-6 w-6 text-[#22C55E]" />
            <h2 className="text-lg font-semibold text-[#F9FAFB]">What Worked</h2>
          </div>
          
          <div className="space-y-3">
            {insights.whatWorked.map((item, index) => (
              <div key={index} className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[#F9FAFB] font-medium">{item.title}</h3>
                  <span className="text-sm font-semibold text-[#22C55E]">{item.metric}</span>
                </div>
                <p className="text-sm text-[#CBD5E1]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What Didn't Work */}
        <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <XCircleIcon className="h-6 w-6 text-[#EF4444]" />
            <h2 className="text-lg font-semibold text-[#F9FAFB]">What Didn't Work</h2>
          </div>
          
          <div className="space-y-3">
            {insights.whatDidnt.map((item, index) => (
              <div key={index} className="p-4 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[#F9FAFB] font-medium">{item.title}</h3>
                  <span className="text-sm font-semibold text-[#EF4444]">{item.metric}</span>
                </div>
                <p className="text-sm text-[#CBD5E1]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-[#1F2933] border border-[#2D3748] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <LightBulbIcon className="h-6 w-6 text-[#22C55E]" />
            <h2 className="text-lg font-semibold text-[#F9FAFB]">AI Recommendations</h2>
          </div>
          
          <div className="space-y-3">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-[#0B0F14] border border-[#2D3748] rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="text-[#F9FAFB] font-medium">{rec.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    rec.impact === 'High' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                    rec.impact === 'Medium' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                    'bg-[#3B82F6]/10 text-[#3B82F6]'
                  }`}>
                    {rec.impact} Impact
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-[#64748B]">Action:</span>
                    <p className="text-sm text-[#CBD5E1] mt-1">{rec.action}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#64748B]">Reason:</span>
                    <p className="text-sm text-[#CBD5E1] mt-1">{rec.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decision / Status */}
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#F9FAFB]">Decision</h2>
              <p className="text-sm text-[#CBD5E1] mt-1">Applied on {insights.decision.appliedAt}</p>
            </div>
            <span className="px-4 py-2 bg-[#22C55E] text-[#0B0F14] rounded-lg font-medium text-sm">
              {insights.decision.status}
            </span>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#F9FAFB]">Changes Applied:</h3>
            <ul className="space-y-2">
              {insights.decision.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-[#CBD5E1]">
                  <CheckCircleIcon className="h-4 w-4 text-[#22C55E] mt-0.5 flex-shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Explainability Note */}
        <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-1.5" />
            <div className="flex-1">
              <p className="text-sm text-[#CBD5E1]">
                <span className="font-medium text-[#F9FAFB]">Transparency First:</span> All AI recommendations include reason, decision, and impact. You're always in control.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
