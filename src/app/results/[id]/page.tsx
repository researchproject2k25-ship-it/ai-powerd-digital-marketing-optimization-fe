'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiService } from '@/services/apiService';
import StrategyDisplay from '@/components/StrategyDisplay';

interface SubmissionDetails {
  id: string;
  form_data: any;
  created_at: string;
  status: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<any>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  const submissionId = params?.id as string;

  useEffect(() => {
    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSubmission(submissionId);
      setSubmission(data);
      
      // Auto-generate strategy after loading submission
      if (data.form_data) {
        generateStrategy(data.form_data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch submission');
      console.error('Error fetching submission:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateStrategy = async (formData: any) => {
    try {
      setStrategyLoading(true);
      setStrategyError(null);

      // Use backend to generate strategy (correct architecture)
      const result = await apiService.generateStrategyForSubmission(submissionId);

      if (result.strategy) {
        setStrategy({
          data: result.strategy,
          metadata: result.metadata || {},
        });
      } else {
        setStrategyError('Strategy generation failed');
      }
    } catch (error) {
      setStrategyError(error instanceof Error ? error.message : 'Failed to generate strategy');
      console.error('Error generating strategy:', error);
    } finally {
      setStrategyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-800 border-t-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm font-medium">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-[#111111] rounded-2xl shadow-2xl border border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Error Loading Submission</h1>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-black px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
            >
              Return to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="bg-[#111111] rounded-2xl shadow-2xl border border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Submission Not Found</h1>
            <p className="text-gray-400 text-sm mb-6">The requested submission could not be found.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-black px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
            >
              Return to Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#111111] border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Submission Results
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                Your marketing strategy form has been successfully submitted
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-black px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
            >
              New Submission
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Success Message */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Form Submitted Successfully
              </h2>
              <p className="text-gray-400 text-sm mt-0.5">
                Your marketing strategy information has been saved to our database.
              </p>
            </div>
          </div>
        </div>

        {/* Submission Details */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl">
          <div className="px-6 py-5 border-b border-gray-800">
            <h3 className="text-base font-semibold text-white">Submission Details</h3>
          </div>
          
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Submission ID
                </label>
                <p className="text-sm text-gray-300 font-mono bg-black/30 px-3 py-2 rounded-lg border border-gray-800">
                  {submission.id}
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Status
                </label>
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                  {submission.status}
                </span>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Submitted At
                </label>
                <p className="text-sm text-gray-300">
                  {formatDate(submission.created_at)}
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Language
                </label>
                <p className="text-sm text-gray-300">
                  {submission.form_data.form_language === 'si' ? 'Sinhala' : 
                   submission.form_data.form_language === 'en' ? 'English' : 'Mixed'}
                </p>
              </div>
            </div>

            {/* Business Profile Summary */}
            {submission.form_data.business_profile && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Business Profile Summary</h4>
                <div className="bg-black/30 p-5 rounded-xl border border-gray-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Business Name</span>
                      <p className="text-sm text-gray-300 mt-1">{submission.form_data.business_profile.business_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Business Type</span>
                      <p className="text-sm text-gray-300 mt-1">{submission.form_data.business_profile.business_type || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Size</span>
                      <p className="text-sm text-gray-300 mt-1">{submission.form_data.business_profile.business_size || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</span>
                      <p className="text-sm text-gray-300 mt-1">{submission.form_data.business_profile.location || 'Not provided'}</p>
                    </div>
                  </div>
                  {submission.form_data.business_profile.unique_selling_proposition && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Selling Proposition</span>
                      <p className="text-sm text-gray-300 mt-1">{submission.form_data.business_profile.unique_selling_proposition}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="p-5 bg-black/30 rounded-xl border border-gray-800">
              <h4 className="text-sm font-semibold text-white mb-3">What's Next?</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Your submission has been stored in our database</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>AI is generating your personalized marketing strategy</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>You'll see your customized recommendations below</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Keep your submission ID for future reference</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Personalized Marketing Strategy Section */}
        <div className="mt-8">
          <div className="bg-[#111111] border border-gray-800 rounded-t-xl px-6 py-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Your Personalized Marketing Strategy
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  AI-powered recommendations tailored to your business profile and market trends
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border-x border-b border-gray-800 rounded-b-xl p-6">
            {strategyLoading && (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-800 border-t-gray-400 mx-auto mb-4"></div>
                <p className="text-white font-medium text-sm">Generating your personalized strategy...</p>
                <p className="text-gray-500 text-xs mt-2">This may take 10-15 seconds</p>
              </div>
            )}

            {strategyError && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">
                  Strategy Generation Failed
                </h3>
                <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{strategyError}</p>
                <button
                  onClick={() => generateStrategy(submission.form_data)}
                  className="bg-white text-black px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            )}

            {!strategyLoading && !strategyError && !strategy && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm mb-6">Ready to generate your strategy?</p>
                <button
                  onClick={() => generateStrategy(submission.form_data)}
                  className="bg-white text-black px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                >
                  Generate Strategy
                </button>
              </div>
            )}

            {strategy && !strategyLoading && (
              <StrategyDisplay 
                strategy={strategy.data} 
                metadata={strategy.metadata}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="bg-white text-black px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
          >
            Submit Another Form
          </button>
          
          <button
            onClick={() => window.print()}
            className="bg-transparent text-gray-400 px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-all text-sm font-medium border border-gray-800"
          >
            Print Results
          </button>
        </div>
      </main>
    </div>
  );
}