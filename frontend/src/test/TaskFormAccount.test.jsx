import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TaskForm from '../components/Tasks/TaskForm'
import taskService from '../services/taskService'
import accountService from '../services/accountService'
import leadService from '../services/leadService'
import userService from '../services/userService'

// Mock dependencies
vi.mock('../../services/taskService')
vi.mock('../../services/accountService')
vi.mock('../../services/leadService')
vi.mock('../../services/userService')
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      company_id: 'company-1'
    }
  })
}))

describe('TaskForm with Account Support', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  const mockAccounts = [
    { id: 'account-1', name: 'Test Account', industry: 'Technology' }
  ]

  const mockLeads = [
    { id: 'lead-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
  ]

  const mockUsers = [
    { id: 'user-1', first_name: 'User', last_name: 'One' }
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
    
    userService.getActiveUsers.mockResolvedValue({
      data: mockUsers
    })
  })

  it('displays account selector in task form', async () => {
    render(
      <TaskForm
        isOpen={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/related account/i)).toBeInTheDocument()
    })
  })

  it('allows creating task with account_id', async () => {
    render(
      <TaskForm
        isOpen={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/related account/i)).toBeInTheDocument()
    })

    const titleInput = screen.getByLabelText(/title/i)
    const assignedToSelect = screen.getByLabelText(/assigned to/i)
    const accountSelect = screen.getByLabelText(/related account/i)

    fireEvent.change(titleInput, { target: { value: 'Test Task' } })
    fireEvent.change(assignedToSelect, { target: { value: 'user-1' } })
    fireEvent.change(accountSelect, { target: { value: 'account-1' } })

    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          account_id: 'account-1',
          lead_id: null
        })
      )
    })
  })

  it('allows creating task with lead_id', async () => {
    render(
      <TaskForm
        isOpen={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/related lead/i)).toBeInTheDocument()
    })

    const titleInput = screen.getByLabelText(/title/i)
    const assignedToSelect = screen.getByLabelText(/assigned to/i)
    const leadSelect = screen.getByLabelText(/related lead/i)

    fireEvent.change(titleInput, { target: { value: 'Test Task' } })
    fireEvent.change(assignedToSelect, { target: { value: 'user-1' } })
    fireEvent.change(leadSelect, { target: { value: 'lead-1' } })

    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          lead_id: 'lead-1',
          account_id: null
        })
      )
    })
  })

  it('clears account when lead is selected', async () => {
    render(
      <TaskForm
        isOpen={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        accountId="account-1"
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('account-1')).toBeInTheDocument()
    })

    const leadSelect = screen.getByLabelText(/related lead/i)
    fireEvent.change(leadSelect, { target: { value: 'lead-1' } })

    await waitFor(() => {
      const accountSelect = screen.getByLabelText(/related account/i)
      expect(accountSelect.value).toBe('')
    })
  })

  it('clears lead when account is selected', async () => {
    render(
      <TaskForm
        isOpen={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        leadId="lead-1"
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('lead-1')).toBeInTheDocument()
    })

    const accountSelect = screen.getByLabelText(/related account/i)
    fireEvent.change(accountSelect, { target: { value: 'account-1' } })

    await waitFor(() => {
      const leadSelect = screen.getByLabelText(/related lead/i)
      expect(leadSelect.value).toBe('')
    })
  })

  it('pre-fills account when accountId prop is provided', async () => {
    render(
      <TaskForm
        isOpen={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        accountId="account-1"
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('account-1')).toBeInTheDocument()
    })
  })

  it('pre-fills lead when leadId prop is provided', async () => {
    render(
      <TaskForm
        isOpen={true}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
        leadId="lead-1"
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('lead-1')).toBeInTheDocument()
    })
  })

  it('allows editing task with account_id', async () => {
    const mockTask = {
      id: 'task-1',
      title: 'Existing Task',
      account_id: 'account-1',
      assigned_to: 'user-1',
      status: 'pending'
    }

    render(
      <TaskForm
        isOpen={true}
        task={mockTask}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('account-1')).toBeInTheDocument()
    })
  })
})

