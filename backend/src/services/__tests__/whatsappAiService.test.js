/**
 * WhatsApp AI Service Tests
 * Tests for AI chatbot integration with WhatsApp
 */

const whatsappAiService = require('../whatsappAiService');
const chatbotService = require('../chatbotService');
const whatsappSendService = require('../whatsappSendService');
const { supabaseAdmin } = require('../../config/supabase');

jest.mock('../chatbotService');
jest.mock('../whatsappSendService');
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn()
}));
jest.mock('../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('WhatsApp AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectLanguage', () => {
    it('should detect Hindi from Devanagari script', () => {
      const hindiText = 'नमस्ते, मैं एक लीड बनाना चाहता हूं';
      expect(whatsappAiService.detectLanguage(hindiText)).toBe('hi');
    });

    it('should detect Tamil from Tamil script', () => {
      const tamilText = 'வணக்கம், நான் ஒரு லீட் உருவாக்க விரும்புகிறேன்';
      expect(whatsappAiService.detectLanguage(tamilText)).toBe('ta');
    });

    it('should detect Telugu from Telugu script', () => {
      const teluguText = 'నమస్కారం, నేను ఒక లీడ్ సృష్టించాలనుకుంటున్నాను';
      expect(whatsappAiService.detectLanguage(teluguText)).toBe('te');
    });

    it('should detect Bengali from Bengali script', () => {
      const bengaliText = 'নমস্কার, আমি একটি লিড তৈরি করতে চাই';
      expect(whatsappAiService.detectLanguage(bengaliText)).toBe('bn');
    });

    it('should default to English for English text', () => {
      const englishText = 'Hello, I want to create a lead';
      expect(whatsappAiService.detectLanguage(englishText)).toBe('en');
    });

    it('should default to English for empty or null text', () => {
      expect(whatsappAiService.detectLanguage('')).toBe('en');
      expect(whatsappAiService.detectLanguage(null)).toBe('en');
      expect(whatsappAiService.detectLanguage(undefined)).toBe('en');
    });
  });

  describe('processIncomingMessage', () => {
    const mockCompanyId = 'company-123';
    const mockWhatsappId = '919876543210';
    const mockMessageText = 'Create a lead for John Doe, email john@example.com';
    const mockContext = {
      lead_id: 'lead-123',
      contact_id: 'contact-123'
    };

    beforeEach(() => {
      // Mock getSystemUser
      whatsappAiService.getSystemUser = jest.fn().mockResolvedValue({
        id: 'system-user',
        company_id: mockCompanyId,
        role: 'system',
        email: 'whatsapp-ai@system'
      });
    });

    it('should process message and send auto-reply for CHAT action', async () => {
      const mockChatbotResponse = {
        success: true,
        action: 'CHAT',
        response: 'Hello! How can I help you?',
        intent: 'greeting',
        parameters: {},
        needsConfirmation: false,
        data: null
      };

      chatbotService.processMessage.mockResolvedValue(mockChatbotResponse);
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123'
      });

      const result = await whatsappAiService.processIncomingMessage(
        mockCompanyId,
        mockWhatsappId,
        mockMessageText,
        mockContext,
        { autoReply: true }
      );

      expect(result.success).toBe(true);
      expect(result.chatbotResponse).toEqual(mockChatbotResponse);
      expect(result.autoReplied).toBe(true);
      expect(whatsappSendService.sendTextMessage).toHaveBeenCalledWith(
        mockCompanyId,
        mockWhatsappId,
        mockChatbotResponse.response,
        expect.objectContaining({
          ...mockContext,
          user_id: null
        })
      );
    });

    it('should process message and send confirmation for CREATE_LEAD action', async () => {
      const mockChatbotResponse = {
        success: true,
        action: 'CREATE_LEAD',
        response: 'I will create a lead for John Doe',
        intent: 'create_lead',
        parameters: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        },
        needsConfirmation: true,
        data: {
          lead: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com'
          }
        }
      };

      chatbotService.processMessage.mockResolvedValue(mockChatbotResponse);
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123'
      });

      const result = await whatsappAiService.processIncomingMessage(
        mockCompanyId,
        mockWhatsappId,
        mockMessageText,
        mockContext,
        { autoReply: true }
      );

      expect(result.success).toBe(true);
      expect(whatsappSendService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = whatsappSendService.sendTextMessage.mock.calls[0][2];
      expect(sentMessage).toMatch(/create.*lead|confirm/i);
    });

    it('should process message and send success message for completed action', async () => {
      const mockChatbotResponse = {
        success: true,
        action: 'LIST_LEADS',
        response: 'Here are your leads',
        intent: 'list_leads',
        parameters: {},
        needsConfirmation: false,
        data: {
          leads: [
            { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
            { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' }
          ]
        }
      };

      chatbotService.processMessage.mockResolvedValue(mockChatbotResponse);
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123'
      });

      const result = await whatsappAiService.processIncomingMessage(
        mockCompanyId,
        mockWhatsappId,
        'Show me all leads',
        mockContext,
        { autoReply: true }
      );

      expect(result.success).toBe(true);
      expect(whatsappSendService.sendTextMessage).toHaveBeenCalled();
      const sentMessage = whatsappSendService.sendTextMessage.mock.calls[0][2];
      expect(sentMessage).toMatch(/found|lead|statistics/i);
    });

    it('should not send auto-reply if autoReply is disabled', async () => {
      const mockChatbotResponse = {
        success: true,
        action: 'CHAT',
        response: 'Hello!',
        intent: 'greeting',
        parameters: {},
        needsConfirmation: false,
        data: null
      };

      chatbotService.processMessage.mockResolvedValue(mockChatbotResponse);

      const result = await whatsappAiService.processIncomingMessage(
        mockCompanyId,
        mockWhatsappId,
        mockMessageText,
        mockContext,
        { autoReply: false }
      );

      expect(result.success).toBe(true);
      expect(result.autoReplied).toBe(false);
      expect(whatsappSendService.sendTextMessage).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and send error message', async () => {
      chatbotService.processMessage.mockRejectedValue(new Error('AI processing failed'));

      await expect(
        whatsappAiService.processIncomingMessage(
          mockCompanyId,
          mockWhatsappId,
          mockMessageText,
          mockContext,
          { autoReply: true }
        )
      ).rejects.toThrow();

      // Should attempt to send error message
      expect(whatsappSendService.sendTextMessage).toHaveBeenCalledWith(
        mockCompanyId,
        mockWhatsappId,
        expect.stringMatching(/error|sorry|try again/i),
        expect.any(Object)
      );
    });

    it('should use provided language instead of auto-detecting', async () => {
      const mockChatbotResponse = {
        success: true,
        action: 'CHAT',
        response: 'Hello!',
        intent: 'greeting',
        parameters: {},
        needsConfirmation: false,
        data: null
      };

      chatbotService.processMessage.mockResolvedValue(mockChatbotResponse);
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123'
      });

      const result = await whatsappAiService.processIncomingMessage(
        mockCompanyId,
        mockWhatsappId,
        'Hello',
        mockContext,
        { autoReply: true, language: 'hi' }
      );

      expect(result.language).toBe('hi');
    });
  });

  describe('buildConfirmationMessage', () => {
    it('should build confirmation message for CREATE_LEAD', () => {
      const chatbotResponse = {
        action: 'CREATE_LEAD',
        response: 'I will create a lead',
        data: {
          lead: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com'
          }
        }
      };

      const message = whatsappAiService.buildConfirmationMessage(chatbotResponse);
      expect(message).toContain('create a lead');
      expect(message).toContain('John');
      expect(message).toContain('confirm');
    });

    it('should build confirmation message for DELETE_LEAD', () => {
      const chatbotResponse = {
        action: 'DELETE_LEAD',
        response: 'I will delete the lead',
        data: {}
      };

      const message = whatsappAiService.buildConfirmationMessage(chatbotResponse);
      expect(message).toContain('cannot be undone');
      expect(message).toContain('confirm');
    });
  });

  describe('buildSuccessMessage', () => {
    it('should build success message for CREATE_LEAD', () => {
      const chatbotResponse = {
        action: 'CREATE_LEAD',
        data: {
          lead: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            status: 'new'
          }
        }
      };

      const message = whatsappAiService.buildSuccessMessage(chatbotResponse);
      expect(message).toContain('Lead created successfully');
      expect(message).toContain('John Doe');
      expect(message).toContain('john@example.com');
    });

    it('should build success message for LIST_LEADS', () => {
      const chatbotResponse = {
        action: 'LIST_LEADS',
        data: {
          leads: [
            { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
            { first_name: 'Jane', last_name: 'Smith', phone: '919876543210' }
          ]
        }
      };

      const message = whatsappAiService.buildSuccessMessage(chatbotResponse);
      expect(message).toContain('Found 2 leads');
      expect(message).toContain('John Doe');
      expect(message).toContain('Jane Smith');
    });

    it('should build success message for GET_STATS', () => {
      const chatbotResponse = {
        action: 'GET_STATS',
        data: {
          stats: {
            total: 100,
            new: 20,
            qualified: 30,
            won: 10
          }
        }
      };

      const message = whatsappAiService.buildSuccessMessage(chatbotResponse);
      expect(message).toContain('Lead Statistics');
      expect(message).toContain('Total: 100');
      expect(message).toContain('New: 20');
    });
  });

  describe('sendAutoReply', () => {
    it('should send auto-reply message', async () => {
      whatsappSendService.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test123'
      });

      await whatsappAiService.sendAutoReply(
        'company-123',
        '919876543210',
        'Hello! How can I help?',
        { lead_id: 'lead-123' }
      );

      expect(whatsappSendService.sendTextMessage).toHaveBeenCalledWith(
        'company-123',
        '919876543210',
        'Hello! How can I help?',
        expect.objectContaining({
          lead_id: 'lead-123',
          user_id: null
        })
      );
    });
  });

  describe('translateMessage', () => {
    let GoogleGenerativeAI;

    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      process.env.CHATBOT_FALLBACK_ONLY = 'false';
      GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      jest.clearAllMocks();
    });

    afterEach(() => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.CHATBOT_FALLBACK_ONLY;
    });

    it('should translate message to Hindi using Gemini AI', async () => {
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('नमस्ते, मैं आपकी कैसे मदद कर सकता हूं?')
          }
        })
      };
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      }));

      const result = await whatsappAiService.translateMessage('Hello, how can I help you?', 'hi');

      expect(result).toContain('नमस्ते');
      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-api-key');
    });

    it('should return original message if translation fails', async () => {
      const mockModel = {
        generateContent: jest.fn().mockRejectedValue(new Error('Translation failed'))
      };
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      }));

      const originalMessage = 'Hello, how can I help you?';
      const result = await whatsappAiService.translateMessage(originalMessage, 'hi');

      expect(result).toBe(originalMessage);
    });

    it('should return original message if GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;

      const originalMessage = 'Hello, how can I help you?';
      const result = await whatsappAiService.translateMessage(originalMessage, 'hi');

      expect(result).toBe(originalMessage);
    });

    it('should return original message if fallback mode is enabled', async () => {
      process.env.CHATBOT_FALLBACK_ONLY = 'true';

      const originalMessage = 'Hello, how can I help you?';
      const result = await whatsappAiService.translateMessage(originalMessage, 'hi');

      expect(result).toBe(originalMessage);
    });

    it('should handle all supported languages', async () => {
      const languages = ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'];
      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: jest.fn().mockReturnValue('Translated text')
          }
        })
      };
      
      GoogleGenerativeAI.mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue(mockModel)
      }));

      for (const lang of languages) {
        const result = await whatsappAiService.translateMessage('Test message', lang);
        expect(result).toBeDefined();
      }
    });
  });

  describe('buildInteractiveButtons', () => {
    it('should build interactive button message structure', () => {
      const buttons = [
        { id: 'action1', title: 'View Leads' },
        { id: 'action2', title: 'Create Lead' },
        { id: 'action3', title: 'Get Stats' }
      ];

      const result = whatsappAiService.buildInteractiveButtons(
        'What would you like to do?',
        buttons,
        'Select an action'
      );

      expect(result.type).toBe('button');
      expect(result.body.text).toBe('What would you like to do?');
      expect(result.footer.text).toBe('Select an action');
      expect(result.action.buttons).toHaveLength(3);
      expect(result.action.buttons[0].reply.id).toBe('action1');
      expect(result.action.buttons[0].reply.title).toBe('View Leads');
    });

    it('should throw error if buttons array is empty', () => {
      expect(() => {
        whatsappAiService.buildInteractiveButtons('Test', [], 'Footer');
      }).toThrow('Buttons array must have 1-3 buttons');
    });

    it('should throw error if buttons array has more than 3 buttons', () => {
      const buttons = [
        { id: '1', title: 'Button 1' },
        { id: '2', title: 'Button 2' },
        { id: '3', title: 'Button 3' },
        { id: '4', title: 'Button 4' }
      ];

      expect(() => {
        whatsappAiService.buildInteractiveButtons('Test', buttons);
      }).toThrow('Buttons array must have 1-3 buttons');
    });

    it('should work without footer text', () => {
      const buttons = [{ id: 'action1', title: 'View Leads' }];
      const result = whatsappAiService.buildInteractiveButtons('Test', buttons);

      expect(result.footer).toBeUndefined();
    });
  });

  describe('buildInteractiveList', () => {
    it('should build interactive list message structure', () => {
      const sections = [
        {
          title: 'Lead Status',
          rows: [
            { id: 'new', title: 'New Leads', description: 'Recently created' },
            { id: 'qualified', title: 'Qualified Leads', description: 'Ready to convert' }
          ]
        }
      ];

      const result = whatsappAiService.buildInteractiveList(
        'Select a lead status:',
        'View Status',
        sections,
        'Choose an option'
      );

      expect(result.type).toBe('list');
      expect(result.body.text).toBe('Select a lead status:');
      expect(result.action.button).toBe('View Status');
      expect(result.footer.text).toBe('Choose an option');
      expect(result.action.sections).toHaveLength(1);
      expect(result.action.sections[0].title).toBe('Lead Status');
      expect(result.action.sections[0].rows).toHaveLength(2);
    });

    it('should throw error if sections array is empty', () => {
      expect(() => {
        whatsappAiService.buildInteractiveList('Test', 'Button', [], 'Footer');
      }).toThrow('Sections array must have 1-10 sections');
    });

    it('should throw error if sections array has more than 10 sections', () => {
      const sections = Array.from({ length: 11 }, (_, i) => ({
        title: `Section ${i}`,
        rows: [{ id: `row${i}`, title: `Row ${i}` }]
      }));

      expect(() => {
        whatsappAiService.buildInteractiveList('Test', 'Button', sections);
      }).toThrow('Sections array must have 1-10 sections');
    });

    it('should work without description in rows', () => {
      const sections = [
        {
          title: 'Test',
          rows: [
            { id: '1', title: 'Option 1' }
          ]
        }
      ];

      const result = whatsappAiService.buildInteractiveList('Test', 'Button', sections);
      expect(result.action.sections[0].rows[0].description).toBeUndefined();
    });
  });

  describe('sendInteractiveActionMessage', () => {
    it('should send interactive message with action buttons', async () => {
      const actions = [
        { id: 'view_leads', title: 'View Leads' },
        { id: 'create_lead', title: 'Create Lead' },
        { id: 'get_stats', title: 'Get Stats' }
      ];

      whatsappSendService.sendInteractiveMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.interactive123'
      });

      const result = await whatsappAiService.sendInteractiveActionMessage(
        'company-123',
        '919876543210',
        'What would you like to do?',
        actions,
        { lead_id: 'lead-123' }
      );

      expect(result.success).toBe(true);
      expect(whatsappSendService.sendInteractiveMessage).toHaveBeenCalledWith(
        'company-123',
        '919876543210',
        expect.objectContaining({
          type: 'button',
          body: { text: 'What would you like to do?' }
        }),
        { lead_id: 'lead-123' }
      );
    });

    it('should limit actions to 3 buttons', async () => {
      const actions = [
        { id: '1', title: 'Action 1' },
        { id: '2', title: 'Action 2' },
        { id: '3', title: 'Action 3' },
        { id: '4', title: 'Action 4' },
        { id: '5', title: 'Action 5' }
      ];

      whatsappSendService.sendInteractiveMessage.mockResolvedValue({
        success: true,
        messageId: 'wamid.test'
      });

      await whatsappAiService.sendInteractiveActionMessage(
        'company-123',
        '919876543210',
        'Test',
        actions,
        {}
      );

      const callArgs = whatsappSendService.sendInteractiveMessage.mock.calls[0];
      const interactiveData = callArgs[2];
      expect(interactiveData.action.buttons).toHaveLength(3);
    });

    it('should handle errors gracefully', async () => {
      whatsappSendService.sendInteractiveMessage.mockRejectedValue(
        new Error('Failed to send')
      );

      await expect(
        whatsappAiService.sendInteractiveActionMessage(
          'company-123',
          '919876543210',
          'Test',
          [{ id: '1', title: 'Action 1' }],
          {}
        )
      ).rejects.toThrow();
    });
  });
});

