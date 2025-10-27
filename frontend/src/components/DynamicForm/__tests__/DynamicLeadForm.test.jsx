import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DynamicLeadForm from '../DynamicLeadForm';
import { IndustryConfigProvider } from '../../../context/IndustryConfigContext';
import { LeadProvider } from '../../../context/LeadContext';

// Mock the useIndustryConfig hook
vi.mock('../../../context/IndustryConfigContext', () => ({
  useIndustryConfig: () => ({
    config: {
      terminology: { lead: 'Lead' },
      coreFields: {
        firstName: { name: 'first_name', label: 'First Name', type: 'text', required: true },
        lastName: { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        email: { name: 'email', label: 'Email', type: 'email', required: true },
      },
      customFields: {},
      formLayout: {
        sections: [
          {
            id: 'personal_info',
            title: 'Personal Information',
            fields: ['firstName', 'lastName', 'email'],
          },
        ],
      },
    },
    getFields: () => [
      { id: 'firstName', name: 'first_name', label: 'First Name', type: 'text', required: true },
      { id: 'lastName', name: 'last_name', label: 'Last Name', type: 'text', required: true },
      { id: 'email', name: 'email', label: 'Email', type: 'email', required: true },
    ],
    formLayout: {
      sections: [
        {
          id: 'personal_info',
          title: 'Personal Information',
          fields: ['firstName', 'lastName', 'email'],
        },
      ],
    },
  }),
}));

// Mock the useLeads hook
vi.mock('../../../context/LeadContext', () => ({
  useLeads: () => ({
    addLead: vi.fn(),
    updateLead: vi.fn(),
  }),
}));

describe('DynamicLeadForm', () => {
  it('should render the form with the correct fields', () => {
    render(
      <LeadProvider>
        <IndustryConfigProvider>
          <DynamicLeadForm onClose={() => {}} />
        </IndustryConfigProvider>
      </LeadProvider>
    );

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should update the form data when the user types in a field', () => {
    render(
      <LeadProvider>
        <IndustryConfigProvider>
          <DynamicLeadForm onClose={() => {}} />
        </IndustryConfigProvider>
      </LeadProvider>
    );

    const firstNameInput = screen.getByLabelText('First Name');
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    expect(firstNameInput.value).toBe('John');
  });
});
