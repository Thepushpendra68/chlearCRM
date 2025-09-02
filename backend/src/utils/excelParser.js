const XLSX = require('xlsx');

class ExcelParser {
  /**
   * Parse Excel buffer to array of objects
   */
  async parseExcel(buffer, fieldMapping = {}) {
    try {
      // Read workbook from buffer
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      // Get first worksheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error('No worksheets found in Excel file');
      }

      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
      });

      if (jsonData.length < 2) {
        throw new Error('Excel file must contain at least a header row and one data row');
      }

      // Get headers from first row
      const headers = jsonData[0].map(header => 
        header.toString().trim().toLowerCase().replace(/\s+/g, '_')
      );

      // Convert to array of objects
      const results = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowData = {};

        headers.forEach((header, index) => {
          if (row[index] !== undefined && row[index] !== '') {
            rowData[header] = row[index].toString().trim();
          }
        });

        // Only add row if it has some data
        if (Object.keys(rowData).length > 0) {
          results.push(rowData);
        }
      }

      // Apply field mapping
      return results.map(data => this.mapFields(data, fieldMapping));
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Map Excel fields to database fields
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
    Object.keys(data).forEach(excelField => {
      const dbField = allMappings[excelField];
      if (dbField && data[excelField] !== undefined && data[excelField] !== '') {
        mappedData[dbField] = data[excelField];
      }
    });

    return mappedData;
  }

  /**
   * Detect Excel headers from buffer
   */
  async detectHeaders(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
      });

      if (jsonData.length === 0) {
        return [];
      }

      return jsonData[0].map(header => header.toString().trim());
    } catch (error) {
      throw new Error(`Header detection error: ${error.message}`);
    }
  }

  /**
   * Validate Excel format
   */
  async validateExcel(buffer) {
    try {
      const headers = await this.detectHeaders(buffer);
      
      if (headers.length === 0) {
        throw new Error('No headers found in Excel file');
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
        message: 'Excel format is valid'
      };
    } catch (error) {
      return {
        valid: false,
        headers: [],
        message: error.message
      };
    }
  }

  /**
   * Create Excel file from data
   */
  createExcel(data, sheetName = 'Leads') {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`Excel creation error: ${error.message}`);
    }
  }
}

module.exports = new ExcelParser();
