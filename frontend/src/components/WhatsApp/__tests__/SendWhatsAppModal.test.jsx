/**
 * Send WhatsApp Modal Component Tests
 * Tests for send message modal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendWhatsAppModal from '../SendWhatsAppModal';
import * as whatsappService from '../../../services/whatsappService';

vi.mock('../../../services/whatsappService');

describe('SendWhatsAppModal', () => {
  const mockLead = {
    id: 'lead-123',
    name: 'John Doe',
    phone: '919876543210'
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <SendWhatsAppModal isOpen={false} onClose={mockOnClose} lead={mockLead} />
    );
    
    expect(container.querySelector('.fixed')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    expect(screen.getByText('Send WhatsApp Message')).toBeInTheDocument();
    expect(screen.getByText('To: John Doe')).toBeInTheDocument();
    expect(screen.getByText('919876543210')).toBeInTheDocument();
  });

  it('should display warning when no phone number', () => {
    const leadWithoutPhone = { ...mockLead, phone: null };
    
    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={leadWithoutPhone} />
    );
    
    expect(screen.getByText(/No phone number available/)).toBeInTheDocument();
  });

  it('should close modal when cancel button clicked', async () => {
    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const cancelButton = screen.getByText('Cancel');
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when X button clicked', async () => {
    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    await userEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should send message successfully', async () => {
    whatsappService.sendTextMessage.mockResolvedValue({
      success: true,
      data: { messageId: 'wamid.test123' }
    });

    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const textarea = screen.getByPlaceholderText('Type your message here...');
    await userEvent.type(textarea, 'Hello from test');
    
    const sendButton = screen.getByText('Send Message');
    await userEvent.click(sendButton);
    
    await waitFor(() => {
      expect(whatsappService.sendTextMessage).toHaveBeenCalledWith({
        to: '919876543210',
        message: 'Hello from test',
        leadId: 'lead-123',
        contactId: undefined
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should show error toast on send failure', async () => {
    whatsappService.sendTextMessage.mockResolvedValue({
      success: false,
      error: 'Failed to send'
    });

    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const textarea = screen.getByPlaceholderText('Type your message here...');
    await userEvent.type(textarea, 'Test message');
    
    const sendButton = screen.getByText('Send Message');
    await userEvent.click(sendButton);
    
    await waitFor(() => {
      expect(whatsappService.sendTextMessage).toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('should disable send button when message is empty', () => {
    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const sendButton = screen.getByText('Send Message');
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when message is entered', async () => {
    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const textarea = screen.getByPlaceholderText('Type your message here...');
    await userEvent.type(textarea, 'Test message');
    
    const sendButton = screen.getByText('Send Message');
    expect(sendButton).not.toBeDisabled();
  });

  it('should send message with Ctrl+Enter', async () => {
    whatsappService.sendTextMessage.mockResolvedValue({
      success: true,
      data: { messageId: 'wamid.test' }
    });

    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const textarea = screen.getByPlaceholderText('Type your message here...');
    await userEvent.type(textarea, 'Test message');
    
    fireEvent.keyPress(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(whatsappService.sendTextMessage).toHaveBeenCalled();
    });
  });

  it('should work with contact instead of lead', async () => {
    const mockContact = {
      id: 'contact-123',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '919876543211'
    };

    whatsappService.sendTextMessage.mockResolvedValue({
      success: true,
      data: {}
    });

    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} contact={mockContact} />
    );
    
    expect(screen.getByText('To: Jane Smith')).toBeInTheDocument();
    
    const textarea = screen.getByPlaceholderText('Type your message here...');
    await userEvent.type(textarea, 'Hello');
    
    const sendButton = screen.getByText('Send Message');
    await userEvent.click(sendButton);
    
    await waitFor(() => {
      expect(whatsappService.sendTextMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '919876543211',
          contactId: 'contact-123'
        })
      );
    });
  });

  it('should show sending state while message is being sent', async () => {
    whatsappService.sendTextMessage.mockImplementation(() => {
      return new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100));
    });

    render(
      <SendWhatsAppModal isOpen={true} onClose={mockOnClose} lead={mockLead} />
    );
    
    const textarea = screen.getByPlaceholderText('Type your message here...');
    await userEvent.type(textarea, 'Test');
    
    const sendButton = screen.getByText('Send Message');
    await userEvent.click(sendButton);
    
    expect(screen.getByText('Sending...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});

