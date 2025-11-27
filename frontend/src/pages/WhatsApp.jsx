/**
 * WhatsApp Inbox Page
 * Main WhatsApp interface with conversation list and chat
 */

import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, Settings, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatInterface from '../components/WhatsApp/ChatInterface';
import WhatsAppSettingsModal from '../components/WhatsApp/WhatsAppSettingsModal';
import NewChatModal from '../components/WhatsApp/NewChatModal';
import { getConversations, formatPhoneDisplay } from '../services/whatsappService';
import { formatDistanceToNow } from 'date-fns';
import { runAuthDiagnostics } from '../utils/authDiagnostics';

const WhatsApp = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  useEffect(() => {
    // Run auth diagnostics on mount (only in development)
    if (import.meta.env.DEV) {
      runAuthDiagnostics().then((result) => {
        if (!result.success) {
          console.warn('[WhatsApp] Auth diagnostics failed:', result.error);
        }
      });
    }

    // Load conversations on mount
    loadConversations().catch((error) => {
      // Catch any unhandled errors to prevent component crash
      console.error('Unhandled error in loadConversations:', error);
      setLoading(false);
    });
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await getConversations({ isActive: true, limit: 50 });
      
      if (result.success) {
        setConversations(result.data?.conversations || []);
      } else {
        console.error('Failed to load conversations:', result.error);
        toast.error(result.error || 'Failed to load conversations');
        // Don't redirect, just show error
        setConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations. Please try again.');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
    toast.success('Conversations refreshed');
  };

  // Helper to get contact/lead name
  const getContactName = (lead, contact) => {
    if (lead?.name) return lead.name;
    if (contact?.first_name || contact?.last_name) {
      return [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown';
    }
    return 'Unknown';
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);

    const phoneNumber =
      conversation.whatsapp_id ||
      conversation.lead?.phone ||
      conversation.contact?.phone ||
      conversation.contact?.mobile_phone ||
      '';

    const leadId =
      conversation.lead_id ||
      conversation.lead?.id ||
      conversation.contact?.lead_id ||
      null;

    const lead = {
      id: leadId,
      name: getContactName(conversation.lead, conversation.contact),
      phone: phoneNumber,
      email: conversation.lead?.email || conversation.contact?.email,
      company: conversation.lead?.company || null, // Contacts don't have company directly
    };

    setSelectedLead(lead);
  };

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const name = getContactName(conv.lead, conv.contact).toLowerCase();
    const phoneRaw =
      conv.whatsapp_id ||
      conv.lead?.phone ||
      conv.contact?.phone ||
      conv.contact?.mobile_phone ||
      '';
    const phone = phoneRaw.toString().toLowerCase();

    return name.includes(query) || phone.includes(query);
  });

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };

  const truncateMessage = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh conversations"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowNewChatModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center px-4">
                <div>
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm text-gray-500">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs text-gray-400 mt-1">
                      Start a conversation to see it here
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {filteredConversations.map((conversation) => {
                  const isSelected = selectedConversation?.id === conversation.id;
                  const name = getContactName(conversation.lead, conversation.contact);
                  const lastMessage = conversation.last_message_preview || '';
                  const phoneNumber =
                    conversation.whatsapp_id ||
                    conversation.lead?.phone ||
                    conversation.contact?.phone ||
                    conversation.contact?.mobile_phone ||
                    '';

                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {(name || '?').charAt(0).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {name}
                            </h3>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatLastMessageTime(conversation.last_message_at)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-500 truncate mb-1">
                            {formatPhoneDisplay(phoneNumber)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {conversation.last_message_direction === 'outbound' && (
                                <span className="text-green-600 mr-1">✓</span>
                              )}
                              {truncateMessage(lastMessage)}
                            </p>
                            
                            {conversation.unread_count > 0 && (
                              <span className="ml-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full flex-shrink-0">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1">
          <ChatInterface
            lead={selectedLead}
            conversation={selectedConversation}
            onMessageSent={() => {
              loadConversations();
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <WhatsAppSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
      
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onMessageSent={() => {
          loadConversations();
        }}
      />
    </div>
  );
};

export default WhatsApp;

