const importService = require('../services/importService');
const ApiError = require('../utils/ApiError');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new ApiError('Invalid file type. Only CSV and Excel files are allowed.', 400), false);
    }
  }
});

class ImportController {
  /**
   * Import leads from file
   */
  async importLeads(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError('No file uploaded', 400);
      }

      const { fieldMapping, options } = req.body;
      const parsedFieldMapping = fieldMapping ? JSON.parse(fieldMapping) : {};
      const parsedOptions = options ? JSON.parse(options) : {};

      const result = await importService.importLeads(
        req.file.buffer,
        req.file.originalname,
        req.user.id,
        {
          fieldMapping: parsedFieldMapping,
          ...parsedOptions
        }
      );

      res.json({
        success: true,
        data: result,
        message: `Import completed. ${result.successful} leads imported successfully, ${result.failed} failed.`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export leads to various formats
   */
  async exportLeads(req, res, next) {
    try {
      const { format = 'csv', ...filters } = req.query;
      
      const exportData = await importService.exportLeads(filters, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`);
        
        // Convert to CSV format
        const csvContent = this.convertToCSV(exportData);
        res.send(csvContent);
      } else if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
        
        // Convert to Excel format
        const excelBuffer = await this.convertToExcel(exportData);
        res.send(excelBuffer);
      } else {
        res.json({
          success: true,
          data: exportData
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get import template
   */
  async getImportTemplate(req, res, next) {
    try {
      const template = importService.generateImportTemplate();
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leads_import_template.csv"');
      
      const csvContent = this.convertToCSV(template);
      res.send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(req, res, next) {
    try {
      const userId = req.query.user_id || null;
      const history = await importService.getImportHistory(userId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate import file
   */
  async validateImportFile(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError('No file uploaded', 400);
      }

      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let validation;

      if (fileExt === '.csv') {
        const csvParser = require('../utils/csvParser');
        validation = await csvParser.validateCSV(req.file.buffer);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        const excelParser = require('../utils/excelParser');
        validation = await excelParser.validateExcel(req.file.buffer);
      } else {
        throw new ApiError('Unsupported file format', 400);
      }

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get file headers for field mapping
   */
  async getFileHeaders(req, res, next) {
    try {
      if (!req.file) {
        throw new ApiError('No file uploaded', 400);
      }

      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let headers;

      if (fileExt === '.csv') {
        const csvParser = require('../utils/csvParser');
        headers = await csvParser.detectHeaders(req.file.buffer);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        const excelParser = require('../utils/excelParser');
        headers = await excelParser.detectHeaders(req.file.buffer);
      } else {
        throw new ApiError('Unsupported file format', 400);
      }

      res.json({
        success: true,
        data: {
          headers: headers,
          suggestedMappings: this.getSuggestedMappings(headers)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Convert data to Excel format
   */
  async convertToExcel(data) {
    const excelParser = require('../utils/excelParser');
    return excelParser.createExcel(data);
  }

  /**
   * Get suggested field mappings
   */
  getSuggestedMappings(headers) {
    const suggestions = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('name') && !lowerHeader.includes('company')) {
        suggestions[header] = 'name';
      } else if (lowerHeader.includes('email')) {
        suggestions[header] = 'email';
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) {
        suggestions[header] = 'phone';
      } else if (lowerHeader.includes('company') || lowerHeader.includes('organization')) {
        suggestions[header] = 'company';
      } else if (lowerHeader.includes('position') || lowerHeader.includes('title')) {
        suggestions[header] = 'position';
      } else if (lowerHeader.includes('source')) {
        suggestions[header] = 'source';
      } else if (lowerHeader.includes('status')) {
        suggestions[header] = 'status';
      } else if (lowerHeader.includes('note') || lowerHeader.includes('comment')) {
        suggestions[header] = 'notes';
      }
    });

    return suggestions;
  }

  /**
   * Get multer upload middleware
   */
  getUploadMiddleware() {
    return upload.single('file');
  }
}

module.exports = new ImportController();
