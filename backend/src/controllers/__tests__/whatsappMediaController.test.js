/**
 * WhatsApp Media Controller Tests
 * Tests for media upload API endpoints
 */

const request = require('supertest');
const app = require('../../app');
const whatsappMediaService = require('../../services/whatsappMediaService');

jest.mock('../../services/whatsappMediaService');
jest.mock('../../middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'user-123', company_id: 'company-123' };
    next();
  },
  requireRole: () => (req, res, next) => next()
}));

describe('WhatsApp Media Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/whatsapp/media/upload', () => {
    it('should upload media file successfully', async () => {
      const mockResult = {
        success: true,
        url: 'https://supabase.co/storage/v1/object/public/whatsapp-media/test.jpg',
        filePath: 'whatsapp-media/company-123/image/test.jpg',
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
        mediaType: 'image'
      };

      whatsappMediaService.uploadMedia.mockResolvedValue(mockResult);
      whatsappMediaService.getUploadMiddleware.mockReturnValue((req, res, next) => {
        req.file = {
          buffer: Buffer.from('test'),
          originalname: 'test.jpg',
          mimetype: 'image/jpeg'
        };
        next();
      });

      const response = await request(app)
        .post('/api/whatsapp/media/upload')
        .attach('file', Buffer.from('test content'), 'test.jpg')
        .field('media_type', 'image')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBeDefined();
      expect(whatsappMediaService.uploadMedia).toHaveBeenCalled();
    });

    it('should return 400 if no file uploaded', async () => {
      whatsappMediaService.getUploadMiddleware.mockReturnValue((req, res, next) => {
        req.file = null;
        next();
      });

      const response = await request(app)
        .post('/api/whatsapp/media/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/whatsapp/media/:filePath', () => {
    it('should get media info successfully', async () => {
      const mockInfo = {
        success: true,
        url: 'https://supabase.co/storage/v1/object/public/whatsapp-media/test.jpg',
        fileName: 'test.jpg',
        size: 1024,
        mimeType: 'image/jpeg'
      };

      whatsappMediaService.getMediaInfo.mockResolvedValue(mockInfo);

      const filePath = encodeURIComponent('whatsapp-media/company-123/image/test.jpg');
      const response = await request(app)
        .get(`/api/whatsapp/media/${filePath}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBeDefined();
      expect(whatsappMediaService.getMediaInfo).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/whatsapp/media/:filePath', () => {
    it('should delete media file successfully', async () => {
      whatsappMediaService.deleteMedia.mockResolvedValue();

      const filePath = encodeURIComponent('whatsapp-media/company-123/image/test.jpg');
      const response = await request(app)
        .delete(`/api/whatsapp/media/${filePath}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(whatsappMediaService.deleteMedia).toHaveBeenCalled();
    });
  });
});

