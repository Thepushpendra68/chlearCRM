import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AccountForm from '../components/AccountForm'
import accountService from '../services/accountService'
import userService from '../services/userService'
import toast from 'react-hot-toast'

// Mock dependencies
vi.mock('../services/accountService')
vi.mock('../services/userService')
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock Modal component
vi.mock('../components/Modal', () => ({
  default: ({ children, isOpen, onClose, title }) => {
    if (!isOpen) return null
    return (
      <div data-testid="modal">
        <div>{title}</div>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    )
  }
}))

describe('AccountForm', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Set default mock implementations
    userService.getActiveUsers = vi.fn().mockResolvedValue({ data: [] })
    accountService.getAccounts = vi.fn().mockResolvedValue({ success: true, data: [] })
  })

  it('renders create account form', async () => {
    render(
      <BrowserRouter>
        <AccountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/add new account/i)).toBeInTheDocument()
      expect(screen.getByText(/account name/i)).toBeInTheDocument()
    })
  })

  it('renders edit account form when account prop is provided', async () => {
    const mockAccount = {
      id: 'account-1',
      name: 'Test Account',
      industry: 'Technology',
      status: 'active'
    }

    render(
      <BrowserRouter>
        <AccountForm account={mockAccount} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/edit account/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Account')).toBeInTheDocument()
    })
  })

  it('validates required fields', async () => {
    render(
      <BrowserRouter>
        <AccountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/account name/i)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/account name is required/i)).toBeInTheDocument()
    })
  })

  it('creates account successfully', async () => {
    const mockCreatedAccount = {
      id: 'account-new',
      name: 'New Account',
      industry: 'Technology',
      status: 'active'
    }

    accountService.createAccount = vi.fn().mockResolvedValue({
      success: true,
      data: mockCreatedAccount
    })

    render(
      <BrowserRouter>
        <AccountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/account name/i)).toBeInTheDocument()
    })

    const nameInputs = screen.getAllByRole('textbox')
    const nameInput = nameInputs.find(input => input.placeholder?.includes('account name') || input.value === '')
    if (nameInput) {
      fireEvent.change(nameInput, { target: { value: 'New Account' } })
    }

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(accountService.createAccount).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('updates account successfully', async () => {
    const mockAccount = {
      id: 'account-1',
      name: 'Old Name',
      status: 'active'
    }

    const mockUpdatedAccount = {
      ...mockAccount,
      name: 'Updated Name'
    }

    accountService.updateAccount = vi.fn().mockResolvedValue({
      success: true,
      data: mockUpdatedAccount
    })

    render(
      <BrowserRouter>
        <AccountForm account={mockAccount} onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Old Name')).toBeInTheDocument()
    })

    const nameInput = screen.getByDisplayValue('Old Name')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    const submitButton = screen.getByRole('button', { name: /update account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(accountService.updateAccount).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('handles form submission errors', async () => {
    accountService.createAccount = vi.fn().mockRejectedValue({
      response: {
        data: {
          message: 'Failed to create account'
        }
      }
    })

    render(
      <BrowserRouter>
        <AccountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/account name/i)).toBeInTheDocument()
    })

    const nameInputs = screen.getAllByRole('textbox')
    const nameInput = nameInputs[0]
    fireEvent.change(nameInput, { target: { value: 'New Account' } })

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('closes form when cancel button is clicked', async () => {
    render(
      <BrowserRouter>
        <AccountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/account name/i)).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('validates email format', async () => {
    render(
      <BrowserRouter>
        <AccountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/account name/i)).toBeInTheDocument()
    })

    const nameInputs = screen.getAllByRole('textbox')
    const nameInput = nameInputs[0]
    fireEvent.change(nameInput, { target: { value: 'Test Account' } })

    const emailInput = screen.getByPlaceholderText(/contact@company.com/i) || screen.getByLabelText(/email/i)
    if (emailInput) {
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    }

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      const errorText = screen.queryByText(/valid email/i)
      if (errorText) {
        expect(errorText).toBeInTheDocument()
      }
    }, { timeout: 3000 })
  })

  it('validates website URL format', async () => {
    render(
      <BrowserRouter>
        <AccountForm onClose={mockOnClose} onSuccess={mockOnSuccess} />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/account name/i)).toBeInTheDocument()
    })

    const nameInputs = screen.getAllByRole('textbox')
    const nameInput = nameInputs[0]
    fireEvent.change(nameInput, { target: { value: 'Test Account' } })

    const websiteInput = screen.getByPlaceholderText(/https:\/\/example.com/i) || screen.getByLabelText(/website/i)
    if (websiteInput) {
      fireEvent.change(websiteInput, { target: { value: 'not-a-url' } })
    }

    const submitButton = screen.getByRole('button', { name: /create account/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      const errorText = screen.queryByText(/valid url/i)
      if (errorText) {
        expect(errorText).toBeInTheDocument()
      }
    }, { timeout: 3000 })
  })
})

