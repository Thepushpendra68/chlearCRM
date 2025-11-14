/**
 * WhatsApp Media Service Tests
 * Tests for media upload functionality
 */

const whatsappMediaService = require('../whatsappMediaService');
const { supabaseAdmin } = require('../../config/supabase');
const ApiError = require('../../utils/ApiError');

jest.mock('../../config/supabase', () => {
  const mockStorage = {
    from: jest.fn(() => ({
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
      list: jest.fn()
    })),
    listBuckets: jest.fn(),
    createBucket: jest.fn()
  };

  return {
    supabaseAdmin: {
      storage: mockStorage
    }
  };
});

describe('WhatsApp Media Service', () => {
  const mockCompanyId = 'company-123';
  const mockFileBuffer = Buffer.from('test file content');
  const mockFileName = 'test-image.jpg';
  const mockMimeType = 'image/jpeg';
  const mockMediaType = 'image';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUploadMiddleware', () => {
    it('should return multer middleware', () => {
      const middleware = whatsappMediaService.getUploadMiddleware();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });
  });

  describe('uploadMedia', () => {
    it('should upload media file successfully', async () => {
      const mockFilePath = 'whatsapp-media/company-123/image/uuid-test.jpg';
      const mockPublicUrl = 'https://supabase.co/storage/v1/object/public/whatsapp-media/...';

      supabaseAdmin.storage.from.mockReturnValueOnce({
        upload: jest.fn().mockResolvedValue({
          data: { path: mockFilePath },
          error: null
        })
      });

      supabaseAdmin.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl }
        })
      });

      const result = await whatsappMediaService.uploadMedia(
        mockCompanyId,
        mockFileBuffer,
        mockFileName,
        mockMimeType,
        mockMediaType
      );

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockPublicUrl);
      expect(result.filePath).toContain('whatsapp-media');
      expect(supabaseAdmin.storage.from).toHaveBeenCalledWith('whatsapp-media');
    });

    it('should create bucket if it does not exist', async () => {
      const mockFilePath = 'whatsapp-media/company-123/image/uuid-test.jpg';
      const mockPublicUrl = 'https://supabase.co/storage/v1/object/public/whatsapp-media/...';

      // First call - bucket not found
      supabaseAdmin.storage.from.mockReturnValueOnce({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Bucket not found' }
        })
      });

      // List buckets
      supabaseAdmin.storage.listBuckets.mockResolvedValue({
        data: [],
        error: null
      });

      // Create bucket
      supabaseAdmin.storage.createBucket.mockResolvedValue({
        data: { name: 'whatsapp-media' },
        error: null
      });

      // Retry upload
      supabaseAdmin.storage.from.mockReturnValueOnce({
        upload: jest.fn().mockResolvedValue({
          data: { path: mockFilePath },
          error: null
        })
      });

      supabaseAdmin.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl }
        })
      });

      const result = await whatsappMediaService.uploadMedia(
        mockCompanyId,
        mockFileBuffer,
        mockFileName,
        mockMimeType,
        mockMediaType
      );

      expect(result.success).toBe(true);
      expect(supabaseAdmin.storage.createBucket).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      supabaseAdmin.storage.from.mockReturnValueOnce({
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' }
        })
      });

      await expect(
        whatsappMediaService.uploadMedia(
          mockCompanyId,
          mockFileBuffer,
          mockFileName,
          mockMimeType,
          mockMediaType
        )
      ).rejects.toThrow('Failed to upload media');
    });
  });

  describe('deleteMedia', () => {
    it('should delete media file successfully', async () => {
      const filePath = 'whatsapp-media/company-123/image/test.jpg';

      supabaseAdmin.storage.from.mockReturnValueOnce({
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      });

      await whatsappMediaService.deleteMedia(filePath);

      expect(supabaseAdmin.storage.from).toHaveBeenCalledWith('whatsapp-media');
    });

    it('should not throw on delete errors', async () => {
      const filePath = 'whatsapp-media/company-123/image/test.jpg';

      supabaseAdmin.storage.from.mockReturnValueOnce({
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'File not found' }
        })
      });

      // Should not throw
      await expect(whatsappMediaService.deleteMedia(filePath)).resolves.not.toThrow();
    });
  });

  describe('getMediaInfo', () => {
    it('should get media info successfully', async () => {
      const filePath = 'whatsapp-media/company-123/image/test.jpg';
      const mockPublicUrl = 'https://supabase.co/storage/v1/object/public/whatsapp-media/...';

      supabaseAdmin.storage.from.mockReturnValueOnce({
        list: jest.fn().mockResolvedValue({
          data: [
            {
              name: 'test.jpg',
              metadata: {
                size: 1024,
                mimetype: 'image/jpeg'
              },
              created_at: '2025-01-20T10:00:00Z'
            }
          ],
          error: null
        })
      });

      supabaseAdmin.storage.from.mockReturnValueOnce({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: mockPublicUrl }
        })
      });

      const result = await whatsappMediaService.getMediaInfo(filePath);

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockPublicUrl);
      expect(result.fileName).toBe('test.jpg');
    });

    it('should throw error if media not found', async () => {
      const filePath = 'whatsapp-media/company-123/image/nonexistent.jpg';

      supabaseAdmin.storage.from.mockReturnValueOnce({
        list: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      await expect(whatsappMediaService.getMediaInfo(filePath)).rejects.toThrow('Media file not found');
    });
  });

  describe('detectMediaType', () => {
    it('should detect image type', () => {
      expect(whatsappMediaService.detectMediaType('image/jpeg')).toBe('image');
      expect(whatsappMediaService.detectMediaType('image/png')).toBe('image');
    });

    it('should detect video type', () => {
      expect(whatsappMediaService.detectMediaType('video/mp4')).toBe('video');
    });

    it('should detect audio type', () => {
      expect(whatsappMediaService.detectMediaType('audio/mpeg')).toBe('audio');
    });

    it('should default to document for other types', () => {
      expect(whatsappMediaService.detectMediaType('application/pdf')).toBe('document');
    });
  });
});

