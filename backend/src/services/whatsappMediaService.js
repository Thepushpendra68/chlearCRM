const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * WhatsApp Media Service
 * Handles media file uploads and storage for WhatsApp messages
 */
class WhatsAppMediaService {
  constructor() {
    // Configure multer for memory storage (we'll upload to Supabase Storage)
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 16 * 1024 * 1024 // 16MB max (WhatsApp limit)
      },
      fileFilter: (req, file, cb) => {
        // Allowed file types for WhatsApp
        const allowedTypes = {
          image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          video: ['video/mp4', 'video/3gpp'],
          audio: ['audio/aac', 'audio/amr', 'audio/mpeg', 'audio/ogg', 'audio/opus'],
          document: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/msword', 
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                     'application/vnd.openxmlformats-officedocument.presentationml.presentation']
        };

        const allAllowed = [
          ...allowedTypes.image,
          ...allowedTypes.video,
          ...allowedTypes.audio,
          ...allowedTypes.document
        ];

        if (allAllowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new ApiError(`File type ${file.mimetype} not allowed for WhatsApp`, 400));
        }
      }
    });
  }

  /**
   * Get multer upload middleware
   */
  getUploadMiddleware() {
    return this.upload.single('file');
  }

  /**
   * Upload media file to Supabase Storage
   * @param {string} companyId - Company ID
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - File MIME type
   * @param {string} mediaType - 'image', 'video', 'audio', 'document'
   * @returns {object} { url, filePath, fileName }
   */
  async uploadMedia(companyId, fileBuffer, fileName, mimeType, mediaType) {
    try {
      // Generate unique file name
      const fileExt = path.extname(fileName);
      const uniqueFileName = `${crypto.randomUUID()}${fileExt}`;
      const filePath = `whatsapp-media/${companyId}/${mediaType}/${uniqueFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('whatsapp-media')
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false
        });

      if (error) {
        // If bucket doesn't exist, create it
        if (error.message?.includes('Bucket not found')) {
          await this.createStorageBucket();
          // Retry upload
          const retryResult = await supabaseAdmin.storage
            .from('whatsapp-media')
            .upload(filePath, fileBuffer, {
              contentType: mimeType,
              upsert: false
            });

          if (retryResult.error) {
            throw new ApiError(`Failed to upload media: ${retryResult.error.message}`, 500);
          }

          // Get public URL
          const { data: urlData } = supabaseAdmin.storage
            .from('whatsapp-media')
            .getPublicUrl(filePath);

          return {
            success: true,
            url: urlData.publicUrl,
            filePath,
            fileName: uniqueFileName,
            originalFileName: fileName,
            mimeType,
            mediaType
          };
        }

        throw new ApiError(`Failed to upload media: ${error.message}`, 500);
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('whatsapp-media')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        filePath,
        fileName: uniqueFileName,
        originalFileName: fileName,
        mimeType,
        mediaType
      };
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to upload media', 500);
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   */
  async createStorageBucket() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'whatsapp-media');

      if (!bucketExists) {
        // Create bucket (requires admin privileges)
        const { error: createError } = await supabaseAdmin.storage.createBucket('whatsapp-media', {
          public: true, // Make bucket public so URLs work
          fileSizeLimit: 16777216, // 16MB
          allowedMimeTypes: null // Allow all types (we filter in multer)
        });

        if (createError) {
          console.error('Error creating bucket:', createError);
          // If bucket creation fails, we'll use a fallback approach
          throw new ApiError('Storage bucket not configured. Please create "whatsapp-media" bucket in Supabase Storage.', 500);
        }
      }
    } catch (error) {
      console.error('Error in createStorageBucket:', error);
      throw error;
    }
  }

  /**
   * Delete media file
   * @param {string} filePath - File path in storage
   */
  async deleteMedia(filePath) {
    try {
      const { error } = await supabaseAdmin.storage
        .from('whatsapp-media')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting media:', error);
        // Don't throw - deletion failure shouldn't break the flow
      }
    } catch (error) {
      console.error('Error deleting media:', error);
    }
  }

  /**
   * Get media file info
   * @param {string} filePath - File path in storage
   */
  async getMediaInfo(filePath) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from('whatsapp-media')
        .list(path.dirname(filePath), {
          search: path.basename(filePath)
        });

      if (error) {
        throw new ApiError('Failed to get media info', 500);
      }

      if (!data || data.length === 0) {
        throw new ApiError('Media file not found', 404);
      }

      const file = data[0];
      const { data: urlData } = supabaseAdmin.storage
        .from('whatsapp-media')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: file.name,
        size: file.metadata?.size,
        mimeType: file.metadata?.mimetype,
        createdAt: file.created_at
      };
    } catch (error) {
      console.error('Error getting media info:', error);
      throw error instanceof ApiError ? error : new ApiError('Failed to get media info', 500);
    }
  }

  /**
   * Detect media type from MIME type
   */
  detectMediaType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }
}

module.exports = new WhatsAppMediaService();

