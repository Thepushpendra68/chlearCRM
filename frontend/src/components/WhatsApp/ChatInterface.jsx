/**
 * WhatsApp Chat Interface Component
 * Displays chat messages and send message input
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Phone, Video, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import WhatsAppMessage from './WhatsAppMessage';
import { sendTextMessage, getLeadMessages, formatPhoneDisplay } from '../../services/whatsappService';

const ChatInterface = ({ lead, conversation, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages
  useEffect(() => {
    if (lead?.id) {
      loadMessages();
    }
  }, [lead?.id]);

  const loadMessages = async () => {
    if (!lead?.id) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      const result = await getLeadMessages(lead.id);
      
      if (result.success) {
        setMessages(result.data?.messages || []);
      } else {
        console.error('Failed to load messages:', result.error);
        toast.error(result.error || 'Failed to load messages');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages. Please try again.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !lead?.phone) {
      return;
    }

    setSending(true);
    const result = await sendTextMessage({
      to: lead.phone,
      message: newMessage.trim(),
      leadId: lead.id
    });

    if (result.success) {
      // Add message to UI optimistically
      const sentMessage = {
        id: result.data.messageId,
        content: newMessage.trim(),
        direction: 'outbound',
        message_type: 'text',
        status: 'sent',
        created_at: new Date().toISOString(),
        whatsapp_id: lead.phone
      };
      
      setMessages([...messages, sentMessage]);
      setNewMessage('');
      toast.success('Message sent!');
      
      if (onMessageSent) {
        onMessageSent(sentMessage);
      }
      
      // Reload messages to get server state
      setTimeout(loadMessages, 1000);
    } else {
      toast.error(result.error || 'Failed to send message');
    }
    setSending(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-sm text-gray-500">
            Choose a contact from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
              {lead.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            
            {/* Contact info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {lead.name || 'Unknown Contact'}
              </h3>
              <p className="text-xs text-gray-500">
                {formatPhoneDisplay(lead.phone)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-2">💬</div>
              <p className="text-sm text-gray-500">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((message, index) => (
              <WhatsAppMessage
                key={message.id || index}
                message={message}
                isOwn={message.direction === 'outbound'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          {/* Attachments */}
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji */}
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text input */}
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              rows={1}
              style={{ minHeight: '42px', maxHeight: '120px' }}
              disabled={sending}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;

