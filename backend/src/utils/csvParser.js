const csv = require('csv-parser');
const { Readable } = require('stream');

class CSVParser {
  /**
   * Parse CSV buffer to array of objects
   */
  async parseCSV(buffer, fieldMapping = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv({
          mapHeaders: ({ header }) => {
            // Clean header names
            return header.trim().toLowerCase().replace(/\s+/g, '_');
          }
        }))
        .on('data', (data) => {
          // Apply field mapping if provided
          const mappedData = this.mapFields(data, fieldMapping);
          results.push(mappedData);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        });
    });
  }

  /**
   * Map CSV fields to database fields
   */
  mapFields(data, fieldMapping) {
    const mappedData = {};

    // Default field mappings
    const defaultMappings = {
      'name': 'name',
      'full_name': 'name',
      'first_name': 'name',
      'email': 'email',
      'email_address': 'email',
      'phone': 'phone',
      'phone_number': 'phone',
      'mobile': 'phone',
      'company': 'company',
      'company_name': 'company',
      'organization': 'company',
      'position': 'position',
      'job_title': 'position',
      'title': 'position',
      'source': 'source',
      'lead_source': 'source',
      'status': 'status',
      'lead_status': 'status',
      'notes': 'notes',
      'comments': 'notes',
      'description': 'notes'
    };

    // Merge default mappings with custom mappings
    const allMappings = { ...defaultMappings, ...fieldMapping };

    // Map fields
    Object.keys(data).forEach(csvField => {
      const dbField = allMappings[csvField];
      if (dbField && data[csvField] !== undefined && data[csvField] !== '') {
        mappedData[dbField] = data[csvField];
      }
    });

    return mappedData;
  }

  /**
   * Detect CSV headers from buffer
   */
  async detectHeaders(buffer) {
    return new Promise((resolve, reject) => {
      const stream = Readable.from(buffer.toString());
      let headers = [];

      stream
        .pipe(csv({
          mapHeaders: ({ header }) => header.trim()
        }))
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', () => {
          // Stop after first row to get headers
          stream.destroy();
        })
        .on('end', () => {
          resolve(headers);
        })
        .on('error', (error) => {
          reject(new Error(`Header detection error: ${error.message}`));
        });
    });
  }

  /**
   * Validate CSV format
   */
  async validateCSV(buffer) {
    try {
      const headers = await this.detectHeaders(buffer);
      
      if (headers.length === 0) {
        throw new Error('No headers found in CSV file');
      }

      // Check for required headers
      const requiredHeaders = ['name', 'email'];
      const missingHeaders = requiredHeaders.filter(header => 
        !headers.some(h => h.toLowerCase().includes(header))
      );

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      return {
        valid: true,
        headers: headers,
        message: 'CSV format is valid'
      };
    } catch (error) {
      return {
        valid: false,
        headers: [],
        message: error.message
      };
    }
  }
}

module.exports = new CSVParser();
