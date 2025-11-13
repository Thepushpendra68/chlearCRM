/**
 * WhatsApp Message Component
 * Displays a single WhatsApp message in chat format
 */

import React from 'react';
import { CheckIcon, CheckCheckIcon, ClockIcon, XCircleIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const WhatsAppMessage = ({ message, isOwn = false }) => {
  const getStatusIcon = () => {
    if (message.direction === 'inbound') return null;

    switch (message.status) {
      case 'sent':
        return <CheckIcon className="w-4 h-4 text-gray-400" />;
      case 'delivered':
        return <CheckCheckIcon className="w-4 h-4 text-gray-400" />;
      case 'read':
        return <CheckCheckIcon className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (message.direction === 'inbound') return null;

    switch (message.status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return message.error_message || 'Failed';
      case 'pending':
        return 'Sending...';
      default:
        return '';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  const renderContent = () => {
    // Text message
    if (message.message_type === 'text' && message.content) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      );
    }

    // Template message
    if (message.message_type === 'template') {
      return (
        <div>
          <div className="text-xs text-gray-500 mb-1">
            📋 Template: {message.template_name}
          </div>
          <div className="whitespace-pre-wrap break-words">
            {message.content || 'Template message sent'}
          </div>
        </div>
      );
    }

    // Media messages
    if (['image', 'video', 'document', 'audio'].includes(message.message_type)) {
      return (
        <div>
          {message.media_url && (
            <div className="mb-2">
              {message.message_type === 'image' && (
                <img
                  src={message.media_url}
                  alt="WhatsApp media"
                  className="max-w-xs rounded"
                />
              )}
              {message.message_type === 'video' && (
                <video
                  src={message.media_url}
                  controls
                  className="max-w-xs rounded"
                />
              )}
              {message.message_type === 'audio' && (
                <audio src={message.media_url} controls className="max-w-xs" />
              )}
              {message.message_type === 'document' && (
                <a
                  href={message.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  📄 {message.media_caption || 'Download document'}
                </a>
              )}
            </div>
          )}
          {message.media_caption && (
            <div className="text-sm">{message.media_caption}</div>
          )}
        </div>
      );
    }

    // Interactive message
    if (message.message_type === 'interactive') {
      return (
        <div>
          <div className="text-xs text-gray-500 mb-1">
            🔘 Interactive message
          </div>
          <div>{message.content || 'Interactive content'}</div>
        </div>
      );
    }

    // Location
    if (message.message_type === 'location') {
      return (
        <div className="flex items-center gap-2">
          📍 Location shared
        </div>
      );
    }

    // Fallback
    return <div>{message.content || `${message.message_type} message`}</div>;
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwn
            ? 'bg-green-500 text-white rounded-br-none'
            : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
        }`}
      >
        {/* Message content */}
        <div className="mb-1">{renderContent()}</div>

        {/* Message metadata */}
        <div
          className={`flex items-center gap-2 text-xs mt-1 ${
            isOwn ? 'text-green-100' : 'text-gray-500'
          }`}
        >
          <span>{formatTime(message.created_at)}</span>
          {getStatusIcon() && (
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="sr-only">{getStatusText()}</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {message.status === 'failed' && message.error_message && (
          <div className="text-xs text-red-200 mt-1">
            ⚠️ {message.error_message}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppMessage;

