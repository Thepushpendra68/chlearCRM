import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ContactForm from '../components/Contacts/ContactForm'
import contactService from '../services/contactService'
import accountService from '../services/accountService'
import userService from '../services/userService'

vi.mock('../services/contactService')
vi.mock('../services/accountService')
vi.mock('../services/userService')
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

const renderForm = (props = {}) => {
  return render(
    <ContactForm
      isOpen
      onClose={props.onClose || vi.fn()}
      onSuccess={props.onSuccess || vi.fn()}
      defaultAccountId={props.defaultAccountId}
      lockAccountSelection={props.lockAccountSelection}
      contact={props.contact}
    />
  )
}
describe('ContactForm', () => {
  const defaultAccount = { id: 'account-1', name: 'Acme Inc.' }
  const defaultUsers = [{ id: 'user-1', first_name: 'Alex', last_name: 'Doe' }]
  const createdContact = { id: 'contact-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' }

  beforeEach(() => {
    vi.clearAllMocks()

    accountService.getAccounts.mockResolvedValue({ data: [defaultAccount] })
    accountService.getAccountById.mockResolvedValue({ data: defaultAccount })
    userService.getActiveUsers.mockResolvedValue(defaultUsers)
    contactService.createContact.mockResolvedValue({ data: createdContact })
  })

  it('prefills default account and shows lock helper text when locked', async () => {
    renderForm({ defaultAccountId: defaultAccount.id, lockAccountSelection: true })

    await waitFor(() => {
      expect(accountService.getAccounts).toHaveBeenCalled()
    })

    const accountOption = await screen.findByRole('option', { name: defaultAccount.name })
    expect(accountOption).toBeInTheDocument()
    expect(screen.getByText('Contact will be saved under the selected account.')).toBeInTheDocument()
  })
  it('submits new contact details and calls onSuccess with created contact', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const onClose = vi.fn()

    renderForm({
      defaultAccountId: defaultAccount.id,
      lockAccountSelection: true,
      onSuccess,
      onClose
    })

    await waitFor(() => {
      expect(accountService.getAccounts).toHaveBeenCalled()
    })

    await user.type(await screen.findByPlaceholderText('Jane'), 'Jane')
    await user.type(screen.getByPlaceholderText('Doe'), 'Doe')
    await user.type(screen.getByPlaceholderText('name@example.com'), 'JANE@Example.com ')
    await user.type(screen.getByPlaceholderText('(555) 123-4567'), ' 555-000-1111 ')
    await user.type(screen.getByPlaceholderText('Director of Operations'), ' Director ')

    const submitButton = screen.getByRole('button', { name: 'Create Contact' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(contactService.createContact).toHaveBeenCalled()
    })

    expect(contactService.createContact).toHaveBeenCalledWith(expect.objectContaining({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '555-000-1111',
      title: 'Director',
      account_id: defaultAccount.id,
      status: 'active'
    }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(createdContact)
      expect(onClose).toHaveBeenCalled()
    })
  })
})
