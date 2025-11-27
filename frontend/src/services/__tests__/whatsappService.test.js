/**
 * WhatsApp Service Tests (Frontend)
 * Tests for WhatsApp API integration layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import * as whatsappService from '../whatsappService';

vi.mock('axios');

describe('WhatsApp Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
  });

  describe('sendTextMessage', () => {
    it('should send text message successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          messageId: 'wamid.test123',
          status: 'sent'
        }
      };
      axios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await whatsappService.sendTextMessage({
        to: '919876543210',
        message: 'Hello',
        leadId: 'lead-123'
      });

      expect(result.success).toBe(true);
      expect(result.data.messageId).toBe('wamid.test123');
    });

    it('should handle API errors', async () => {
      axios.create.mockReturnValue({
        post: vi.fn().mockRejectedValue(new Error('Network error')),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await whatsappService.sendTextMessage({
        to: '919876543210',
        message: 'Hello'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send template message successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          messageId: 'wamid.template123'
        }
      };
      axios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await whatsappService.sendTemplateMessage({
        to: '919876543210',
        templateName: 'welcome',
        language: 'en',
        parameters: ['John']
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getMessages', () => {
    it('should fetch messages with filters', async () => {
      const mockMessages = [
        { id: 'msg1', content: 'Hello' },
        { id: 'msg2', content: 'Hi' }
      ];
      const mockResponse = {
        data: {
          success: true,
          messages: mockMessages
        }
      };
      axios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await whatsappService.getMessages({
        leadId: 'lead-123',
        limit: 50
      });

      expect(result.success).toBe(true);
      expect(result.data.messages).toHaveLength(2);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone number correctly', () => {
      expect(whatsappService.formatPhoneNumber('9876543210')).toBe('919876543210');
      expect(whatsappService.formatPhoneNumber('919876543210')).toBe('919876543210');
      expect(whatsappService.formatPhoneNumber('+91 987 654 3210')).toBe('919876543210');
      expect(whatsappService.formatPhoneNumber('98765-43210')).toBe('919876543210');
    });

    it('should handle empty input', () => {
      expect(whatsappService.formatPhoneNumber('')).toBe('');
      expect(whatsappService.formatPhoneNumber(null)).toBe('');
    });
  });

  describe('formatPhoneDisplay', () => {
    it('should format phone for display', () => {
      expect(whatsappService.formatPhoneDisplay('919876543210')).toBe('987 654 3210');
      expect(whatsappService.formatPhoneDisplay('9876543210')).toBe('987 654 3210');
    });
  });

  describe('isValidWhatsAppNumber', () => {
    it('should validate WhatsApp numbers', () => {
      expect(whatsappService.isValidWhatsAppNumber('919876543210')).toBe(true);
      expect(whatsappService.isValidWhatsAppNumber('9876543210')).toBe(true);
      expect(whatsappService.isValidWhatsAppNumber('123')).toBe(false);
      expect(whatsappService.isValidWhatsAppNumber('')).toBe(false);
      expect(whatsappService.isValidWhatsAppNumber(null)).toBe(false);
    });
  });

  describe('getConversations', () => {
    it('should fetch conversations', async () => {
      const mockConversations = [
        { id: 'conv1', whatsapp_id: '919876543210' },
        { id: 'conv2', whatsapp_id: '919876543211' }
      ];
      const mockResponse = {
        data: {
          success: true,
          conversations: mockConversations
        }
      };
      axios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await whatsappService.getConversations({
        isActive: true,
        limit: 50
      });

      expect(result.success).toBe(true);
      expect(result.data.conversations).toHaveLength(2);
    });
  });

  describe('syncTemplates', () => {
    it('should sync templates from Meta', async () => {
      const mockResponse = {
        data: {
          success: true,
          synced: 5
        }
      };
      axios.create.mockReturnValue({
        post: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await whatsappService.syncTemplates();

      expect(result.success).toBe(true);
      expect(result.data.synced).toBe(5);
    });
  });

  describe('getTemplates', () => {
    it('should fetch templates with filters', async () => {
      const mockTemplates = [
        { name: 'welcome', status: 'approved' },
        { name: 'hello', status: 'approved' }
      ];
      const mockResponse = {
        data: {
          success: true,
          templates: mockTemplates
        }
      };
      axios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      });

      const result = await whatsappService.getTemplates({
        status: 'approved'
      });

      expect(result.success).toBe(true);
      expect(result.data.templates).toHaveLength(2);
    });
  });
});

