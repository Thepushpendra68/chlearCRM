import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PicklistProvider } from '../context/PicklistContext';
import LeadDetail from '../pages/LeadDetail';
import leadService from '../services/leadService';

// Mock services
vi.mock('../services/leadService');
vi.mock('../services/taskService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'lead-123' }),
    useNavigate: () => vi.fn()
  };
});

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('LeadDetail - Custom Fields Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLeadDetail = () => {
    return render(
      <BrowserRouter>
        <PicklistProvider>
          <LeadDetail />
        </PicklistProvider>
      </BrowserRouter>
    );
  };

  describe('✅ Custom Fields Rendering', () => {
    it('should display Custom Fields section when custom_fields exist', async () => {
      const mockLead = {
        id: 'lead-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          budget: '$50,000',
          timeline: 'Q1 2024',
          company_size: '50-100'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('Custom Fields')).toBeInTheDocument();
      });

      // Check field count badge
      expect(screen.getByText('3 fields')).toBeInTheDocument();

      // Check field names are formatted (Title Case)
      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Company Size')).toBeInTheDocument();

      // Check field values
      expect(screen.getByText('$50,000')).toBeInTheDocument();
      expect(screen.getByText('Q1 2024')).toBeInTheDocument();
      expect(screen.getByText('50-100')).toBeInTheDocument();
    });

    it('should NOT display Custom Fields section when no custom_fields', async () => {
      const mockLead = {
        id: 'lead-456',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        lead_source: 'website',
        status: 'new',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Custom Fields section should NOT be present
      expect(screen.queryByText('Custom Fields')).not.toBeInTheDocument();
    });

    it('should NOT display Custom Fields section when custom_fields is empty object', async () => {
      const mockLead = {
        id: 'lead-789',
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com',
        lead_source: 'referral',
        status: 'new',
        priority: 'medium',
        custom_fields: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      // Custom Fields section should NOT be present for empty object
      expect(screen.queryByText('Custom Fields')).not.toBeInTheDocument();
    });
  });

  describe('🎨 Field Name Formatting', () => {
    it('should format snake_case field names to Title Case', async () => {
      const mockLead = {
        id: 'lead-format',
        first_name: 'Format',
        last_name: 'Test',
        email: 'format@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          company_size: '100',
          hear_about_us: 'Google',
          interested_in_product: 'Enterprise',
          newsletter_signup: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('Company Size')).toBeInTheDocument();
        expect(screen.getByText('Hear About Us')).toBeInTheDocument();
        expect(screen.getByText('Interested In Product')).toBeInTheDocument();
        expect(screen.getByText('Newsletter Signup')).toBeInTheDocument();
      });
    });
  });

  describe('📊 Data Type Handling', () => {
    it('should display boolean true as "Yes"', async () => {
      const mockLead = {
        id: 'lead-bool-true',
        first_name: 'Bool',
        last_name: 'True',
        email: 'bool@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          newsletter: true,
          demo_requested: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        const yesElements = screen.getAllByText('Yes');
        expect(yesElements).toHaveLength(2);
      });
    });

    it('should display boolean false as "No"', async () => {
      const mockLead = {
        id: 'lead-bool-false',
        first_name: 'Bool',
        last_name: 'False',
        email: 'bool@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          newsletter: false,
          urgent: false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        const noElements = screen.getAllByText('No');
        expect(noElements).toHaveLength(2);
      });
    });

    it('should display numbers as strings', async () => {
      const mockLead = {
        id: 'lead-numbers',
        first_name: 'Number',
        last_name: 'Test',
        email: 'num@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          employee_count: 150,
          budget_amount: 75000,
          score: 95.5
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('75000')).toBeInTheDocument();
        expect(screen.getByText('95.5')).toBeInTheDocument();
      });
    });

    it('should display null values as "N/A"', async () => {
      const mockLead = {
        id: 'lead-null',
        first_name: 'Null',
        last_name: 'Test',
        email: 'null@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          optional_field: null,
          another_field: undefined
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        const naElements = screen.getAllByText('N/A');
        expect(naElements.length).toBeGreaterThan(0);
      });
    });

    it('should convert objects to JSON strings', async () => {
      const mockLead = {
        id: 'lead-object',
        first_name: 'Object',
        last_name: 'Test',
        email: 'obj@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          complex_data: { key: 'value', nested: { data: 'test' } }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText(/key.*value/)).toBeInTheDocument();
      });
    });
  });

  describe('📱 Field Count Badge', () => {
    it('should display singular "field" for one custom field', async () => {
      const mockLead = {
        id: 'lead-one-field',
        first_name: 'Single',
        last_name: 'Field',
        email: 'single@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          budget: '$25k'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('1 field')).toBeInTheDocument();
      });
    });

    it('should display plural "fields" for multiple custom fields', async () => {
      const mockLead = {
        id: 'lead-multi-fields',
        first_name: 'Multi',
        last_name: 'Fields',
        email: 'multi@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          field1: 'value1',
          field2: 'value2',
          field3: 'value3',
          field4: 'value4',
          field5: 'value5'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('5 fields')).toBeInTheDocument();
      });
    });
  });

  describe('🎯 Real-World Scenarios', () => {
    it('should display real estate lead custom fields', async () => {
      const mockLead = {
        id: 'lead-realestate',
        first_name: 'Real',
        last_name: 'Estate',
        email: 'realestate@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          property_type: 'House',
          budget_range: '$500k-$1M',
          preferred_location: 'Downtown',
          bedrooms: '3-4',
          move_in_date: 'Q2 2024'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('Property Type')).toBeInTheDocument();
        expect(screen.getByText('House')).toBeInTheDocument();
        expect(screen.getByText('Budget Range')).toBeInTheDocument();
        expect(screen.getByText('$500k-$1M')).toBeInTheDocument();
        expect(screen.getByText('Preferred Location')).toBeInTheDocument();
        expect(screen.getByText('Downtown')).toBeInTheDocument();
      });
    });

    it('should display SaaS lead custom fields', async () => {
      const mockLead = {
        id: 'lead-saas',
        first_name: 'SaaS',
        last_name: 'Lead',
        email: 'saas@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: {
          company_size: '50-100',
          current_tool: 'Excel',
          monthly_budget: '$5,000',
          team_size: '25',
          interested_plan: 'Enterprise'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('Current Tool')).toBeInTheDocument();
        expect(screen.getByText('Excel')).toBeInTheDocument();
        expect(screen.getByText('Interested Plan')).toBeInTheDocument();
        expect(screen.getByText('Enterprise')).toBeInTheDocument();
      });
    });
  });

  describe('⚡ Performance', () => {
    it('should handle many custom fields (20+) efficiently', async () => {
      const customFields = {};
      for (let i = 1; i <= 25; i++) {
        customFields[`field_${i}`] = `value_${i}`;
      }

      const mockLead = {
        id: 'lead-many-fields',
        first_name: 'Many',
        last_name: 'Fields',
        email: 'many@test.com',
        lead_source: 'api',
        status: 'new',
        priority: 'medium',
        custom_fields: customFields,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      leadService.getLeadById.mockResolvedValue({ data: mockLead });

      const startTime = Date.now();
      renderLeadDetail();

      await waitFor(() => {
        expect(screen.getByText('25 fields')).toBeInTheDocument();
      });

      const renderTime = Date.now() - startTime;
      // Should render in reasonable time (< 1 second)
      expect(renderTime).toBeLessThan(1000);
    });
  });
});

