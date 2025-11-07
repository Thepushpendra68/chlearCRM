import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AccountDetail from '../pages/AccountDetail'
import accountService from '../services/accountService'
import activityService from '../services/activityService'
import taskService from '../services/taskService'

// Mock dependencies
vi.mock('../services/accountService')
vi.mock('../services/activityService')
vi.mock('../services/taskService')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'account-1' }),
    useNavigate: () => vi.fn()
  }
})
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      company_id: 'company-1',
      role: 'company_admin'
    }
  })
}))

describe('AccountDetail', () => {
  const mockAccount = {
    id: 'account-1',
    name: 'Test Account',
    industry: 'Technology',
    status: 'active',
    email: 'test@example.com',
    phone: '123-456-7890',
    website: 'https://example.com',
    annual_revenue: 1000000,
    employee_count: 50,
    notes: 'Test notes',
    custom_fields: {}
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    accountService.getAccountById.mockResolvedValue({
      success: true,
      data: mockAccount
    })
    
    accountService.getAccountLeads.mockResolvedValue({
      success: true,
      data: []
    })
    
    accountService.getAccountStats.mockResolvedValue({
      success: true,
      data: {
        leads_count: 5,
        activities_count: 10,
        tasks_count: 3,
        child_accounts_count: 2
      }
    })
    
    accountService.getAccountTimeline.mockResolvedValue({
      success: true,
      data: []
    })
    
    activityService.getActivities.mockResolvedValue({
      success: true,
      data: []
    })
    
    taskService.getTasks.mockResolvedValue({
      success: true,
      data: []
    })
  })

  it('renders account detail page', async () => {
    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Account')).toBeInTheDocument()
    })
  })

  it('displays account information', async () => {
    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Account')).toBeInTheDocument()
      expect(screen.getByText('Technology')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })
  })

  it('displays account statistics', async () => {
    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/5/i)).toBeInTheDocument() // leads_count
      expect(screen.getByText(/10/i)).toBeInTheDocument() // activities_count
      expect(screen.getByText(/3/i)).toBeInTheDocument() // tasks_count
    })
  })

  it('displays associated leads', async () => {
    const mockLeads = [
      {
        id: 'lead-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        status: 'new'
      }
    ]

    accountService.getAccountLeads.mockResolvedValue({
      success: true,
      data: mockLeads
    })

    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('displays activities list', async () => {
    const mockActivities = [
      {
        id: 'activity-1',
        subject: 'Test Activity',
        activity_type: 'call',
        is_completed: false,
        created_at: new Date().toISOString()
      }
    ]

    activityService.getActivities.mockResolvedValue({
      success: true,
      data: mockActivities
    })

    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Activity')).toBeInTheDocument()
    })
  })

  it('displays tasks list', async () => {
    const mockTasks = [
      {
        id: 'task-1',
        title: 'Test Task',
        task_type: 'follow_up',
        status: 'pending',
        priority: 'high',
        due_date: new Date().toISOString()
      }
    ]

    taskService.getTasks.mockResolvedValue({
      success: true,
      data: mockTasks
    })

    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })
  })

  it('shows add activity button', async () => {
    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/add activity/i)).toBeInTheDocument()
    })
  })

  it('shows add task button', async () => {
    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/add task/i)).toBeInTheDocument()
    })
  })

  it('displays timeline section', async () => {
    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/timeline/i)).toBeInTheDocument()
    })
  })

  it('handles loading state', () => {
    accountService.getAccountById.mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('handles error state', async () => {
    accountService.getAccountById.mockRejectedValue(new Error('Failed to load account'))

    render(
      <BrowserRouter>
        <AccountDetail />
      </BrowserRouter>
    )

    await waitFor(() => {
      // Error should be handled gracefully
      expect(accountService.getAccountById).toHaveBeenCalled()
    })
  })
})

