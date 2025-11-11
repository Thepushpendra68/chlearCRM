import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GlobalSearch from '../components/Search/GlobalSearch'
import searchService from '../services/searchService'

vi.mock('../services/searchService', () => {
  const globalSearch = vi.fn()
  const getRecentSearches = vi.fn()
  const saveRecentSearch = vi.fn()
  const clearRecentSearches = vi.fn()
  return {
    __esModule: true,
    default: { globalSearch, getRecentSearches, saveRecentSearch, clearRecentSearches },
    globalSearch,
    getRecentSearches,
    saveRecentSearch,
    clearRecentSearches
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

describe('GlobalSearch contacts integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchService.getRecentSearches.mockReturnValue([])
    searchService.saveRecentSearch.mockReturnValue()
    searchService.clearRecentSearches.mockReturnValue()
    searchService.globalSearch.mockResolvedValue({
      leads: [],
      contacts: [
        {
          id: 'contact-1',
          name: 'Jane Smith',
          email: 'jane@example.com',
          href: '/app/contacts/contact-1'
        }
      ],
      activities: [],
      tasks: [],
      users: []
    })
  })

  it('shows contact results in dropdown after search', async () => {
    const user = userEvent.setup()

    render(<GlobalSearch />)

    const input = screen.getByPlaceholderText(/search leads, contacts, activities/i)
    await user.type(input, 'Jane')

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(searchService.globalSearch).toHaveBeenCalled()
    })

    const callQueries = searchService.globalSearch.mock.calls.map(call => call[0])
    expect(callQueries).toContain('Jane')

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })
})
