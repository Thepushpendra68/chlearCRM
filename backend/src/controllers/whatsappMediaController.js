const whatsappMediaService = require('../services/whatsappMediaService');
const ApiError = require('../utils/ApiError');

/**
 * WhatsApp Media Controller
 * Handles media upload endpoints
 */
class WhatsAppMediaController {
  /**
   * Upload media file
   * POST /api/whatsapp/media/upload
   */
  async uploadMedia(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError('No file uploaded', 400);
      }

      const { media_type } = req.body;
      const detectedType = whatsappMediaService.detectMediaType(req.file.mimetype);
      const finalMediaType = media_type || detectedType;

      const result = await whatsappMediaService.uploadMedia(
        req.user.company_id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        finalMediaType
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get multer upload middleware
   */
  getUploadMiddleware() {
    return whatsappMediaService.getUploadMiddleware();
  }

  /**
   * Delete media file
   * DELETE /api/whatsapp/media/:filePath
   */
  async deleteMedia(req, res, next) {
    try {
      const { filePath } = req.params;
      
      // Decode file path (URL encoded)
      const decodedPath = decodeURIComponent(filePath);

      await whatsappMediaService.deleteMedia(decodedPath);

      res.json({
        success: true,
        message: 'Media deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get media info
   * GET /api/whatsapp/media/:filePath
   */
  async getMediaInfo(req, res, next) {
    try {
      const { filePath } = req.params;
      
      // Decode file path (URL encoded)
      const decodedPath = decodeURIComponent(filePath);

      const result = await whatsappMediaService.getMediaInfo(decodedPath);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WhatsAppMediaController();

