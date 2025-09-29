import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import chatbotService from '../../services/chatbotService';
import toast from 'react-hot-toast';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your CRM assistant. I can help you create leads, search for leads, update lead information, and show you statistics. What would you like to do?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Toggle chatbot window
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Close chatbot
  const closeChat = () => {
    setIsOpen(false);
  };

  // Clear conversation
  const clearConversation = async () => {
    try {
      await chatbotService.clearHistory();
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Conversation cleared. How can I help you?',
          timestamp: new Date()
        }
      ]);
      setPendingAction(null);
      toast.success('Conversation cleared');
    } catch (error) {
      toast.error('Failed to clear conversation');
    }
  };

  // Send message
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(messageText);

      // Add assistant response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        action: response.action,
        data: response.data
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle pending actions that need confirmation
      if (response.needsConfirmation && response.action !== 'CHAT') {
        setPendingAction({
          action: response.action,
          parameters: response.data?.parameters || {}
        });
      } else {
        setPendingAction(null);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm pending action
  const confirmAction = async () => {
    if (!pendingAction) return;

    setIsLoading(true);

    try {
      const response = await chatbotService.confirmAction(
        pendingAction.action,
        pendingAction.parameters
      );

      const assistantMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Action completed successfully! ${getActionSuccessMessage(pendingAction.action)}`,
        timestamp: new Date(),
        data: response
      };

      setMessages(prev => [...prev, assistantMessage]);
      setPendingAction(null);
      toast.success('Action completed');
    } catch (error) {
      console.error('Error confirming action:', error);
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to complete action: ${error.message || 'Unknown error'}`,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel pending action
  const cancelAction = () => {
    setPendingAction(null);
    const cancelMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Action cancelled. What else can I help you with?',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  // Get success message based on action type
  const getActionSuccessMessage = (action) => {
    switch (action) {
      case 'CREATE_LEAD':
        return 'Lead created successfully.';
      case 'UPDATE_LEAD':
        return 'Lead updated successfully.';
      case 'DELETE_LEAD':
        return 'Lead deleted successfully.';
      default:
        return '';
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Create Lead', prompt: 'I want to create a new lead' },
    { label: 'Show All Leads', prompt: 'Show me all leads' },
    { label: 'Lead Stats', prompt: 'Show me lead statistics' },
    { label: 'Qualified Leads', prompt: 'Show me qualified leads' }
  ];

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-50"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">CRM Assistant</h3>
                <p className="text-xs opacity-90">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearConversation}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={closeChat}
                className="p-1 hover:bg-blue-700 rounded transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="bg-white rounded-lg p-3 max-w-[80%] shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Pending Action Confirmation */}
          {pendingAction && (
            <div className="border-t border-gray-200 bg-yellow-50 p-3">
              <p className="text-sm text-gray-700 mb-2">Confirm this action?</p>
              <div className="flex space-x-2">
                <button
                  onClick={confirmAction}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={cancelAction}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions (show when no pending action) */}
          {!pendingAction && messages.length === 1 && (
            <div className="border-t border-gray-200 bg-white p-3">
              <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={isLoading}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded text-xs hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;