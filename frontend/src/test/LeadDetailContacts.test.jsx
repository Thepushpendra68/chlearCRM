import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LeadDetail from '../pages/LeadDetail'
import leadService from '../services/leadService'
import contactService from '../services/contactService'
import accountService from '../services/accountService'
import taskService from '../services/taskService'
import toast from 'react-hot-toast'

vi.mock('../services/leadService')
vi.mock('../services/contactService')
vi.mock('../services/accountService')
vi.mock('../services/taskService')
vi.mock('react-hot-toast', () => {
  const success = vi.fn()
  const error = vi.fn()
  return {
    __esModule: true,
    default: { success, error },
    success,
    error
  }
})
vi.mock('../context/PicklistContext', () => ({
  usePicklists: () => ({
    leadSources: [{ value: 'website', label: 'Website' }],
    leadStatuses: [{ value: 'new', label: 'New' }]
  })
}))
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'lead-1' }),
    useNavigate: () => vi.fn()
  }
})

const linkedContact = {
  id: 'rel-1',
  contact_id: 'contact-1',
  is_primary: true,
  role: 'Decision Maker',
  contact: {
    id: 'contact-1',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    phone: '555-111-2222'
  }
}

const baseLead = {
  id: 'lead-1',
  company_id: 'company-1',
  first_name: 'Test',
  last_name: 'Lead',
  email: 'lead@example.com',
  status: 'new',
  lead_source: 'website',
  priority: 'medium',
  contacts: [linkedContact],
  account_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

describe('LeadDetail contact management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    leadService.getLeadById.mockResolvedValue({ data: baseLead })
    contactService.getContacts.mockResolvedValue({ data: [] })
    contactService.linkToLead.mockResolvedValue({ data: {} })
    contactService.unlinkFromLead.mockResolvedValue({ data: {} })
    accountService.getAccountById.mockResolvedValue({ data: {} })
    taskService.createTask.mockResolvedValue({ data: {} })
  })

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <LeadDetail />
      </BrowserRouter>
    )

  it('renders related contacts list with primary badge', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Primary')).toBeInTheDocument()
  })

  it('links an existing contact from the modal', async () => {
    const updatedLead = {
      ...baseLead,
      contacts: [
        ...baseLead.contacts,
        {
          id: 'rel-2',
          contact_id: 'contact-2',
          is_primary: false,
          role: null,
          contact: {
            id: 'contact-2',
            first_name: 'Alice',
            last_name: 'Johnson',
            email: 'alice@example.com'
          }
        }
      ]
    }

    leadService.getLeadById
      .mockResolvedValueOnce({ data: baseLead })
      .mockResolvedValue({ data: updatedLead })

    const searchResults = [
      { id: 'contact-2', first_name: 'Alice', last_name: 'Johnson', email: 'alice@example.com' }
    ]
    contactService.getContacts.mockResolvedValueOnce({ data: searchResults })

    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /link existing/i }))

    await waitFor(() => {
      expect(contactService.getContacts).toHaveBeenCalled()
    })

    const linkButton = await screen.findByRole('button', { name: 'Link to Lead' })
    await user.click(linkButton)

    await waitFor(() => {
      expect(contactService.linkToLead).toHaveBeenCalledWith('contact-2', 'lead-1', { is_primary: false })
      expect(toast.success).toHaveBeenCalledWith('Contact linked to lead')
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    })
  })
})
