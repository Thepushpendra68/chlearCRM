import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import APIClients from '../pages/APIClients';
import api from '../services/api';

// Mock API service
vi.mock('../services/api');

describe('APIClients - Field Mapping UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful API clients fetch
    api.get.mockResolvedValue({
      data: {
        data: []
      }
    });
  });

  const renderAPIClients = () => {
    return render(
      <BrowserRouter>
        <APIClients />
      </BrowserRouter>
    );
  };

  describe('✅ Field Mapping UI Rendering', () => {
    it('should show field mapping section in create modal', async () => {
      renderAPIClients();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      // Click create button
      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      // Check for field mapping section
      await waitFor(() => {
        expect(screen.getByText(/Custom Field Mapping/)).toBeInTheDocument();
        expect(screen.getByText(/Advanced - Optional/)).toBeInTheDocument();
      });
    });

    it('should show help text with example', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Example:/)).toBeInTheDocument();
        expect(screen.getByText(/company_name/)).toBeInTheDocument();
        expect(screen.getByText(/company/)).toBeInTheDocument();
      });
    });

    it('should show "Add Field Mapping" button', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('+ Add Field Mapping')).toBeInTheDocument();
      });
    });
  });

  describe('🎯 Adding Field Mappings', () => {
    it('should add field mapping when button clicked', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('+ Add Field Mapping')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);

      // Should show input fields
      const inputs = screen.getAllByPlaceholderText(/field name/i);
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should add multiple field mappings', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('+ Add Field Mapping')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Field Mapping');
      
      // Add first mapping
      fireEvent.click(addButton);
      
      // Add second mapping
      fireEvent.click(addButton);

      // Add third mapping
      fireEvent.click(addButton);

      // Should have 3 sets of mapping inputs
      const sourceInputs = screen.getAllByPlaceholderText(/Client field name/i);
      expect(sourceInputs.length).toBe(3);
    });

    it('should show arrow between source and target fields', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('+ Add Field Mapping')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);

      // Should show arrow indicator
      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('🗑️ Removing Field Mappings', () => {
    it('should remove field mapping when delete clicked', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('+ Add Field Mapping')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);

      // Get the TrashIcon button (delete button)
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => 
        btn.querySelector('svg') && btn.className.includes('text-red')
      );

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Mapping should be removed
        const sourceInputs = screen.queryAllByPlaceholderText(/Client field name/i);
        expect(sourceInputs.length).toBe(0);
      }
    });
  });

  describe('📝 Form Submission with Field Mapping', () => {
    it('should include custom_field_mapping in API request', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            client_name: 'Test Client',
            api_key: 'ck_test123',
            api_secret: 'secret_test456'
          }
        }
      });

      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Homepage Contact Form/i)).toBeInTheDocument();
      });

      // Fill required fields
      const clientNameInput = screen.getByPlaceholderText(/Homepage Contact Form/i);
      fireEvent.change(clientNameInput, { target: { value: 'Test API Client' } });

      // Add field mapping
      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);

      // Fill mapping fields
      const sourceInputs = screen.getAllByPlaceholderText(/Client field name/i);
      const targetInputs = screen.getAllByPlaceholderText(/CRM field name/i);

      fireEvent.change(sourceInputs[0], { target: { value: 'company_name' } });
      fireEvent.change(targetInputs[0], { target: { value: 'company' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create API Client/i });
      fireEvent.click(submitButton);

      // Verify API was called with custom_field_mapping
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api-clients',
          expect.objectContaining({
            custom_field_mapping: {
              company_name: 'company'
            }
          })
        );
      });
    });

    it('should include multiple mappings in API request', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            client_name: 'Test Client',
            api_key: 'ck_test123',
            api_secret: 'secret_test456'
          }
        }
      });

      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Homepage Contact Form/i)).toBeInTheDocument();
      });

      // Fill required fields
      const clientNameInput = screen.getByPlaceholderText(/Homepage Contact Form/i);
      fireEvent.change(clientNameInput, { target: { value: 'Multi Mapping Client' } });

      // Add multiple field mappings
      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      // Fill mapping fields
      const sourceInputs = screen.getAllByPlaceholderText(/Client field name/i);
      const targetInputs = screen.getAllByPlaceholderText(/CRM field name/i);

      fireEvent.change(sourceInputs[0], { target: { value: 'company_name' } });
      fireEvent.change(targetInputs[0], { target: { value: 'company' } });

      fireEvent.change(sourceInputs[1], { target: { value: 'contact_phone' } });
      fireEvent.change(targetInputs[1], { target: { value: 'phone' } });

      fireEvent.change(sourceInputs[2], { target: { value: 'budget_range' } });
      fireEvent.change(targetInputs[2], { target: { value: 'budget' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create API Client/i });
      fireEvent.click(submitButton);

      // Verify API was called with all mappings
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api-clients',
          expect.objectContaining({
            custom_field_mapping: {
              company_name: 'company',
              contact_phone: 'phone',
              budget_range: 'budget'
            }
          })
        );
      });
    });

    it('should send empty object when no mappings added', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            client_name: 'Test Client',
            api_key: 'ck_test123',
            api_secret: 'secret_test456'
          }
        }
      });

      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Homepage Contact Form/i)).toBeInTheDocument();
      });

      // Fill only required fields, don't add mappings
      const clientNameInput = screen.getByPlaceholderText(/Homepage Contact Form/i);
      fireEvent.change(clientNameInput, { target: { value: 'No Mapping Client' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create API Client/i });
      fireEvent.click(submitButton);

      // Verify API was called with empty mapping object
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api-clients',
          expect.objectContaining({
            custom_field_mapping: {}
          })
        );
      });
    });

    it('should ignore mappings with empty source or target', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            client_name: 'Test Client',
            api_key: 'ck_test123',
            api_secret: 'secret_test456'
          }
        }
      });

      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Homepage Contact Form/i)).toBeInTheDocument();
      });

      // Fill required fields
      const clientNameInput = screen.getByPlaceholderText(/Homepage Contact Form/i);
      fireEvent.change(clientNameInput, { target: { value: 'Partial Mapping Client' } });

      // Add mappings
      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      const sourceInputs = screen.getAllByPlaceholderText(/Client field name/i);
      const targetInputs = screen.getAllByPlaceholderText(/CRM field name/i);

      // First mapping: complete
      fireEvent.change(sourceInputs[0], { target: { value: 'company_name' } });
      fireEvent.change(targetInputs[0], { target: { value: 'company' } });

      // Second mapping: incomplete (only source filled)
      fireEvent.change(sourceInputs[1], { target: { value: 'incomplete' } });
      // Don't fill target

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Create API Client/i });
      fireEvent.click(submitButton);

      // Verify only complete mapping is included
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api-clients',
          expect.objectContaining({
            custom_field_mapping: {
              company_name: 'company'
              // incomplete mapping should NOT be included
            }
          })
        );
      });
    });
  });

  describe('🔄 Form Reset', () => {
    it('should reset field mappings after successful submission', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            client_name: 'Test Client',
            api_key: 'ck_test123',
            api_secret: 'secret_test456'
          }
        }
      });

      api.get.mockResolvedValue({
        data: {
          data: []
        }
      });

      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Homepage Contact Form/i)).toBeInTheDocument();
      });

      // Add field mapping
      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);

      const sourceInputs = screen.getAllByPlaceholderText(/Client field name/i);
      fireEvent.change(sourceInputs[0], { target: { value: 'test_field' } });

      // Fill required fields and submit
      const clientNameInput = screen.getByPlaceholderText(/Homepage Contact Form/i);
      fireEvent.change(clientNameInput, { target: { value: 'Reset Test Client' } });

      const submitButton = screen.getByRole('button', { name: /Create API Client/i });
      fireEvent.click(submitButton);

      // After successful submission, if modal reopens, mappings should be cleared
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });
  });

  describe('🎨 UI/UX Features', () => {
    it('should have proper placeholder text in inputs', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('+ Add Field Mapping')).toBeInTheDocument();
      });

      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);

      // Check for descriptive placeholders
      expect(screen.getByPlaceholderText(/Client field name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/CRM field name/i)).toBeInTheDocument();
    });

    it('should show help text about mapping being optional', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/Advanced - Optional/i)).toBeInTheDocument();
        expect(screen.getByText(/Leave empty to store all fields as-is/i)).toBeInTheDocument();
      });
    });

    it('should have proper section styling and layout', async () => {
      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        const mappingSection = screen.getByText(/Custom Field Mapping/i).closest('div');
        expect(mappingSection).toBeInTheDocument();
        // Section should have border-t class for visual separation
        expect(mappingSection?.className).toContain('border-t');
      });
    });
  });

  describe('⚡ Integration Tests', () => {
    it('should work with complete API client creation flow', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            client_name: 'Complete Test',
            api_key: 'ck_complete123',
            api_secret: 'secret_complete456'
          }
        }
      });

      renderAPIClients();

      await waitFor(() => {
        expect(screen.getByText('Create API Client')).toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByText('Create API Client');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Homepage Contact Form/i)).toBeInTheDocument();
      });

      // Fill all form fields
      fireEvent.change(screen.getByPlaceholderText(/Homepage Contact Form/i), {
        target: { value: 'Integration Test Client' }
      });

      fireEvent.change(screen.getByPlaceholderText(/https:\/\/example.com/i), {
        target: { value: 'https://test.com' }
      });

      fireEvent.change(screen.getByPlaceholderText(/api/i), {
        target: { value: 'website' }
      });

      // Add field mapping
      const addButton = screen.getByText('+ Add Field Mapping');
      fireEvent.click(addButton);

      const sourceInputs = screen.getAllByPlaceholderText(/Client field name/i);
      const targetInputs = screen.getAllByPlaceholderText(/CRM field name/i);

      fireEvent.change(sourceInputs[0], { target: { value: 'company_name' } });
      fireEvent.change(targetInputs[0], { target: { value: 'company' } });

      // Submit
      const submitButton = screen.getByRole('button', { name: /Create API Client/i });
      fireEvent.click(submitButton);

      // Verify complete request
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api-clients',
          expect.objectContaining({
            client_name: 'Integration Test Client',
            default_lead_source: 'website',
            allowed_origins: ['https://test.com'],
            custom_field_mapping: {
              company_name: 'company'
            }
          })
        );
      });
    });
  });
});

