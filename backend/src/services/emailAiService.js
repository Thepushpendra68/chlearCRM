const { GoogleGenerativeAI } = require('@google/generative-ai');
const leadService = require('./leadService');
const ApiError = require('../utils/ApiError');

/**
 * Email AI Service
 * AI-powered features for email templates, sequences, and sending
 */
class EmailAiService {
  constructor() {
    this.useFallback = false;
    this.availableModels = [];

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('[EMAIL AI] ⚠️  GEMINI_API_KEY not configured - AI features disabled');
      this.useFallback = true;
      return;
    }

    try {
      console.log('[EMAIL AI] 🔄 Initializing Gemini AI...');
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.apiKey = apiKey;
      // Detect available models for this key/region/version and bind
      this._ready = this.initModels().catch((err) => {
        console.error('[EMAIL AI] ❌ Model detection failed:', err.message);
        this.useFallback = true;
      });
    } catch (error) {
      console.error('[EMAIL AI] ❌ Failed to initialize:', error.message);
      this.useFallback = true;
    }
  }

  // ============================================
  // TEMPLATE AI FEATURES
  // ============================================

  /**
   * Generate email template from description
   */
  async generateTemplateFromDescription(description, templateType = 'general', context = {}) {
    if (this.useFallback) {
      throw new ApiError('AI features not available', 503);
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (this.useFallback || !this.contentModel) {
      throw new ApiError('AI features not available (model not initialized)', 503);
    }

    try {
      const prompt = `Generate a professional B2B email template in HTML format.

Description: ${description}
Template Type: ${templateType}
Industry: ${context.industry || 'General B2B'}
Tone: ${context.tone || 'Professional and friendly'}

Requirements:
1. Clean, responsive HTML structure
2. Use Handlebars variables: {{lead.first_name}}, {{lead.company}}, {{lead.name}}, {{company.name}}
3. Include a clear call-to-action
4. Mobile-friendly design
5. Professional styling with inline CSS
6. Subject line that's engaging and under 50 characters
7. Unsubscribe link: {{unsubscribe_url}}

Generate response in JSON format:
{
  "subject": "Email subject line",
  "html": "Complete HTML email template",
  "description": "Brief description of the template",
  "suggested_folder": "Folder name (e.g., sales, marketing, support)",
  "recommended_use": "When to use this template"
}`;

      const result = await this.contentModel.generateContent(prompt);
      const text = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      const templateData = JSON.parse(jsonMatch[0]);
      return templateData;
    } catch (error) {
      console.error('[EMAIL AI] Template generation error:', error);
      throw new ApiError('Failed to generate template: ' + error.message, 500);
    }
  }

  /**
   * Generate subject line variants for A/B testing
   */
  async generateSubjectVariants(originalSubject, lead = {}, count = 5) {
    if (this.useFallback) {
      return [originalSubject];
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (this.useFallback || !this.fastModel) {
      return [originalSubject];
    }

    try {
      const prompt = `Generate ${count} compelling email subject line variants for A/B testing.

Original Subject: ${originalSubject}
${lead.name ? `Recipient: ${lead.name}` : ''}
${lead.company ? `Company: ${lead.company}` : ''}
${lead.industry ? `Industry: ${lead.industry}` : ''}

Requirements:
- Each under 50 characters
- Professional B2B tone
- Action-oriented
- Avoid spam trigger words
- Create diverse approaches (curiosity, value, urgency, personalization, question)
- Include personalization where possible

Return as JSON array of objects:
[
  {
    "subject": "Subject line text",
    "strategy": "Strategy used (e.g., curiosity, value, personalization)",
    "estimated_open_rate": "low/medium/high"
  }
]`;

      const result = await this.fastModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [{ subject: originalSubject, strategy: 'original', estimated_open_rate: 'medium' }];
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Subject variant generation error:', error);
      return [{ subject: originalSubject, strategy: 'original', estimated_open_rate: 'medium' }];
    }
  }

  /**
   * Optimize email template content
   */
  async optimizeTemplateContent(html, subject, goals = ['engagement', 'clarity']) {
    if (this.useFallback) {
      throw new ApiError('AI features not available', 503);
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.contentModel) {
      throw new ApiError('AI features not available (model not initialized)', 503);
    }

    try {
      const prompt = `Optimize this email template for better performance.

Current Subject: ${subject}
Current HTML: ${html.substring(0, 2000)}${html.length > 2000 ? '...' : ''}

Optimization Goals: ${goals.join(', ')}

Analyze and improve:
1. Subject line - make it more compelling
2. Email copy - improve clarity and engagement
3. Call-to-action - make it more prominent
4. Structure - improve readability
5. Personalization - suggest where to add variables

Return JSON:
{
  "improved_subject": "New subject line",
  "improved_html": "Optimized HTML",
  "improvements_made": ["List of specific improvements"],
  "recommendations": ["Additional suggestions"]
}`;

      const result = await this.contentModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Content optimization error:', error);
      throw new ApiError('Failed to optimize content: ' + error.message, 500);
    }
  }

  /**
   * Suggest personalization variables for template
   */
  async suggestPersonalizationVariables(html, templatePurpose = '') {
    if (this.useFallback) {
      return [];
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.fastModel) {
      return [];
    }

    try {
      const prompt = `Analyze this email template and suggest personalization variables.

Template HTML: ${html.substring(0, 1500)}
Purpose: ${templatePurpose}

Suggest:
1. Which variables should be added
2. Where they should be placed
3. Why they would improve personalization

Current variables detected: {{lead.name}}, {{lead.company}}, etc.

Return JSON array:
[
  {
    "variable": "Variable name (e.g., lead.title)",
    "location": "Where to add it",
    "reason": "Why it improves personalization",
    "example": "Example usage"
  }
]`;

      const result = await this.fastModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Personalization suggestion error:', error);
      return [];
    }
  }

  // ============================================
  // SEQUENCE AI FEATURES
  // ============================================

  /**
   * Generate email sequence from goal
   */
  async generateSequenceFromGoal(goal, leadType = 'prospect', sequenceLength = 5) {
    if (this.useFallback) {
      throw new ApiError('AI features not available', 503);
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.contentModel) {
      throw new ApiError('AI features not available (model not initialized)', 503);
    }

    try {
      const prompt = `Design an effective email sequence for B2B sales.

Goal: ${goal}
Lead Type: ${leadType}
Desired Length: ${sequenceLength} steps

Create a sequence with:
1. Appropriate email touchpoints
2. Optimal timing between emails
3. Progressive value delivery
4. Clear objectives for each step

Return JSON:
{
  "sequence_name": "Descriptive name",
  "description": "Sequence overview",
  "steps": [
    {
      "step_number": 1,
      "email_purpose": "Purpose of this email",
      "subject_suggestion": "Suggested subject line",
      "key_points": ["Main points to cover"],
      "wait_days": 0,
      "wait_hours": 0,
      "template_type": "Type of template needed",
      "success_criteria": "What defines success for this step"
    }
  ],
  "best_practices": ["Tips for this sequence"]
}`;

      const result = await this.contentModel.generateContent(prompt);
      const text = result.response.text();
      
      console.log('[EMAIL AI] Raw AI response:', text.substring(0, 500));
      
      // Try to extract JSON from markdown code blocks if present
      let jsonText = text;
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1];
      } else {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
      }
      
      if (!jsonText || jsonText === text && !text.trim().startsWith('{')) {
        console.error('[EMAIL AI] Could not find JSON in response');
        throw new Error('Failed to parse AI response - no JSON found');
      }

      const parsedData = JSON.parse(jsonText);
      console.log('[EMAIL AI] Successfully parsed sequence with', parsedData.steps?.length || 0, 'steps');
      return parsedData;
    } catch (error) {
      console.error('[EMAIL AI] Sequence generation error:', error);
      console.error('[EMAIL AI] Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });
      
      // Provide more specific error messages
      if (error.message?.includes('API key')) {
        throw new ApiError('Invalid or missing Gemini API key. Please configure GEMINI_API_KEY in backend/.env', 503);
      } else if (error.message?.includes('quota')) {
        throw new ApiError('Gemini API quota exceeded. Please try again later.', 429);
      } else if (error.message?.includes('parse')) {
        throw new ApiError('Failed to parse AI response. Please try again.', 500);
      }
      
      throw new ApiError('Failed to generate sequence: ' + error.message, 500);
    }
  }

  /**
   * Suggest optimal sequence timing
   */
  async suggestSequenceTiming(sequenceSteps, targetAudience = {}) {
    if (this.useFallback) {
      return sequenceSteps;
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.fastModel) {
      return { optimized_steps: sequenceSteps, recommendations: [] };
    }

    try {
      const prompt = `Optimize timing for this email sequence.

Sequence Steps: ${JSON.stringify(sequenceSteps, null, 2)}
Target Audience: ${JSON.stringify(targetAudience)}

Consider:
1. B2B best practices
2. Decision-maker schedules
3. Engagement patterns
4. Time zones (if applicable)

Return JSON with optimized timing:
{
  "optimized_steps": [
    {
      "step_number": 1,
      "wait_days": 0,
      "wait_hours": 0,
      "best_send_time": "Time of day (e.g., 10:00 AM)",
      "reasoning": "Why this timing works"
    }
  ],
  "overall_duration": "Total sequence duration",
  "recommendations": ["Timing best practices"]
}`;

      const result = await this.fastModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { optimized_steps: sequenceSteps, recommendations: [] };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Timing optimization error:', error);
      return { optimized_steps: sequenceSteps, recommendations: [] };
    }
  }

  // ============================================
  // SENDING AI FEATURES
  // ============================================

  /**
   * Generate personalized subject line for specific lead
   */
  async generatePersonalizedSubject(lead, emailContext = {}) {
    if (this.useFallback) {
      return emailContext.default_subject || 'Important Update';
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.fastModel) {
      return emailContext.default_subject || 'Important Update';
    }

    try {
      const prompt = `Generate a highly personalized email subject line.

Lead Information:
- Name: ${lead.first_name} ${lead.last_name}
- Company: ${lead.company || 'N/A'}
- Title: ${lead.title || 'N/A'}
- Industry: ${lead.industry || 'N/A'}
- Status: ${lead.status || 'new'}
- Source: ${lead.source || 'unknown'}

Email Context:
- Purpose: ${emailContext.purpose || 'Follow-up'}
- Previous Interactions: ${emailContext.previous_emails || 0} emails sent
- Last Interaction: ${emailContext.last_interaction || 'None'}

Generate a subject line that:
1. Is personal and relevant
2. References their role or company when appropriate
3. Creates curiosity or urgency
4. Is under 50 characters
5. Avoids spam triggers

Return JSON:
{
  "subject": "Personalized subject line",
  "personalization_elements": ["What makes it personal"],
  "alternative": "Backup subject line"
}`;

      const result = await this.fastModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return emailContext.default_subject || 'Important Update';
      }

      const data = JSON.parse(jsonMatch[0]);
      return data.subject;
    } catch (error) {
      console.error('[EMAIL AI] Personalized subject generation error:', error);
      return emailContext.default_subject || 'Important Update';
    }
  }

  /**
   * Generate personalized email body content
   */
  async generatePersonalizedEmailBody(lead, templateContext = {}) {
    if (this.useFallback) {
      throw new ApiError('AI features not available', 503);
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.contentModel) {
      throw new ApiError('AI features not available (model not initialized)', 503);
    }

    try {
      const prompt = `Write a personalized B2B sales email.

Lead Details:
- Name: ${lead.first_name} ${lead.last_name}
- Company: ${lead.company || 'N/A'}
- Title: ${lead.title || 'N/A'}
- Industry: ${lead.industry || 'N/A'}
- Status: ${lead.status}
${lead.deal_value ? `- Deal Value: $${lead.deal_value}` : ''}
${lead.notes ? `- Notes: ${lead.notes.substring(0, 200)}` : ''}

Email Purpose: ${templateContext.purpose || 'Professional introduction and value proposition'}
Tone: ${templateContext.tone || 'Professional and friendly'}
Key Points: ${templateContext.key_points ? templateContext.key_points.join(', ') : 'Value proposition, credibility, next steps'}

Write an email that:
1. Opens with personal reference to them or their company
2. Clearly states value proposition
3. Is concise (3-4 paragraphs max)
4. Includes clear call-to-action
5. Professional yet conversational
6. Uses Handlebars variables: {{lead.first_name}}, {{lead.company}}

Return JSON:
{
  "subject": "Email subject line",
  "html": "HTML email body with inline CSS",
  "text": "Plain text version",
  "personalization_notes": ["How it's personalized"]
}`;

      const result = await this.contentModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Email body generation error:', error);
      throw new ApiError('Failed to generate email body: ' + error.message, 500);
    }
  }

  /**
   * Suggest optimal send time for lead
   */
  async suggestOptimalSendTime(lead, timezone = 'America/New_York') {
    if (this.useFallback) {
      return { hour: 10, minute: 0, reasoning: 'Default: 10 AM' };
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.fastModel) {
      return { hour: 10, minute: 0, reasoning: 'Default: 10 AM' };
    }

    try {
      const prompt = `Suggest optimal email send time.

Lead: ${lead.title || 'Professional'} at ${lead.company || 'company'}
Industry: ${lead.industry || 'General B2B'}
Timezone: ${timezone}

Based on B2B best practices and this lead's profile, suggest:
1. Best time of day
2. Best day of week
3. Why this timing works

Return JSON:
{
  "recommended_hour": 10,
  "recommended_minute": 0,
  "recommended_day": "Tuesday",
  "reasoning": "Why this time is optimal",
  "alternative_times": ["Other good options"]
}`;

      const result = await this.fastModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { hour: 10, minute: 0, reasoning: 'Default: 10 AM' };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Send time optimization error:', error);
      return { hour: 10, minute: 0, reasoning: 'Default: 10 AM' };
    }
  }

  // ============================================
  // ANALYTICS AI FEATURES
  // ============================================

  /**
   * Analyze email performance metrics
   */
  async analyzeEmailPerformance(metrics, templateInfo = {}) {
    if (this.useFallback) {
      return {
        assessment: 'Performance data recorded',
        recommendations: []
      };
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.contentModel) {
      return { assessment: 'AI not initialized', recommendations: [] };
    }

    try {
      const prompt = `Analyze email campaign performance and provide actionable insights.

Metrics:
- Sent: ${metrics.sent || 0}
- Delivered: ${metrics.delivered || 0} (${metrics.delivery_rate || 0}%)
- Opened: ${metrics.opened || 0} (${metrics.open_rate || 0}%)
- Clicked: ${metrics.clicked || 0} (${metrics.click_rate || 0}%)
- Bounced: ${metrics.bounced || 0} (${metrics.bounce_rate || 0}%)
- Unsubscribed: ${metrics.unsubscribed || 0}

Template: ${templateInfo.name || 'Email campaign'}
Industry Benchmarks: Open rate 20-25%, Click rate 2-5%

Provide:
1. Performance assessment
2. Specific improvement recommendations
3. What's working well
4. Priority actions

Return JSON:
{
  "overall_score": "Score out of 100",
  "performance_level": "excellent/good/average/poor",
  "strengths": ["What's working well"],
  "weaknesses": ["What needs improvement"],
  "recommendations": [
    {
      "area": "Area to improve",
      "suggestion": "Specific action",
      "expected_impact": "Expected improvement",
      "priority": "high/medium/low"
    }
  ],
  "key_insights": ["Notable findings"]
}`;

      const result = await this.contentModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          assessment: 'Performance analysis unavailable',
          recommendations: []
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Performance analysis error:', error);
      return {
        assessment: 'Performance data recorded',
        recommendations: [],
        error: error.message
      };
    }
  }

  /**
   * Predict email engagement likelihood
   */
  async predictEngagement(lead, emailData, historicalData = {}) {
    if (this.useFallback) {
      return { likelihood: 'medium', score: 50 };
    }
    if (this._ready) { try { await this._ready; } catch {} }
    if (!this.fastModel) {
      return { likelihood: 'medium', score: 50 };
    }

    try {
      const prompt = `Predict likelihood of email engagement.

Lead Profile:
- Status: ${lead.status}
- Source: ${lead.source}
- Previous Opens: ${historicalData.previous_opens || 0}
- Previous Clicks: ${historicalData.previous_clicks || 0}
- Last Engaged: ${historicalData.last_engaged || 'Never'}
- Deal Value: ${lead.deal_value || 'Unknown'}

Email Details:
- Subject: ${emailData.subject}
- Has Personalization: ${emailData.has_personalization ? 'Yes' : 'No'}
- Call-to-Action: ${emailData.has_cta ? 'Yes' : 'No'}

Predict engagement and provide reasoning.

Return JSON:
{
  "engagement_likelihood": "high/medium/low",
  "confidence_score": 75,
  "open_probability": 65,
  "click_probability": 15,
  "factors": {
    "positive": ["Factors increasing engagement"],
    "negative": ["Factors decreasing engagement"]
  },
  "recommendations": ["How to improve engagement likelihood"]
}`;

      const result = await this.fastModel.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { likelihood: 'medium', score: 50 };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[EMAIL AI] Engagement prediction error:', error);
      return { likelihood: 'medium', score: 50, error: error.message };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if AI is available
   */
  isAvailable() {
    return !this.useFallback;
  }

  /**
   * Discover available models and bind primary/fast models
   */
  async initModels() {
    // Candidate lists (ordered by preference)
    const primaryCandidates = [
      // Latest stable first
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      // Fall back to flash-lite and 2.0 family
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      // 1.5/1.0 families and legacy
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-pro',
      'gemini-pro-latest',
      // Previews (if enabled on the key)
      'gemini-2.5-pro-preview-06-05',
      'gemini-2.5-pro-preview-03-25',
      'gemini-2.5-flash-preview-05-20',
      'gemini-2.5-flash-lite-preview-06-17'
    ];
    const fastCandidates = [
      // Prefer fastest tier
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      // 1.5 fast models
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
      // Fallbacks
      'gemini-1.0-pro',
      'gemini-pro',
      'gemini-pro-latest',
      // Previews
      'gemini-2.5-flash-preview-05-20',
      'gemini-2.5-flash-lite-preview-06-17'
    ];

    const tryModel = async (modelId) => {
      try {
        const m = this.genAI.getGenerativeModel({ model: modelId });
        // Lightweight probe to confirm generateContent works for this key/version
        const resp = await m.generateContent('ping');
        const ok = !!resp?.response?.text;
        return ok ? m : null;
      } catch (e) {
        // 404 or unsupported → not usable for this key/version
        return null;
      }
    };

    let primaryModel = null;
    for (const id of primaryCandidates) {
      primaryModel = await tryModel(id);
      if (primaryModel) {
        this.primaryModelId = id;
        break;
      }
    }

    let fastModel = null;
    for (const id of fastCandidates) {
      fastModel = await tryModel(id);
      if (fastModel) {
        this.fastModelId = id;
        break;
      }
    }

    // Fallback fast to primary if only one worked
    if (!fastModel && primaryModel) {
      fastModel = primaryModel;
      this.fastModelId = this.primaryModelId;
    }

    if (!primaryModel) {
      throw new Error('No Gemini model with generateContent available for this API key');
    }

    this.contentModel = primaryModel;
    this.fastModel = fastModel || primaryModel;

    console.log('[EMAIL AI] ✅ AI service initialized');
    console.log('[EMAIL AI] 📊 Using models:', { primary: this.primaryModelId, fast: this.fastModelId });
  }

  /**
   * Generate content with retry logic
   */
  async generateWithRetry(model, prompt, maxRetries = 2) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        lastError = error;
        console.warn(`[EMAIL AI] Attempt ${i + 1} failed:`, error.message);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }
    throw lastError;
  }
}

module.exports = new EmailAiService();

