import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Accounts from '../pages/Accounts'
import accountService from '../services/accountService'

// Mock dependencies
vi.mock('../services/accountService')
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      company_id: 'company-1',
      role: 'company_admin'
    }
  })
}))
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

describe('Accounts', () => {
  const mockAccounts = [
    {
      id: 'account-1',
      name: 'Account 1',
      industry: 'Technology',
      status: 'active',
      email: 'account1@example.com',
      created_at: new Date().toISOString()
    },
    {
      id: 'account-2',
      name: 'Account 2',
      industry: 'Finance',
      status: 'active',
      email: 'account2@example.com',
      created_at: new Date().toISOString()
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    accountService.getAccounts.mockResolvedValue({
      success: true,
      data: mockAccounts,
      pagination: {
        current_page: 1,
        items_per_page: 20,
        total_items: 2,
        total_pages: 1,
        has_next: false,
        has_prev: false
      }
    })
  })

  it('renders accounts list', async () => {
    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Account 1')).toBeInTheDocument()
      expect(screen.getByText('Account 2')).toBeInTheDocument()
    })
  })

  it('displays add account button', () => {
    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    expect(screen.getByText(/add account/i)).toBeInTheDocument()
  })

  it('opens account form when add button is clicked', () => {
    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    const addButton = screen.getByText(/add account/i)
    fireEvent.click(addButton)

    expect(screen.getByText(/add new account/i)).toBeInTheDocument()
  })

  it('filters accounts by status', async () => {
    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(accountService.getAccounts).toHaveBeenCalled()
    })

    // Find the status filter select - it's a select element with "All Statuses" option
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })

    // Find select by its options
    const selects = screen.getAllByRole('combobox')
    const statusSelect = selects.find(select => {
      try {
        const options = Array.from(select.options || [])
        return options.some(opt => opt.textContent?.includes('All Statuses') || opt.textContent?.includes('Status'))
      } catch {
        return false
      }
    }) || screen.getByDisplayValue('All Statuses') || selects[0]
    
    if (statusSelect) {
      fireEvent.change(statusSelect, { target: { value: 'active' } })

      // Wait for debounce (500ms) plus a bit more
      await waitFor(() => {
        const calls = accountService.getAccounts.mock.calls
        expect(calls.length).toBeGreaterThan(1) // Should have been called again after filter change
        const lastCall = calls[calls.length - 1]
        expect(lastCall[0]).toHaveProperty('status', 'active')
      }, { timeout: 1500 })
    }
  })

  it('searches accounts by name', async () => {
    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    const searchInput = screen.getByPlaceholderText(/search accounts/i)
    fireEvent.change(searchInput, { target: { value: 'Account 1' } })

    await waitFor(() => {
      expect(accountService.getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Account 1'
        })
      )
    })
  })

  it('handles pagination', async () => {
    accountService.getAccounts.mockResolvedValue({
      success: true,
      data: mockAccounts,
      pagination: {
        current_page: 1,
        items_per_page: 20,
        total_items: 50,
        total_pages: 3,
        has_next: true,
        has_prev: false
      }
    })

    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Look for Next button in pagination - it might be in a nav with aria-label="Pagination"
      const paginationNav = screen.getByLabelText(/pagination/i)
      expect(paginationNav).toBeInTheDocument()
      // Check if Next button exists (might be disabled or enabled)
      const nextButtons = screen.queryAllByText(/next/i)
      expect(nextButtons.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })

  it('displays account details in table', async () => {
    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    // Wait for the accounts to load and be displayed in the table
    await waitFor(() => {
      expect(accountService.getAccounts).toHaveBeenCalled()
    })

    // Wait for the table to render with account data
    await waitFor(() => {
      expect(screen.getByText('Account 1')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Find the table row containing Account 1
    const accountRow = screen.getByText('Account 1').closest('tr')
    expect(accountRow).toBeInTheDocument()

    // Verify other details are present within the table row (not in dropdowns)
    // Technology should be in the table cell, not in the select option
    const technologyInTable = Array.from(accountRow?.querySelectorAll('*') || [])
      .find(el => el.textContent === 'Technology' && el.tagName !== 'OPTION')
    expect(technologyInTable).toBeTruthy()

    // Email should be in the table
    expect(screen.getByText('account1@example.com')).toBeInTheDocument()
  })

  it('opens edit form when edit button is clicked', async () => {
    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Account 1')).toBeInTheDocument()
    })

    // Find edit button by finding the PencilIcon (edit icon) and clicking its parent button
    const editButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.className.includes('text-gray-600')
    )
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0])
    } else {
      // Fallback: try to find by text content or aria-label
      const allButtons = screen.getAllByRole('button')
      const editButton = allButtons.find(btn => btn.textContent.includes('Edit') || btn.getAttribute('aria-label')?.includes('edit'))
      if (editButton) fireEvent.click(editButton)
    }

    expect(screen.getByText(/edit account/i)).toBeInTheDocument()
  })

  it('handles delete account', async () => {
    // Mock window.confirm to return true
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    accountService.deleteAccount.mockResolvedValue({
      success: true
    })


    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Account 1')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Find delete button - look for buttons in the table row for Account 1
    await waitFor(() => {
      // Find the row containing Account 1
      const accountRow = screen.getByText('Account 1').closest('tr')
      expect(accountRow).toBeInTheDocument()
      
      // Find all buttons in that row
      const rowButtons = accountRow?.querySelectorAll('button') || []
      // The delete button should be the last button (after View and Edit)
      if (rowButtons.length >= 3) {
        const deleteButton = Array.from(rowButtons)[rowButtons.length - 1]
        fireEvent.click(deleteButton)
      } else {
        // Fallback: find by red color class
        const allButtons = screen.getAllByRole('button')
        const deleteButton = allButtons.find(btn => 
          btn.className?.includes('text-red-600') || 
          btn.className?.includes('red-600')
        )
        if (deleteButton) {
          fireEvent.click(deleteButton)
        }
      }
    })

    // Wait for confirm dialog and delete call
    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled()
      expect(accountService.deleteAccount).toHaveBeenCalledWith('account-1')
    }, { timeout: 2000 })

    confirmSpy.mockRestore()
  })

  it('handles loading state', () => {
    accountService.getAccounts.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles empty state', async () => {
    accountService.getAccounts.mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        current_page: 1,
        items_per_page: 20,
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      }
    })

    render(
      <BrowserRouter>
        <Accounts />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/no accounts/i)).toBeInTheDocument()
    })
  })
})

