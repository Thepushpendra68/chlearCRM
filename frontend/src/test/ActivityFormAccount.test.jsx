import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ActivityForm from '../components/Activities/ActivityForm'
import activityService from '../services/activityService'
import accountService from '../services/accountService'
import leadService from '../services/leadService'

// Mock dependencies
vi.mock('../../services/activityService')
vi.mock('../../services/accountService')
vi.mock('../../services/leadService')

describe('ActivityForm with Account Support', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  const mockAccounts = [
    { id: 'account-1', name: 'Test Account', industry: 'Technology' }
  ]

  const mockLeads = [
    { id: 'lead-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    accountService.getAccounts.mockResolvedValue({
      success: true,
      data: mockAccounts
    })
    
    leadService.getLeads.mockResolvedValue({
      success: true,
      data: mockLeads
    })
  })

  it('displays account selector in activity form', async () => {
    render(
      <ActivityForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/select lead or account/i)).toBeInTheDocument()
      expect(screen.getByText(/account/i)).toBeInTheDocument()
    })
  })

  it('allows creating activity with account_id', async () => {
    activityService.createActivity.mockResolvedValue({
      success: true,
      data: {
        id: 'activity-1',
        account_id: 'account-1',
        subject: 'Test Activity',
        activity_type: 'call'
      }
    })

    render(
      <ActivityForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/account/i)).toBeInTheDocument()
    })

    const accountSelect = screen.getByLabelText(/account/i)
    fireEvent.change(accountSelect, { target: { value: 'account-1' } })

    const subjectInput = screen.getByLabelText(/subject/i)
    fireEvent.change(subjectInput, { target: { value: 'Test Activity' } })

    const submitButton = screen.getByRole('button', { name: /save activity/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(activityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 'account-1',
          lead_id: null
        })
      )
    })
  })

  it('allows creating activity with lead_id', async () => {
    activityService.createActivity.mockResolvedValue({
      success: true,
      data: {
        id: 'activity-1',
        lead_id: 'lead-1',
        subject: 'Test Activity',
        activity_type: 'call'
      }
    })

    render(
      <ActivityForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/lead/i)).toBeInTheDocument()
    })

    const leadSelect = screen.getByLabelText(/lead/i)
    fireEvent.change(leadSelect, { target: { value: 'lead-1' } })

    const subjectInput = screen.getByLabelText(/subject/i)
    fireEvent.change(subjectInput, { target: { value: 'Test Activity' } })

    const submitButton = screen.getByRole('button', { name: /save activity/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(activityService.createActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          lead_id: 'lead-1',
          account_id: null
        })
      )
    })
  })

  it('clears account when lead is selected', async () => {
    render(
      <ActivityForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        accountId="account-1"
        selectedAccount={mockAccounts[0]}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('account-1')).toBeInTheDocument()
    })

    const leadSelect = screen.getByLabelText(/lead/i)
    fireEvent.change(leadSelect, { target: { value: 'lead-1' } })

    await waitFor(() => {
      const accountSelect = screen.getByLabelText(/account/i)
      expect(accountSelect.value).toBe('')
    })
  })

  it('clears lead when account is selected', async () => {
    render(
      <ActivityForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        leadId="lead-1"
        selectedLead={mockLeads[0]}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('lead-1')).toBeInTheDocument()
    })

    const accountSelect = screen.getByLabelText(/account/i)
    fireEvent.change(accountSelect, { target: { value: 'account-1' } })

    await waitFor(() => {
      const leadSelect = screen.getByLabelText(/lead/i)
      expect(leadSelect.value).toBe('')
    })
  })

  it('requires either lead or account to be selected', async () => {
    render(
      <ActivityForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    )

    const subjectInput = screen.getByLabelText(/subject/i)
    fireEvent.change(subjectInput, { target: { value: 'Test Activity' } })

    const submitButton = screen.getByRole('button', { name: /save activity/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/select either a lead or an account/i)).toBeInTheDocument()
    })
  })

  it('pre-fills account when accountId prop is provided', async () => {
    render(
      <ActivityForm
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        accountId="account-1"
        selectedAccount={mockAccounts[0]}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('account-1')).toBeInTheDocument()
      expect(screen.getByText(/account: test account/i)).toBeInTheDocument()
    })
  })
})

