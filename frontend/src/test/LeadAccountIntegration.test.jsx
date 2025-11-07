import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LeadForm from '../components/LeadForm'
import LeadDetail from '../pages/LeadDetail'
import leadService from '../services/leadService'
import accountService from '../services/accountService'

// Mock dependencies
vi.mock('../services/leadService')
vi.mock('../services/accountService')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'lead-1' }),
    useNavigate: () => vi.fn()
  }
})
vi.mock('../context/LeadContext', () => ({
  useLeads: () => ({
    addLead: vi.fn(),
    updateLead: vi.fn()
  })
}))
vi.mock('../context/PicklistContext', () => ({
  usePicklists: () => ({
    leadSourcesDisplay: [],
    leadStatusesDisplay: [],
    loading: false
  })
}))

describe('Lead-Account Integration', () => {
  const mockAccounts = [
    {
      id: 'account-1',
      name: 'Test Account',
      industry: 'Technology'
    },
    {
      id: 'account-2',
      name: 'Another Account',
      industry: 'Finance'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    accountService.getAccounts.mockResolvedValue({
      success: true,
      data: mockAccounts
    })
  })

  describe('LeadForm with Account Selector', () => {
    it('displays account selector in lead form', async () => {
      render(<LeadForm onClose={vi.fn()} onSuccess={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/account/i)).toBeInTheDocument()
      })
    })

    it('loads accounts for selector', async () => {
      render(<LeadForm onClose={vi.fn()} onSuccess={vi.fn()} />)

      await waitFor(() => {
        expect(accountService.getAccounts).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 1000,
            status: 'active'
          })
        )
      })
    })

    it('allows selecting an account when creating lead', async () => {
      leadService.createLead.mockResolvedValue({
        success: true,
        data: {
          id: 'lead-new',
          first_name: 'John',
          last_name: 'Doe',
          account_id: 'account-1'
        }
      })

      render(<LeadForm onClose={vi.fn()} onSuccess={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/account/i)).toBeInTheDocument()
      })

      const firstNameInput = screen.getByLabelText(/first name/i)
      const lastNameInput = screen.getByLabelText(/last name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const accountSelect = screen.getByLabelText(/account/i)

      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
      fireEvent.change(accountSelect, { target: { value: 'account-1' } })

      const submitButton = screen.getByRole('button', { name: /create lead/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(leadService.createLead).toHaveBeenCalledWith(
          expect.objectContaining({
            account_id: 'account-1'
          })
        )
      })
    })

    it('allows selecting an account when editing lead', async () => {
      const mockLead = {
        id: 'lead-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        account_id: null
      }

      leadService.updateLead.mockResolvedValue({
        success: true,
        data: {
          ...mockLead,
          account_id: 'account-1'
        }
      })

      render(<LeadForm lead={mockLead} onClose={vi.fn()} onSuccess={vi.fn()} />)

      await waitFor(() => {
        expect(screen.getByLabelText(/account/i)).toBeInTheDocument()
      })

      const accountSelect = screen.getByLabelText(/account/i)
      fireEvent.change(accountSelect, { target: { value: 'account-1' } })

      const submitButton = screen.getByRole('button', { name: /update lead/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(leadService.updateLead).toHaveBeenCalledWith(
          'lead-1',
          expect.objectContaining({
            account_id: 'account-1'
          })
        )
      })
    })
  })

  describe('LeadDetail with Account Display', () => {
    it('displays account information when lead has account', async () => {
      const mockLead = {
        id: 'lead-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        account_id: 'account-1'
      }

      const mockAccount = {
        id: 'account-1',
        name: 'Test Account',
        industry: 'Technology'
      }

      leadService.getLeadById.mockResolvedValue({
        success: true,
        data: mockLead
      })

      accountService.getAccountById.mockResolvedValue({
        success: true,
        data: mockAccount
      })

      render(
        <BrowserRouter>
          <LeadDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Account')).toBeInTheDocument()
      })
    })

    it('does not display account section when lead has no account', async () => {
      const mockLead = {
        id: 'lead-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        account_id: null
      }

      leadService.getLeadById.mockResolvedValue({
        success: true,
        data: mockLead
      })

      render(
        <BrowserRouter>
          <LeadDetail />
        </BrowserRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      expect(screen.queryByText(/account/i)).not.toBeInTheDocument()
    })
  })
})

