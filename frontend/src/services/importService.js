import api from './api';
import supabase from '../config/supabase';

class ImportService {
  /**
   * Import leads from file
   */
  async importLeads(file, fieldMapping = {}, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldMapping', JSON.stringify(fieldMapping));
      formData.append('options', JSON.stringify(options));

      const response = await api.post('/import/leads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to import leads');
    }
  }

  /**
   * Perform a dry-run validation before importing.
   */
  async dryRunLeads(file, fieldMapping = {}, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldMapping', JSON.stringify(fieldMapping));
      formData.append('options', JSON.stringify({
        ...options,
        mode: 'dry_run'
      }));

      const response = await api.post('/import/leads/dry-run', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to validate import file');
    }
  }

  /**
   * Export leads to various formats
   */
  async exportLeads(filters = {}, format = 'csv') {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key]);
        }
      });

      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('You must be logged in to export leads');
      }

      console.log('Exporting leads with filters:', filters, 'format:', format);
      console.log('Request URL:', `/import/export/leads?${params.toString()}`);

      const response = await api.get(`/import/export/leads?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `leads_export_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      console.error('Export error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401) {
        throw new Error('Your session has expired. Please login again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to export leads.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred while exporting leads. Please try again later.');
      } else {
        throw new Error(error.response?.data?.error?.message || error.message || 'Failed to export leads');
      }
    }
  }

  /**
   * Get import template
   */
  async getImportTemplate() {
    try {
      const response = await api.get('/import/template', {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'leads_import_template.csv');
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download template');
    }
  }

  /**
   * Get import history
   */
  async getImportHistory(userId = null) {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const response = await api.get(`/import/history${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch import history');
    }
  }

  /**
   * Validate import file
   */
  async validateImportFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import/validate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to validate file');
    }
  }

  /**
   * Get file headers for field mapping
   */
  async getFileHeaders(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/import/headers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get file headers');
    }
  }

  /**
   * Parse CSV file locally for preview
   */
  parseCSVPreview(file, maxRows = 10) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            reject(new Error('File is empty'));
            return;
          }

          // Parse headers
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          // Parse data rows
          const data = [];
          for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            data.push(row);
          }

          resolve({ headers, data });
        } catch (error) {
          reject(new Error('Failed to parse CSV file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Get suggested field mappings
   */
  getSuggestedMappings(headers) {
    const suggestions = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
        suggestions[header] = 'first_name';
      } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
        suggestions[header] = 'last_name';
      } else if (lowerHeader.includes('name') && !lowerHeader.includes('company') && !lowerHeader.includes('first') && !lowerHeader.includes('last')) {
        // If it's just "name", try to split it or map to first_name
        suggestions[header] = 'first_name';
      } else if (lowerHeader.includes('email')) {
        suggestions[header] = 'email';
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('mobile')) {
        suggestions[header] = 'phone';
      } else if (lowerHeader.includes('company') || lowerHeader.includes('organization')) {
        suggestions[header] = 'company';
      } else if (lowerHeader.includes('position') || lowerHeader.includes('title') || lowerHeader.includes('job')) {
        suggestions[header] = 'job_title';
      } else if (lowerHeader.includes('source') || lowerHeader.includes('lead_source')) {
        suggestions[header] = 'lead_source';
      } else if (lowerHeader.includes('status')) {
        suggestions[header] = 'status';
      } else if (lowerHeader.includes('note') || lowerHeader.includes('comment')) {
        suggestions[header] = 'notes';
      } else if (lowerHeader.includes('deal') && lowerHeader.includes('value')) {
        suggestions[header] = 'deal_value';
      } else if (lowerHeader.includes('probability')) {
        suggestions[header] = 'probability';
      } else if (lowerHeader.includes('close') && lowerHeader.includes('date')) {
        suggestions[header] = 'expected_close_date';
      } else if (lowerHeader.includes('priority')) {
        suggestions[header] = 'priority';
      }
    });

    return suggestions;
  }
}

export default new ImportService();
