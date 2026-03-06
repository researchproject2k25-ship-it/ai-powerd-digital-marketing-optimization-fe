'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { CampaignData } from '@/app/performance-predictor/page';

interface CampaignFormProps {
  onPredict: (data: CampaignData) => void;
  onReset: () => void;
  isLoading: boolean;
}

export default function CampaignForm({ onPredict, onReset, isLoading }: CampaignFormProps) {
  const [formData, setFormData] = useState<CampaignData>({
    caption: '',
    contentImage: null,
    contentText: '',
    platform: 'facebook',
    postDate: '',
    postTime: '',
    followers: 0,
    adBoost: false
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, contentImage: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onPredict(formData);
  };

  const handleResetClick = () => {
    setFormData({
      caption: '',
      contentImage: null,
      contentText: '',
      platform: 'facebook',
      postDate: '',
      postTime: '',
      followers: 0,
      adBoost: false
    });
    setImagePreview(null);
    onReset();
  };

  return (
    <div className="bg-[#1A1F2E] rounded-2xl shadow-2xl border border-[#2A3441] p-8">
      <h2 className="text-2xl font-semibold text-[#F9FAFB] mb-6 pb-4 border-b border-[#2A3441]">
        Campaign Details
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Caption */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-[#CBD5E1] mb-2">
            CAPTION <span className="text-red-400">*</span>
          </label>
          <textarea
            id="caption"
            name="caption"
            value={formData.caption}
            onChange={handleInputChange}
            placeholder="Enter your post caption..."
            required
            rows={4}
            className="w-full px-4 py-3 bg-[#0F1419] border border-[#2A3441] rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all resize-none text-[#F9FAFB] placeholder-gray-500"
          />
        </div>

        {/* Upload Image */}
        <div>
          <label className="block text-sm font-medium text-[#CBD5E1] mb-3">
            UPLOAD CONTENT IMAGE (OPTIONAL)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleChooseImage}
            className="w-full px-6 py-3 bg-[#22C55E] text-white font-medium rounded-lg hover:bg-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 focus:ring-offset-[#1A1F2E] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            CHOOSE IMAGE
          </button>
          {imagePreview && (
            <div className="mt-3 relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg border border-[#2A3441]"
              />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setFormData(prev => ({ ...prev, contentImage: null }));
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Content Text */}
        <div>
          <label htmlFor="contentText" className="block text-sm font-medium text-[#CBD5E1] mb-2">
            CONTENT (IMAGE TEXT) <span className="text-red-400">*</span>
          </label>
          <textarea
            id="contentText"
            name="contentText"
            value={formData.contentText}
            onChange={handleInputChange}
            placeholder="Extracted text from image or enter manually..."
            required
            rows={4}
            className="w-full px-4 py-3 bg-[#0F1419] border border-[#2A3441] rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all resize-none text-[#F9FAFB] placeholder-gray-500"
          />
        </div>

        {/* Platform */}
        <div>
          <label htmlFor="platform" className="block text-sm font-medium text-[#CBD5E1] mb-2">
            PLATFORM <span className="text-red-400">*</span>
          </label>
          <select
            id="platform"
            name="platform"
            value={formData.platform}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-[#0F1419] border border-[#2A3441] rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all text-[#F9FAFB]"
          >
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>

        {/* Post Date */}
        <div>
          <label htmlFor="postDate" className="block text-sm font-medium text-[#CBD5E1] mb-2">
            POST DATE <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            id="postDate"
            name="postDate"
            value={formData.postDate}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-[#0F1419] border border-[#2A3441] rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all text-[#F9FAFB]"
          />
        </div>

        {/* Post Time */}
        <div>
          <label htmlFor="postTime" className="block text-sm font-medium text-[#CBD5E1] mb-2">
            POST TIME <span className="text-red-400">*</span>
          </label>
          <input
            type="time"
            id="postTime"
            name="postTime"
            value={formData.postTime}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-[#0F1419] border border-[#2A3441] rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all text-[#F9FAFB]"
          />
        </div>

        {/* Followers */}
        <div>
          <label htmlFor="followers" className="block text-sm font-medium text-[#CBD5E1] mb-2">
            FOLLOWERS <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            id="followers"
            name="followers"
            value={formData.followers || ''}
            onChange={handleInputChange}
            placeholder="Number of followers"
            required
            min="0"
            className="w-full px-4 py-3 bg-[#0F1419] border border-[#2A3441] rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all text-[#F9FAFB] placeholder-gray-500"
          />
        </div>

        {/* Ad Boost Checkbox */}
        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="adBoost"
            name="adBoost"
            checked={formData.adBoost}
            onChange={handleInputChange}
            className="w-5 h-5 text-[#22C55E] bg-[#0F1419] border-[#2A3441] rounded focus:ring-2 focus:ring-[#22C55E] cursor-pointer"
          />
          <label htmlFor="adBoost" className="text-sm font-medium text-[#CBD5E1] cursor-pointer">
            AD BOOST
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-4 bg-[#22C55E] text-white font-semibold rounded-lg hover:bg-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:ring-offset-2 focus:ring-offset-[#1A1F2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Predicting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Predict Performance
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetClick}
            disabled={isLoading}
            className="px-6 py-4 bg-[#2A3441] text-[#CBD5E1] font-semibold rounded-lg hover:bg-[#374151] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#1A1F2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
