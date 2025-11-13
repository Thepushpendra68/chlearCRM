/**
 * WhatsApp Message Component Tests
 * Tests for message rendering
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WhatsAppMessage from '../WhatsAppMessage';

describe('WhatsAppMessage', () => {
  const baseMessage = {
    id: 'msg1',
    content: 'Hello, this is a test message',
    direction: 'outbound',
    message_type: 'text',
    status: 'sent',
    created_at: new Date().toISOString()
  };

  it('should render outbound text message', () => {
    render(<WhatsAppMessage message={baseMessage} isOwn={true} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
  });

  it('should render inbound text message', () => {
    const inboundMessage = {
      ...baseMessage,
      direction: 'inbound'
    };
    
    render(<WhatsAppMessage message={inboundMessage} isOwn={false} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
  });

  it('should show sent status icon for outbound messages', () => {
    render(<WhatsAppMessage message={baseMessage} isOwn={true} />);
    
    // Check for status icon (sr-only text)
    expect(screen.getByText('Sent', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('should show delivered status icon', () => {
    const deliveredMessage = {
      ...baseMessage,
      status: 'delivered'
    };
    
    render(<WhatsAppMessage message={deliveredMessage} isOwn={true} />);
    
    expect(screen.getByText('Delivered', { selector: '.sr-only' })).toBeInTheDocument();
  });

  it('should show read status icon with blue color', () => {
    const readMessage = {
      ...baseMessage,
      status: 'read'
    };
    
    const { container } = render(<WhatsAppMessage message={readMessage} isOwn={true} />);
    
    expect(screen.getByText('Read', { selector: '.sr-only' })).toBeInTheDocument();
    expect(container.querySelector('.text-blue-500')).toBeInTheDocument();
  });

  it('should show failed status with error message', () => {
    const failedMessage = {
      ...baseMessage,
      status: 'failed',
      error_message: 'Message not delivered'
    };
    
    render(<WhatsAppMessage message={failedMessage} isOwn={true} />);
    
    expect(screen.getByText('⚠️ Message not delivered')).toBeInTheDocument();
  });

  it('should render template message', () => {
    const templateMessage = {
      ...baseMessage,
      message_type: 'template',
      template_name: 'welcome_message',
      content: 'Welcome to our service!'
    };
    
    render(<WhatsAppMessage message={templateMessage} isOwn={true} />);
    
    expect(screen.getByText(/Template: welcome_message/)).toBeInTheDocument();
    expect(screen.getByText('Welcome to our service!')).toBeInTheDocument();
  });

  it('should render image message', () => {
    const imageMessage = {
      ...baseMessage,
      message_type: 'image',
      media_url: 'https://example.com/image.jpg',
      media_caption: 'Test image'
    };
    
    render(<WhatsAppMessage message={imageMessage} isOwn={true} />);
    
    const img = screen.getByAlt('WhatsApp media');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(screen.getByText('Test image')).toBeInTheDocument();
  });

  it('should render document message with download link', () => {
    const documentMessage = {
      ...baseMessage,
      message_type: 'document',
      media_url: 'https://example.com/document.pdf',
      media_caption: 'Important document'
    };
    
    render(<WhatsAppMessage message={documentMessage} isOwn={true} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com/document.pdf');
    expect(screen.getByText(/Important document/)).toBeInTheDocument();
  });

  it('should apply correct styling for own messages', () => {
    const { container } = render(<WhatsAppMessage message={baseMessage} isOwn={true} />);
    
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
    expect(container.querySelector('.justify-end')).toBeInTheDocument();
  });

  it('should apply correct styling for other messages', () => {
    const { container } = render(<WhatsAppMessage message={baseMessage} isOwn={false} />);
    
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
    expect(container.querySelector('.justify-start')).toBeInTheDocument();
  });

  it('should format timestamp correctly', () => {
    const recentMessage = {
      ...baseMessage,
      created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
    };
    
    render(<WhatsAppMessage message={recentMessage} isOwn={true} />);
    
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });
});

