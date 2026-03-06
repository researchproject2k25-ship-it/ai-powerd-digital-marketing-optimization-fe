/**
 * Main form data processor that handles language detection, translation, and JSON conversion
 */

import { MarketingStrategyFormData } from '@/types';
import { detectLanguagesInFormData, getTextFieldsForTranslation } from '@/utils/languageDetection';
import { TranslationService, createTranslationService, TranslationResponse } from '@/services/translationService';
import { FormDataProcessor, ProcessedFormData, exportFormDataAsJSON } from '@/services/jsonConversionService';
import { apiService, BackendSubmissionResponse } from '@/services/apiService';

export interface ProcessingResult {
  success: boolean;
  data: ProcessedFormData;
  translations: TranslationResponse[];
  originalLanguages: Record<string, 'si' | 'en'>;
  processingMetadata: {
    submissionDate: string;
    detectedLanguage: 'si' | 'en' | 'mixed';
    translationApplied: boolean;
    translatedFieldsCount: number;
    totalProcessingTime: number;
    completionRate: number;
  };
  errors?: string[];
}

export interface ProcessingOptions {
  enableTranslation?: boolean;
  translationProvider?: 'google' | 'libre' | 'mock';
  exportAsFile?: boolean;
  includeMetadata?: boolean;
  removeEmptyFields?: boolean;
}

export class FormDataProcessorService {
  private translationService: TranslationService;

  constructor(translationService?: TranslationService) {
    this.translationService = translationService || createTranslationService();
  }

  /**
   * Convert form data with step-based keys to expected structure
   */
  private normalizeFormData(formData: any): MarketingStrategyFormData {
    return {
      businessProfile: formData.businessprofile || {},
      targetAudience: formData.targetaudience || {},
      businessGoals: formData.businessgoals || {},
      budgetResources: formData.budgetresources || {},
      platformsPreferences: formData.platformspreferences || {},
      currentChallenges: formData.currentchallenges || {},
      strengthsOpportunities: formData.strengthsopportunities || {},
      marketSituation: formData.marketsituation || {},
    };
  }

  /**
   * Main processing method that handles the complete workflow
   */
  async processFormData(
    formData: any, // Accept any format and normalize it internally
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const {
      enableTranslation = true,
      includeMetadata = true,
      removeEmptyFields = true,
    } = options;

    try {
      // Normalize form data structure first
      const normalizedFormData = this.normalizeFormData(formData);
      
      // Step 1: Detect languages in form data
      console.group('🔍 Language Detection Phase');
      console.log('Analyzing form data for language content...');
      const languageMap = detectLanguagesInFormData(normalizedFormData);
      const textFields = getTextFieldsForTranslation(normalizedFormData);
      console.log('Language mapping:', languageMap);
      console.log('Text fields found:', textFields.length);
      console.groupEnd();
      
      // Determine overall language
      const sinhalaFields = textFields.filter(field => field.language === 'si');
      const englishFields = textFields.filter(field => field.language === 'en');
      
      let detectedLanguage: 'si' | 'en' | 'mixed' = 'en';
      if (sinhalaFields.length > 0 && englishFields.length > 0) {
        detectedLanguage = 'mixed';
      } else if (sinhalaFields.length > 0) {
        detectedLanguage = 'si';
      }

      console.group('📊 Language Analysis Results');
      console.log(`Sinhala fields: ${sinhalaFields.length}`);
      console.log(`English fields: ${englishFields.length}`);
      console.log(`Overall detected language: ${detectedLanguage}`);
      sinhalaFields.forEach((field, i) => {
        console.log(`  Sinhala ${i + 1}: ${field.path} = "${field.text.substring(0, 50)}..."`);
      });
      console.groupEnd();

      // Step 2: Translate Sinhala content if enabled
      let translatedFormData = normalizedFormData;
      let translations: TranslationResponse[] = [];
      let translationApplied = false;

      if (enableTranslation && sinhalaFields.length > 0) {
        console.group('🌐 Translation Phase');
        console.log(`Starting translation of ${sinhalaFields.length} Sinhala fields...`);
        
        try {
          const translationResult = await this.translationService.translateFormData(
            normalizedFormData,
            textFields
          );
          
          translatedFormData = translationResult.translatedData;
          translations = translationResult.translations;
          translationApplied = translations.length > 0;
          
          console.log('Translation Results:');
          translations.forEach((t, i) => {
            console.log(`  ${i + 1}. "${t.originalText}" → "${t.translatedText}"`);
          });
          console.log(`✅ Successfully translated ${translations.length} fields`);
        } catch (error) {
          console.warn('⚠️ Translation failed, proceeding with original data:', error);
          // Continue with original data if translation fails
        }
        console.groupEnd();
      }

      // Step 3: Convert to structured JSON
      console.group('📋 JSON Conversion Phase');
      console.log('Converting to structured JSON format...');
      const processedData = FormDataProcessor.convertToStructuredJSON(
        translatedFormData,
        {
          includeMetadata,
          removeEmptyFields,
        }
      );
      console.log('JSON structure created with sections:', Object.keys(processedData));
      console.groupEnd();

      // Step 4: Update metadata with processing information
      if (processedData.metadata) {
        processedData.metadata.language = detectedLanguage;
        processedData.metadata.translationApplied = translationApplied;
      }

      const endTime = Date.now();
      const totalProcessingTime = endTime - startTime;

      // Step 5: Create result object
      const result: ProcessingResult = {
        success: true,
        data: processedData,
        translations,
        originalLanguages: languageMap,
        processingMetadata: {
          submissionDate: new Date().toISOString(),
          detectedLanguage,
          translationApplied,
          translatedFieldsCount: translations.length,
          totalProcessingTime,
          completionRate: processedData.metadata?.completionRate || 0,
        },
      };

      console.group('🎉 Processing Complete');
      console.log(`Total processing time: ${totalProcessingTime}ms`);
      console.log('Final result summary:', {
        success: true,
        language: detectedLanguage,
        translationApplied,
        fieldsTranslated: translations.length,
        completionRate: processedData.metadata?.completionRate + '%',
        dataStructure: Object.keys(processedData)
      });
      console.groupEnd();
      return result;

    } catch (error) {
      console.error('❌ Form data processing failed:', error);
      
      return {
        success: false,
        data: {} as ProcessedFormData,
        translations: [],
        originalLanguages: {},
        processingMetadata: {
          submissionDate: new Date().toISOString(),
          detectedLanguage: 'en',
          translationApplied: false,
          translatedFieldsCount: 0,
          totalProcessingTime: Date.now() - startTime,
          completionRate: 0,
        },
        errors: [error instanceof Error ? error.message : 'Unknown processing error'],
      };
    }
  }

  /**
   * Generate AI-ready prompt from processed data
   */
  generateAIPrompt(processedData: ProcessedFormData): string {
    return FormDataProcessor.generateAIPrompt(processedData);
  }

  /**
   * Export processed data as JSON file
   */
  exportAsJSON(processedData: ProcessedFormData, filename?: string) {
    return exportFormDataAsJSON(processedData, filename);
  }

  /**
   * Send processed data to backend API
   */
  async sendToBackend(processedData: ProcessedFormData, profileId?: string | null): Promise<BackendSubmissionResponse> {
    try {
      // Convert processed data to the backend's expected format
      const backendData = this.convertToBackendFormat(processedData);
      
      // Test connection first
      console.log('🔄 Testing backend connection...');
      await apiService.testConnection();
      console.log('✅ Backend connection successful');
      
      // Submit or update form data
      if (profileId) {
        console.log('🔄 Updating profile:', profileId);
        const result = await apiService.updateProfile(profileId, backendData);
        return result;
      } else {
        console.log('🔄 Submitting new form data to backend...');
        const result = await apiService.submitForm(backendData);
        return result;
      }
      
    } catch (error) {
      console.error('Failed to send data to backend:', error);
      throw error;
    }
  }

  /**
   * Convert processed form data to backend API format
   */
  private convertToBackendFormat(processedData: ProcessedFormData): any {
    return {
      business_profile: {
        business_name: processedData.businessProfile?.businessType || 'Unknown Business', // Use as placeholder
        business_type: processedData.businessProfile?.businessType || '',
        business_size: this.mapToBackendBusinessSize(processedData.businessProfile?.businessSize || ''),
        business_stage: this.mapToBackendBusinessStage(processedData.businessProfile?.businessStage || ''),
        location: `${processedData.businessProfile?.location?.city || ''}, ${processedData.businessProfile?.location?.district || ''}`,
        years_in_business: undefined, // Not captured in current form
        unique_selling_proposition: processedData.businessProfile?.uniqueSellingProposition || ''
      },
      budget_resources: {
        monthly_marketing_budget: this.parsebudget(processedData.marketingBudget?.monthlyBudget || ''),
        budget_currency: 'LKR',
        team_size: processedData.marketingBudget?.teamSize,
        has_marketing_experience: processedData.marketingBudget?.hasMarketingTeam || false,
        external_support_budget: undefined // Not captured in current form
      },
      business_goals: {
        primary_marketing_goal: this.mapToBackendMarketingGoal(processedData.businessGoals?.primaryGoal),
        secondary_marketing_goals: (processedData.businessGoals?.secondaryGoals || []).map(goal => 
          this.mapToBackendMarketingGoal(goal)
        ),
        specific_objectives: undefined, // Not captured in current form
        success_metrics: undefined // Not captured in current form
      },
      target_audience: {
        age_range: processedData.targetMarket?.demographics?.ageRange || '',
        gender: (processedData.targetMarket?.demographics?.gender || []).join(', '),
        location_demographics: processedData.targetMarket?.location || '',
        interests: (processedData.targetMarket?.interests || []).join(', '),
        buying_behavior: processedData.targetMarket?.buyingFrequency || '',
        pain_points: undefined // Not captured in current form
      },
      platforms_preferences: {
        preferred_platforms: (processedData.digitalPresence?.preferredPlatforms || []).map(platform => 
          this.mapToBackendSocialPlatform(platform)
        ),
        current_online_presence: Object.keys(processedData.digitalPresence?.platformExperience || {}).join(', '),
        website_url: undefined, // Not captured in current form
        has_brand_assets: processedData.digitalPresence?.brandAssets?.hasLogo || false,
        brand_guidelines: processedData.digitalPresence?.brandAssets?.hasBrandStyle ? 'Available' : 'Not available'
      },
      current_challenges: {
        main_challenges: (processedData.challenges?.currentChallenges || []).map(challenge => 
          this.mapToBackendChallenge(challenge)
        ),
        specific_obstacles: processedData.challenges?.additionalChallenges,
        previous_marketing_efforts: undefined, // Not captured in current form
        what_didnt_work: undefined // Not captured in current form
      },
      strengths_opportunities: {
        business_strengths: (processedData.opportunities?.strengths || []).join(', '),
        competitive_advantages: undefined, // Not captured in current form
        market_opportunities: (processedData.opportunities?.opportunities || []).join(', '),
        growth_areas: processedData.opportunities?.additionalNotes
      },
      market_situation: {
        seasonal_factors: (processedData.marketSituation?.seasonality || []).map(s => 
          `${s.category}: ${(s.factors || []).join(', ')}`
        ).join('; '),
        competition_level: processedData.marketSituation?.competitorBehavior || '',
        market_trends: undefined, // Not captured in current form
        pricing_strategy: processedData.marketSituation?.pricingChanges?.hasRecentChanges ? 
          `Recent changes: ${processedData.marketSituation.pricingChanges.details || ''}` : 'Stable pricing'
      },
      form_language: processedData.metadata?.language || 'en',
      submission_source: 'web_form'
    };
  }

  // Helper methods for backend enum mapping
  private mapToBackendBusinessSize(size: string): string {
    const sizeMap: Record<string, string> = {
      'Solo Entrepreneur': 'micro',
      'Small Team (2-10 employees)': 'small',
      'Medium Business (11-50 employees)': 'medium',
      'Large Business (50+ employees)': 'medium' // Map large to medium as backend only has micro/small/medium
    };
    return sizeMap[size] || 'small';
  }

  private mapToBackendBusinessStage(stage: string): string {
    const stageMap: Record<string, string> = {
      'New Business (0-1 years)': 'startup',
      'Growing Business (1-5 years)': 'growing',
      'Established Business (5+ years)': 'established'
    };
    return stageMap[stage] || 'growing';
  }

  private mapToBackendMarketingGoal(goal: string): string {
    const goalMap: Record<string, string> = {
      'Brand Awareness': 'increase_brand_awareness',
      'Lead Generation': 'generate_leads',
      'Direct Sales': 'boost_sales',
      'Customer Retention': 'customer_retention',
      'Local Store Visits': 'market_expansion',
      'Website Traffic': 'improve_customer_engagement'
    };
    return goalMap[goal] || 'increase_brand_awareness';
  }

  private mapToBackendSocialPlatform(platform: string): string {
    const platformMap: Record<string, string> = {
      'facebook': 'facebook',
      'instagram': 'instagram',
      'linkedin': 'linkedin',
      'twitter': 'twitter',
      'tiktok': 'tiktok',
      'youtube': 'youtube',
      'whatsapp': 'whatsapp'
    };
    return platformMap[platform.toLowerCase()] || platform.toLowerCase();
  }

  private mapToBackendChallenge(challenge: string): string {
    const challengeMap: Record<string, string> = {
      'Limited budget': 'limited_budget',
      'Lack of marketing expertise': 'lack_of_expertise',
      'Time constraints': 'time_constraints',
      'Measuring ROI': 'measuring_roi',
      'Content creation': 'content_creation',
      'Reaching target audience': 'reaching_target_audience'
    };
    return challengeMap[challenge] || 'limited_budget';
  }

  private parsebudget(budget: string): number | null {
    if (!budget) return null;
    // Extract numeric value from budget string
    const numericValue = budget.replace(/[^0-9.]/g, '');
    return numericValue ? parseFloat(numericValue) : null;
  }

  /**
   * Complete workflow: Process form data and send to backend
   */
  async processAndSubmit(
    formData: any, // Accept any format and normalize internally
    options: ProcessingOptions = {},
    profileId?: string | null // Optional profile ID for updates
  ) {
    // Process the form data
    const processingResult = await this.processFormData(formData, options);
    
    if (!processingResult.success) {
      throw new Error(`Processing failed: ${processingResult.errors?.join(', ')}`);
    }

    // Generate AI prompt for logging/debugging
    const aiPrompt = this.generateAIPrompt(processingResult.data);
    console.log('🤖 Generated AI Prompt:', aiPrompt);

    // Send to backend (create or update)
    try {
      const backendResponse = await this.sendToBackend(processingResult.data, profileId);
      
      return {
        ...processingResult,
        backendResponse,
        aiPrompt,
      };
    } catch (error) {
      console.error('Backend submission failed:', error);
      
      // Return processing result even if backend fails
      return {
        ...processingResult,
        backendError: error instanceof Error ? error.message : 'Backend submission failed',
        aiPrompt,
      };
    }
  }

  /**
   * Validate form data completeness
   */
  validateFormData(formData: any): {
    isValid: boolean;
    missingFields: string[];
    completionRate: number;
  } {
    // The form data uses step IDs with hyphens removed as keys
    const businessProfile = formData.businessprofile || {};
    const targetAudience = formData.targetaudience || {};
    const businessGoals = formData.businessgoals || {};
    const budgetResources = formData.budgetresources || {};
    const platformsPreferences = formData.platformspreferences || {};

    const requiredFields = [
      { path: 'businessProfile.businessType', value: businessProfile.businessType },
      { path: 'businessProfile.industry', value: businessProfile.industry },
      { path: 'businessProfile.businessSize', value: businessProfile.businessSize },
      { path: 'businessProfile.location.city', value: businessProfile.location?.city },
      { path: 'targetAudience.demographics.ageRange', value: targetAudience.demographics?.ageRange },
      { path: 'businessGoals.primaryGoal', value: businessGoals.primaryGoal },
      { path: 'budgetResources.monthlyBudget', value: budgetResources.monthlyBudget },
      // platformsPreferences.preferredPlatforms is optional - removed from required fields
    ];

    const missingFields: string[] = [];
    let completedCount = 0;

    for (const field of requiredFields) {
      if (!field.value || 
          (Array.isArray(field.value) && field.value.length === 0) ||
          (typeof field.value === 'string' && field.value.trim() === '')) {
        missingFields.push(field.path);
      } else {
        completedCount++;
      }
    }

    const completionRate = Math.round((completedCount / requiredFields.length) * 100);
    const isValid = missingFields.length === 0;

    return {
      isValid,
      missingFields,
      completionRate,
    };
  }
}

// Export singleton instance
export const formDataProcessor = new FormDataProcessorService();