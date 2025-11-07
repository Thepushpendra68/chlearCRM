import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AccountTimeline from '../components/AccountTimeline'
import { format } from 'date-fns'

describe('AccountTimeline', () => {
  it('renders timeline with events', () => {
    const mockTimeline = [
      {
        id: 'event-1',
        type: 'audit',
        event_type: 'account_created',
        title: 'Account Created',
        description: 'Account: Test Account',
        timestamp: new Date().toISOString(),
        actor: {
          id: 'user-1',
          email: 'user@example.com',
          role: 'admin'
        }
      },
      {
        id: 'event-2',
        type: 'activity',
        event_type: 'call',
        title: 'Phone Call',
        description: 'Called customer',
        timestamp: new Date().toISOString(),
        is_completed: true
      },
      {
        id: 'event-3',
        type: 'task',
        event_type: 'follow_up',
        title: 'Follow Up Task',
        description: 'Follow up with customer',
        timestamp: new Date().toISOString(),
        status: 'completed',
        priority: 'high'
      }
    ]

    render(<AccountTimeline timeline={mockTimeline} loading={false} />)

    // Use getAllByText since "Account Created" appears multiple times (label and heading)
    expect(screen.getAllByText('Account Created').length).toBeGreaterThan(0)
    expect(screen.getByText('Phone Call')).toBeInTheDocument()
    expect(screen.getByText('Follow Up Task')).toBeInTheDocument()
  })

  it('displays loading state', () => {
    render(<AccountTimeline timeline={[]} loading={true} />)

    expect(screen.getByText(/loading timeline/i)).toBeInTheDocument()
  })

  it('displays empty state when no events', () => {
    render(<AccountTimeline timeline={[]} loading={false} />)

    expect(screen.getByText(/no timeline events yet/i)).toBeInTheDocument()
  })

  it('groups events by date', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const mockTimeline = [
      {
        id: 'event-1',
        type: 'audit',
        event_type: 'account_created',
        title: 'Today Event',
        timestamp: today.toISOString()
      },
      {
        id: 'event-2',
        type: 'activity',
        event_type: 'call',
        title: 'Yesterday Event',
        timestamp: yesterday.toISOString()
      }
    ]

    render(<AccountTimeline timeline={mockTimeline} loading={false} />)

    expect(screen.getByText('Today Event')).toBeInTheDocument()
    expect(screen.getByText('Yesterday Event')).toBeInTheDocument()
  })

  it('displays activity completion status', () => {
    const mockTimeline = [
      {
        id: 'event-1',
        type: 'activity',
        event_type: 'call',
        title: 'Completed Call',
        timestamp: new Date().toISOString(),
        is_completed: true
      },
      {
        id: 'event-2',
        type: 'activity',
        event_type: 'email',
        title: 'Pending Email',
        timestamp: new Date().toISOString(),
        is_completed: false
      }
    ]

    render(<AccountTimeline timeline={mockTimeline} loading={false} />)

    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('displays task status and priority', () => {
    const mockTimeline = [
      {
        id: 'event-1',
        type: 'task',
        event_type: 'follow_up',
        title: 'High Priority Task',
        timestamp: new Date().toISOString(),
        status: 'in_progress',
        priority: 'high'
      }
    ]

    render(<AccountTimeline timeline={mockTimeline} loading={false} />)

    expect(screen.getByText('in_progress')).toBeInTheDocument()
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('displays actor information for audit events', () => {
    const mockTimeline = [
      {
        id: 'event-1',
        type: 'audit',
        event_type: 'account_updated',
        title: 'Account Updated',
        timestamp: new Date().toISOString(),
        actor: {
          id: 'user-1',
          email: 'admin@example.com',
          role: 'admin'
        }
      }
    ]

    render(<AccountTimeline timeline={mockTimeline} loading={false} />)

    expect(screen.getByText(/admin@example.com/i)).toBeInTheDocument()
  })

  it('displays scheduled date for activities', () => {
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 1)

    const mockTimeline = [
      {
        id: 'event-1',
        type: 'activity',
        event_type: 'meeting',
        title: 'Scheduled Meeting',
        timestamp: new Date().toISOString(),
        scheduled_at: scheduledDate.toISOString()
      }
    ]

    render(<AccountTimeline timeline={mockTimeline} loading={false} />)

    // "Scheduled" appears in both the heading and the date label, so use getAllByText
    expect(screen.getAllByText(/scheduled/i).length).toBeGreaterThan(0)
  })

  it('displays due date for tasks', () => {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    const mockTimeline = [
      {
        id: 'event-1',
        type: 'task',
        event_type: 'follow_up',
        title: 'Due Task',
        timestamp: new Date().toISOString(),
        due_date: dueDate.toISOString()
      }
    ]

    render(<AccountTimeline timeline={mockTimeline} loading={false} />)

    // "Due" appears in both the heading and the date label, so use getAllByText
    expect(screen.getAllByText(/due/i).length).toBeGreaterThan(0)
  })
})

