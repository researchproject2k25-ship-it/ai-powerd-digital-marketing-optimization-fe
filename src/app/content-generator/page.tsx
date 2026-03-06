'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import { 
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  ArrowPathIcon,
  TagIcon,
  GlobeAltIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
  TicketIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { generateSmartPoster, getPosterUrl, buildDescription, mapTone } from '@/services/contentApiService';

type PosterSize = 'facebook' | 'instagram' | 'story' | 'twitter';
type Tag = 'great-value' | 'new-arrival' | 'best-seller' | 'limited-time' | 'special-offer' | 'top-rated' | 'free-delivery' | 'easy-installments';

const PRODUCT_CATEGORIES = {
  Electronics: [
    { name: 'Robot Vacuum' },
    { name: 'Budget Smartphone' },
    { name: 'Washing Machine' },
    { name: 'Smart TV' },
    { name: 'Laptop' },
  ],
  Furniture: [
    { name: 'Sofa Set' },
    { name: 'Dining Table' },
    { name: 'Office Chair' },
    { name: 'Bed Frame' },
  ],
  Food: [
    { name: 'Kottu Promotion' },
    { name: 'BBQ Ribs' },
    { name: 'Pizza Deal' },
    { name: 'Burger Combo' },
  ],
};

const SEASONS = [
  'No specific season',
  'Christmas',
  'New Year',
  'Valentine\'s Day',
  'Easter',
  'Ramadan',
  'Summer Sale',
  'Black Friday',
  'Cyber Monday',
  'Back to School',
];

const DISCOUNT_OPTIONS = [
  '',
  '10%',
  '15%',
  '20%',
  '25%',
  '30%',
  '40%',
  '50%',
  '60%',
  '70%',
  'Up to 50% OFF',
  'Up to 70% OFF',
  'Buy 1 Get 1 Free',
  'Buy 2 Get 1 Free',
];

const TAG_CATEGORIES = {
  'Price & Value': [
    { id: 'great-value', label: 'Great value', usage: 'Adds "Unbeatable value!" + CTA: "Save Big Today"' },
    { id: 'special-offer', label: 'Special offer', usage: 'CTA: "Get Yours Now"' },
  ],
  'Urgency & Timing': [
    { id: 'limited-time', label: 'Limited time', usage: 'Adds "Limited time only!" + CTA: "Order Today"' },
    { id: 'new-arrival', label: 'New arrival', usage: 'CTA: "Check It Out"' },
  ],
  'Social Proof': [
    { id: 'best-seller', label: 'Best seller', usage: 'CTA: "Don\'t Miss Out"' },
    { id: 'top-rated', label: 'Top-rated', usage: 'CTA: "Experience Top Quality"' },
  ],
  'Benefits': [
    { id: 'free-delivery', label: 'Free delivery', usage: 'CTA: "Order Now with Free Delivery"' },
    { id: 'easy-installments', label: 'Easy installments', usage: 'CTA: "Shop Now, Pay Later"' },
  ],
};

const POSTER_SIZES = [
  { id: 'facebook', label: 'Facebook (1200x630)' },
  { id: 'instagram', label: 'Instagram (1080x1080)' },
  { id: 'story', label: 'Story (1080x1920)' },
  { id: 'twitter', label: 'Twitter (1200x675)' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'Sinhala' },
  { code: 'en-si', label: 'Bilingual (Singlish)' },
];

type PipelineMode = 'gemini+harfbuzz' | 'finetuned+pillow' | '';

export default function ContentGeneratorPage() {
  const [productName, setProductName] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(true);
  const [season, setSeason] = useState('No specific season');
  const [discount, setDiscount] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [language, setLanguage] = useState('si');
  const [selectedSizes, setSelectedSizes] = useState<PosterSize[]>(['facebook']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generatedPosters, setGeneratedPosters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'content' | 'poster'>('content');
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<any>(null);
  const [pipelineMode, setPipelineMode] = useState<PipelineMode>('gemini+harfbuzz');
  const [shapingInfo, setShapingInfo] = useState<any>(null);
  const [pipelineUsed, setPipelineUsed] = useState<string>('');
  const [hashtags, setHashtags] = useState<string[]>([]);

  const handleProductSuggestion = (label: string) => {
    setProductName(label);
    setShowProductSuggestions(false);
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const handleDownloadPoster = async (poster: any) => {
    try {
      const link = document.createElement('a');
      link.href = poster.url;
      link.download = `${productName}-${poster.size}-poster.png`;
      link.target = '_blank';
      
      try {
        const response = await fetch(poster.url, { mode: 'cors' });
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        } else {
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download error:', error);
      window.open(poster.url, '_blank');
    }
  };

  const openPosterModal = (poster: any) => {
    setSelectedPoster(poster);
    setShowPosterModal(true);
  };

  const closePosterModal = () => {
    setShowPosterModal(false);
    setSelectedPoster(null);
  };

  const toggleTag = (tagId: Tag) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const toggleSize = (sizeId: PosterSize) => {
    setSelectedSizes(prev => 
      prev.includes(sizeId) 
        ? prev.filter(s => s !== sizeId)
        : [...prev, sizeId]
    );
  };

  const mapLanguage = (code: string): 'english' | 'sinhala' | 'both' => {
    const mapping: Record<string, 'english' | 'sinhala' | 'both'> = {
      'en': 'english',
      'si': 'sinhala',
      'en-si': 'both'
    };
    return mapping[code] || 'english';
  };

  const handleGenerateContent = async (includePoster: boolean) => {
    if (!productName.trim()) {
      alert('Please enter a product name');
      return;
    }

    setIsGenerating(true);
    setActiveTab('content');

    try {
      const description = buildDescription({
        discount,
        tags: selectedTags,
        season: season !== 'No specific season' ? season : undefined,
      });

      const tone = mapTone(selectedTags);
      const backendLanguage = mapLanguage(language);

      if (includePoster) {
        const primarySize = selectedSizes[0] || 'facebook';
        
        const response = await generateSmartPoster({
          product_name: productName,
          description,
          tone,
          language: backendLanguage,
          season: season !== 'No specific season' ? season : undefined,
          discount: discount || undefined,
          business_name: businessName || undefined,
          phone_number: phoneNumber || undefined,
          tags: selectedTags,
          size: primarySize,
          pipeline: pipelineMode || undefined,
        });

        setGeneratedContent(response.content);
        setPipelineUsed(response.pipeline || '');
        setShapingInfo(response.shaping_info || null);
        setHashtags(response.hashtags || []);

        const posters = selectedSizes.map(size => ({
          size,
          url: response.poster_path ? getPosterUrl(response.poster_path) : null,
          dimensions: size === 'facebook' ? '1200x630' : 
                     size === 'instagram' ? '1080x1080' : 
                     size === 'story' ? '1080x1920' : '1200x675'
        })).filter(p => p.url);
        
        setGeneratedPosters(posters);
        
      } else {
        const response = await generateSmartPoster({
          product_name: productName,
          description,
          tone,
          language: backendLanguage,
          season: season !== 'No specific season' ? season : undefined,
          discount: discount || undefined,
          tags: selectedTags,
          pipeline: pipelineMode || undefined,
        });

        setGeneratedContent(response.content);
        setPipelineUsed(response.pipeline || '');
        setShapingInfo(response.shaping_info || null);
        setHashtags(response.hashtags || []);
        setGeneratedPosters([]);
      }

      setIsGenerating(false);
      
    } catch (error) {
      console.error('Error generating content:', error);
      alert(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsGenerating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#0B0F14]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#0B0F14]">
          <div className="min-h-screen bg-gradient-to-br from-[#0B0F14] via-[#0B0F14] to-[#0d1f1a]">
            {/* Hero Section */}
            <div className="border-b border-[#1F2933]">
              <div className="max-w-7xl mx-auto px-8 py-20">
                <div className="max-w-2xl">
                  <h1 className="text-5xl font-semibold text-[#F9FAFB] mb-4 tracking-tight">AI Marketing Content Generator</h1>
                  <p className="text-[#CBD5E1] text-lg">Create engaging marketing content and professional posters with AI</p>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Input Form Section */}
                <div className="bg-[#0B0F14]/80 backdrop-blur-sm border border-[#1F2933] rounded-2xl overflow-hidden">
                  <div className="p-10">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#1F2933] mb-6">
                        <DocumentTextIcon className="h-5 w-5 text-[#F9FAFB]" />
                      </div>
                      <h2 className="text-2xl font-semibold text-[#F9FAFB] mb-2">Input Details</h2>
                      <p className="text-[#CBD5E1] text-sm">Fill in your product information</p>
                    </div>

                    <div className="space-y-6">
                      {/* Product Name */}
                      <div>
                        <label className="block text-sm font-medium text-[#F9FAFB] mb-3">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => {
                            setProductName(e.target.value);
                            setShowProductSuggestions(true);
                          }}
                          onFocus={() => setShowProductSuggestions(true)}
                          placeholder="Type your product name..."
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#1F2933] rounded-xl focus:outline-none focus:border-[#CBD5E1]/30 text-[#F9FAFB] placeholder:text-[#CBD5E1]/50"
                        />
                        
                        {showProductSuggestions && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-[#CBD5E1]">Quick suggestions by category:</p>
                              <button
                                onClick={() => setShowProductSuggestions(false)}
                                className="text-xs text-[#CBD5E1] hover:text-[#F9FAFB]"
                              >
                                Hide
                              </button>
                            </div>
                            <div className="space-y-3">
                              {Object.entries(PRODUCT_CATEGORIES).map(([category, products]) => (
                                <div key={category}>
                                  <p className="text-xs font-medium text-[#CBD5E1] mb-2">{category}</p>
                                  <div className="flex flex-wrap gap-2">
                                    {products.map((product) => (
                                      <button
                                        key={product.name}
                                        onClick={() => handleProductSuggestion(product.name)}
                                        className="px-3 py-2 bg-[#1F2933] hover:bg-[#2D3748] border border-[#1F2933] rounded-lg text-sm text-[#F9FAFB] transition-colors"
                                      >
                                        {product.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {!showProductSuggestions && productName && (
                          <button
                            onClick={() => setShowProductSuggestions(true)}
                            className="text-xs text-[#22C55E] hover:text-[#16A34A] mt-2"
                          >
                            Show suggestions
                          </button>
                        )}
                      </div>

                      {/* Season/Festival */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB] mb-3">
                          <CalendarIcon className="h-4 w-4" />
                          Season / Festival <span className="text-[#CBD5E1] text-xs font-normal">(Optional)</span>
                        </label>
                        <select
                          value={season}
                          onChange={(e) => setSeason(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#1F2933] rounded-xl focus:outline-none focus:border-[#CBD5E1]/30 text-[#F9FAFB]"
                        >
                          {SEASONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <p className="text-xs text-[#CBD5E1] mt-2">Model trained on seasonal content - will add festive touch</p>
                      </div>

                      {/* Discount */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB] mb-3">
                          <TicketIcon className="h-4 w-4" />
                          Discount <span className="text-[#CBD5E1] text-xs font-normal">(Optional)</span>
                        </label>
                        <select
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#1F2933] rounded-xl focus:outline-none focus:border-[#CBD5E1]/30 text-[#F9FAFB]"
                        >
                          <option value="">No discount</option>
                          {DISCOUNT_OPTIONS.filter(d => d !== '').map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <p className="text-xs text-[#CBD5E1] mt-2">
                          {discount ? `Selected: ${discount} - Will appear in content` : 'Select a discount to add to your content'}
                        </p>
                      </div>

                      {/* Business Name */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB] mb-3">
                          <BuildingStorefrontIcon className="h-4 w-4" />
                          Business Name <span className="text-[#CBD5E1] text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g., SINGER, Daraz.lk, Your Shop Name"
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#1F2933] rounded-xl focus:outline-none focus:border-[#CBD5E1]/30 text-[#F9FAFB] placeholder:text-[#CBD5E1]/50"
                        />
                        <p className="text-xs text-[#CBD5E1] mt-2">Appears on right bottom of poster</p>
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB] mb-3">
                          <PhoneIcon className="h-4 w-4" />
                          Phone Number <span className="text-[#CBD5E1] text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g., 011 5 400 400, +94 77 123 4567"
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#1F2933] rounded-xl focus:outline-none focus:border-[#CBD5E1]/30 text-[#F9FAFB] placeholder:text-[#CBD5E1]/50"
                        />
                        <p className="text-xs text-[#CBD5E1] mt-2">Appears on left bottom of poster</p>
                      </div>

                      {/* Tags */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB]">
                            <TagIcon className="h-4 w-4" />
                            Marketing Tags <span className="text-[#CBD5E1] text-xs font-normal">(Shapes your content)</span>
                          </label>
                          {selectedTags.length > 0 && (
                            <button
                              onClick={clearAllTags}
                              className="text-xs text-[#CBD5E1] hover:text-[#F9FAFB] underline"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {Object.entries(TAG_CATEGORIES).map(([category, tags]) => (
                            <div key={category}>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs font-medium text-[#CBD5E1]">{category}</p>
                                <div className="flex-1 h-px bg-[#1F2933]"></div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                  <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id as Tag)}
                                    title={tag.usage}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                      selectedTags.includes(tag.id as Tag)
                                        ? 'bg-[#22C55E] text-[#0B0F14] shadow-lg shadow-[#22C55E]/20'
                                        : 'bg-[#1F2933] text-[#F9FAFB] hover:bg-[#2D3748] border border-[#2D3748]'
                                    }`}
                                  >
                                    {tag.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <p className="text-xs text-[#CBD5E1] mt-3">
                          {selectedTags.length > 0 
                            ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected - Controls CTAs and urgency phrases` 
                            : 'Select tags to customize your call-to-action and content features'}
                        </p>
                        
                        {selectedTags.length > 0 && (
                          <div className="mt-3 p-4 bg-[#1F2933] rounded-lg border border-[#2D3748]">
                            <p className="text-xs font-medium text-[#22C55E] mb-3 flex items-center gap-2">
                              <CheckCircleIcon className="h-4 w-4" />
                              How your selected tags will be used:
                            </p>
                            <div className="space-y-2">
                              {selectedTags.map((tagId) => {
                                const tag = Object.values(TAG_CATEGORIES)
                                  .flat()
                                  .find(t => t.id === tagId);
                                return tag ? (
                                  <div key={tagId} className="flex items-start gap-2">
                                    <div>
                                      <p className="text-xs text-[#F9FAFB] font-medium">{tag.label}</p>
                                      <p className="text-xs text-[#CBD5E1]">{tag.usage}</p>
                                    </div>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Language */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB] mb-3">
                          <GlobeAltIcon className="h-4 w-4" />
                          Language
                        </label>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0B0F14] border border-[#1F2933] rounded-xl focus:outline-none focus:border-[#CBD5E1]/30 text-[#F9FAFB]"
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Rendering Pipeline */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB] mb-3">
                          <SparklesIcon className="h-4 w-4" />
                          Rendering Pipeline
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setPipelineMode('gemini+harfbuzz')}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                              pipelineMode === 'gemini+harfbuzz'
                                ? 'bg-[#22C55E] text-[#0B0F14]'
                                : 'bg-[#1F2933] text-[#F9FAFB] hover:bg-[#2D3748]'
                            }`}
                          >
                            <div className="font-semibold">Gemini + HarfBuzz</div>
                            <div className={`text-xs mt-1 ${pipelineMode === 'gemini+harfbuzz' ? 'text-[#0B0F14]/70' : 'text-[#CBD5E1]'}`}>
                              API + Browser rendering
                            </div>
                          </button>
                          <button
                            onClick={() => setPipelineMode('finetuned+pillow')}
                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                              pipelineMode === 'finetuned+pillow'
                                ? 'bg-[#22C55E] text-[#0B0F14]'
                                : 'bg-[#1F2933] text-[#F9FAFB] hover:bg-[#2D3748]'
                            }`}
                          >
                            <div className="font-semibold">Fine-tuned + Pillow</div>
                            <div className={`text-xs mt-1 ${pipelineMode === 'finetuned+pillow' ? 'text-[#0B0F14]/70' : 'text-[#CBD5E1]'}`}>
                              Local models + PIL
                            </div>
                          </button>
                        </div>
                        <p className="text-xs text-[#CBD5E1] mt-2">
                          {pipelineMode === 'gemini+harfbuzz' 
                            ? 'Uses Gemini API for text + Chromium/HarfBuzz for perfect Sinhala shaping' 
                            : 'Uses fine-tuned GPT-2/mT5 + Pillow for local rendering'}
                        </p>
                      </div>

                      {/* Poster Sizes */}
                      <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB] mb-3">
                          <PhotoIcon className="h-4 w-4" />
                          Poster Sizes
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          {POSTER_SIZES.map((size) => (
                            <button
                              key={size.id}
                              onClick={() => toggleSize(size.id as PosterSize)}
                              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2 ${
                                selectedSizes.includes(size.id as PosterSize)
                                  ? 'bg-[#22C55E] text-[#0B0F14]'
                                  : 'bg-[#1F2933] text-[#F9FAFB] hover:bg-[#2D3748]'
                              }`}
                            >
                              {selectedSizes.includes(size.id as PosterSize) && (
                                <CheckCircleIcon className="h-4 w-4" />
                              )}
                              {size.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-[#CBD5E1]">Select multiple sizes to generate all at once</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <button
                          onClick={() => handleGenerateContent(false)}
                          disabled={isGenerating || !productName.trim()}
                          className="w-full bg-[#22C55E] text-[#0B0F14] py-4 px-6 rounded-xl font-medium hover:bg-[#16A34A] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <DocumentTextIcon className="h-5 w-5" />
                              Content Only
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleGenerateContent(true)}
                          disabled={isGenerating || !productName.trim()}
                          className="w-full bg-[#0F172A] text-white py-4 px-6 rounded-xl font-medium hover:bg-[#1E2A78] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isGenerating ? (
                            <>
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="h-5 w-5" />
                              Content + Poster
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Output Section */}
                <div className="bg-[#0B0F14]/80 backdrop-blur-sm border border-[#1F2933] rounded-2xl overflow-hidden">
                  <div className="p-10">
                    <div className="mb-8">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#22C55E]/10 mb-6">
                        <SparklesIcon className="h-5 w-5 text-[#22C55E]" />
                      </div>
                      <h2 className="text-2xl font-semibold text-[#F9FAFB] mb-2">Generated Output</h2>
                      <p className="text-[#CBD5E1] text-sm">Your AI-generated content will appear here</p>
                    </div>

                    {generatedContent ? (
                      <div className="space-y-6">
                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-[#1F2933]">
                          <button
                            onClick={() => setActiveTab('content')}
                            className={`px-4 py-3 font-medium text-sm transition-colors ${
                              activeTab === 'content'
                                ? 'text-[#22C55E] border-b-2 border-[#22C55E]'
                                : 'text-[#CBD5E1] hover:text-[#F9FAFB]'
                            }`}
                          >
                            <DocumentTextIcon className="h-4 w-4 inline mr-2" />
                            Content
                          </button>
                          {generatedPosters.length > 0 && (
                            <button
                              onClick={() => setActiveTab('poster')}
                              className={`px-4 py-3 font-medium text-sm transition-colors ${
                                activeTab === 'poster'
                                  ? 'text-[#22C55E] border-b-2 border-[#22C55E]'
                                  : 'text-[#CBD5E1] hover:text-[#F9FAFB]'
                              }`}
                            >
                              <PhotoIcon className="h-4 w-4 inline mr-2" />
                              Posters ({generatedPosters.length})
                            </button>
                          )}
                        </div>

                        {/* Content Tab */}
                        {activeTab === 'content' && (
                          <div className="space-y-4">
                            <div className="bg-[#1F2933] rounded-xl p-6">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-[#F9FAFB]">Marketing Content</h3>
                                <button
                                  onClick={() => navigator.clipboard.writeText(generatedContent)}
                                  className="px-3 py-1.5 bg-[#0B0F14] text-[#CBD5E1] rounded-lg text-xs hover:bg-[#2D3748] transition-colors"
                                >
                                  Copy
                                </button>
                              </div>
                              <div className="text-[#CBD5E1] whitespace-pre-line text-sm leading-relaxed">
                                {generatedContent}
                              </div>
                              
                              {/* Hashtags */}
                              {hashtags.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-[#2D3748]">
                                  <p className="text-xs text-[#CBD5E1] mb-2">Hashtags:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {hashtags.map((tag, i) => (
                                      <span key={i} className="px-2 py-1 bg-[#0B0F14] text-[#22C55E] rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Pipeline & Shaping Info */}
                            {(pipelineUsed || shapingInfo) && (
                              <div className="bg-[#1F2933] rounded-xl p-4">
                                <p className="text-xs font-medium text-[#22C55E] mb-3">Pipeline & Shaping Info</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {pipelineUsed && (
                                    <div className="bg-[#0B0F14] rounded-lg p-3">
                                      <p className="text-xs text-[#CBD5E1]">Pipeline</p>
                                      <p className="text-xs text-[#F9FAFB] font-medium mt-1">{pipelineUsed}</p>
                                    </div>
                                  )}
                                  {shapingInfo && (
                                    <>
                                      <div className="bg-[#0B0F14] rounded-lg p-3">
                                        <p className="text-xs text-[#CBD5E1]">Sinhala Shaping</p>
                                        <p className="text-xs text-[#22C55E] font-medium mt-1">
                                          {shapingInfo.nfc_normalized ? 'NFC Normalized' : 'Raw'}
                                        </p>
                                      </div>
                                      <div className="bg-[#0B0F14] rounded-lg p-3">
                                        <p className="text-xs text-[#CBD5E1]">ZWJ Sequences</p>
                                        <p className="text-xs text-[#F9FAFB] font-medium mt-1">{shapingInfo.zwj_count}</p>
                                      </div>
                                      <div className="bg-[#0B0F14] rounded-lg p-3">
                                        <p className="text-xs text-[#CBD5E1]">Conjuncts</p>
                                        <p className="text-xs text-[#F9FAFB] font-medium mt-1">
                                          Rakaransaya: {shapingInfo.rakaransaya_count} | Yansaya: {shapingInfo.yansaya_count}
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Poster Tab */}
                        {activeTab === 'poster' && generatedPosters.length > 0 && (
                          <div className="space-y-4">
                            {generatedPosters.map((poster, index) => (
                              <div key={index} className="bg-[#1F2933] rounded-xl p-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-medium text-[#F9FAFB]">
                                    {POSTER_SIZES.find(s => s.id === poster.size)?.label}
                                  </h3>
                                  <button
                                    onClick={() => handleDownloadPoster(poster)}
                                    className="px-3 py-1.5 bg-[#22C55E] text-[#0B0F14] rounded-lg text-xs hover:bg-[#16A34A] transition-colors cursor-pointer"
                                  >
                                    Download
                                  </button>
                                </div>
                                <div 
                                  className="bg-[#0B0F14] rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => openPosterModal(poster)}
                                >
                                  <img 
                                    src={poster.url} 
                                    alt={`${poster.size} poster`}
                                    className="w-full h-auto"
                                  />
                                </div>
                                <p className="text-xs text-[#CBD5E1] mt-3">
                                  Dimensions: {poster.dimensions} • Click to view full size
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1F2933] mb-4">
                          <SparklesIcon className="h-8 w-8 text-[#CBD5E1]" />
                        </div>
                        <h3 className="text-lg font-medium text-[#F9FAFB] mb-2">No Content Generated</h3>
                        <p className="text-[#CBD5E1] text-sm">Fill in the form and click a generate button to create your content</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Poster Preview Modal */}
            {showPosterModal && selectedPoster && (
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={closePosterModal}
              >
                <div 
                  className="bg-[#0B0F14] border border-[#1F2933] rounded-2xl max-w-5xl max-h-[90vh] overflow-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-[#0B0F14] border-b border-[#1F2933] p-6 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-[#F9FAFB]">
                        {POSTER_SIZES.find(s => s.id === selectedPoster.size)?.label}
                      </h3>
                      <p className="text-sm text-[#CBD5E1] mt-1">
                        {selectedPoster.dimensions} • {productName}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownloadPoster(selectedPoster)}
                        className="px-4 py-2 bg-[#22C55E] text-[#0B0F14] rounded-lg text-sm font-medium hover:bg-[#16A34A] transition-colors flex items-center gap-2"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                        Download Poster
                      </button>
                      <button
                        onClick={closePosterModal}
                        className="px-4 py-2 bg-[#1F2933] text-[#F9FAFB] rounded-lg text-sm font-medium hover:bg-[#2D3748] transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6">
                    <div className="bg-[#1F2933] rounded-lg overflow-hidden">
                      <img 
                        src={selectedPoster.url} 
                        alt={`${selectedPoster.size} poster preview`}
                        className="w-full h-auto"
                      />
                    </div>
                    
                    {/* Poster Info */}
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="bg-[#1F2933] rounded-lg p-4">
                        <p className="text-xs text-[#CBD5E1] mb-1">Format</p>
                        <p className="text-sm text-[#F9FAFB] font-medium">PNG Image</p>
                      </div>
                      <div className="bg-[#1F2933] rounded-lg p-4">
                        <p className="text-xs text-[#CBD5E1] mb-1">Dimensions</p>
                        <p className="text-sm text-[#F9FAFB] font-medium">{selectedPoster.dimensions}</p>
                      </div>
                      <div className="bg-[#1F2933] rounded-lg p-4">
                        <p className="text-xs text-[#CBD5E1] mb-1">Platform</p>
                        <p className="text-sm text-[#F9FAFB] font-medium">
                          {POSTER_SIZES.find(s => s.id === selectedPoster.size)?.label.split(' ')[0]}
                        </p>
                      </div>
                      <div className="bg-[#1F2933] rounded-lg p-4">
                        <p className="text-xs text-[#CBD5E1] mb-1">Product</p>
                        <p className="text-sm text-[#F9FAFB] font-medium">{productName}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
