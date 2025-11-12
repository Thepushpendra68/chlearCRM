import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowLibrary from '../src/pages/WorkflowLibrary';
import emailService from '../src/services/emailService';
import api from '../src/services/api';

jest.mock('../src/services/emailService');
jest.mock('../src/services/api');

describe('WorkflowLibrary Component', () => {
  const mockTemplates = [
    {
      id: '1',
      name: 'Welcome Sequence',
      description: 'Welcome new users to the platform',
      category: 'welcome',
      industry: 'saas',
      usage_count: 42,
      is_public: true,
      created_at: '2025-01-01'
    },
    {
      id: '2',
      name: 'Product Nurture',
      description: 'Nurture leads about your product',
      category: 'nurture',
      industry: 'ecommerce',
      usage_count: 15,
      is_public: false,
      created_at: '2025-01-02'
    }
  ];

  const mockPacks = [
    {
      id: 'pack-1',
      name: 'SaaS Onboarding Pack',
      description: 'Complete onboarding sequence for SaaS companies',
      industry: 'saas',
      category: 'onboarding',
      templates: [
        {
          id: 'tpl-1',
          name: 'Welcome Email',
          description: 'First touchpoint',
          category: 'welcome'
        },
        {
          id: 'tpl-2',
          name: 'Feature Introduction',
          description: 'Highlight key features',
          category: 'nurture'
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders workflow library page', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    render(<WorkflowLibrary />);

    expect(screen.getByText('Workflow Library')).toBeInTheDocument();
    expect(screen.getByText('Browse and use pre-built email sequence templates')).toBeInTheDocument();
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });

  test('displays template packs', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    api.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: mockPacks
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('SaaS Onboarding Pack')).toBeInTheDocument();
      expect(screen.getByText('Complete onboarding sequence for SaaS companies')).toBeInTheDocument();
    });
  });

  test('filters templates by category', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Filter by category
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'welcome' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/email/workflow-templates?category=welcome');
    });
  });

  test('filters templates by industry', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Filter by industry
    const industrySelect = screen.getByLabelText('Industry');
    fireEvent.change(industrySelect, { target: { value: 'saas' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/email/workflow-templates?industry=saas');
    });
  });

  test('searches templates by name', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Search
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'Welcome' } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/email/workflow-templates?search=Welcome');
    });
  });

  test('creates sequence from template', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    emailService.createSequence.mockResolvedValue({
      data: { success: true, data: { id: 'seq-1' } }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Click Use Template button
    const useButtons = screen.getAllByText('Use Template');
    fireEvent.click(useButtons[0]);

    // Verify sequence creation
    await waitFor(() => {
      expect(emailService.createSequence).toHaveBeenCalled();
    });
  });

  test('imports template from file', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    const mockPost = jest.fn().mockResolvedValue({
      data: { success: true }
    });
    api.post = mockPost;

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Workflow Library')).toBeInTheDocument();
    });

    // Open import dialog
    const importButton = screen.getByText('Import Template');
    fireEvent.click(importButton);

    // Create a mock file
    const fileContent = JSON.stringify({
      name: 'Imported Template',
      description: 'Imported from file',
      category: 'welcome',
      json_definition: { steps: [] }
    });

    const file = new File([fileContent], 'template.json', {
      type: 'application/json'
    });

    const fileInput = screen.getByLabelText('Import File');
    Object.defineProperty(fileInput, 'files', {
      value: [file]
    });

    fireEvent.change(fileInput);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/email/workflow-templates/import',
        expect.any(FormData)
      );
    });
  });

  test('exports template', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    const mockGet = jest.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          id: '1',
          name: 'Welcome Sequence',
          json_definition: { steps: [] }
        }
      }
    });
    api.get = mockGet;

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Click export button
    const exportButtons = screen.getAllByText('Export');
    fireEvent.click(exportButtons[0]);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/email/workflow-templates/1/export');
    });
  });

  test('displays usage statistics', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Check if usage count is displayed
    expect(screen.getByText('Used 42 times')).toBeInTheDocument();
    expect(screen.getByText('Used 15 times')).toBeInTheDocument();
  });

  test('handles empty state', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: []
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
      expect(screen.getByText('Create your first workflow template')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('API Error'));

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('shows loading state', async () => {
    let resolvePromise;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    api.get.mockReturnValue(pendingPromise);

    render(<WorkflowLibrary />);

    // Should show loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });
  });

  test('applies multiple filters simultaneously', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Apply category filter
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'welcome' } });

    // Apply industry filter
    const industrySelect = screen.getByLabelText('Industry');
    fireEvent.change(industrySelect, { target: { value: 'saas' } });

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search templates...');
    fireEvent.change(searchInput, { target: { value: 'Welcome' } });

    // Should call API with all filters
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        '/email/workflow-templates?category=welcome&industry=saas&search=Welcome'
      );
    });
  });

  test('displays public/private badge', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: mockTemplates
      }
    });

    render(<WorkflowLibrary />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Sequence')).toBeInTheDocument();
    });

    // Check badges
    const badges = screen.getAllByRole('status');
    const publicBadge = badges.find(badge => badge.textContent === 'Public');
    const privateBadge = badges.find(badge => badge.textContent === 'Private');

    expect(publicBadge).toBeInTheDocument();
    expect(privateBadge).toBeInTheDocument();
  });
});
