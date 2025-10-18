import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import chatbotService from '../../services/chatbotService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Trash2, X, AlertCircle } from 'lucide-react';

const ACTION_LABELS = {
  CREATE_LEAD: 'Create lead',
  UPDATE_LEAD: 'Update lead',
  GET_LEAD: 'Get lead details',
  SEARCH_LEADS: 'Search leads',
  LIST_LEADS: 'List leads',
  GET_STATS: 'Lead statistics'
};

const humanizeKey = (key = '') =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const getActionLabel = (action = '') => ACTION_LABELS[action] || humanizeKey(action);

const buildActionSummary = (action, parameters = {}) => {
  if (!parameters || typeof parameters !== 'object') {
    return [];
  }

  const summary = [];
  const add = (label, value) => {
    if (value === undefined || value === null || value === '') return;
    summary.push({ label, value });
  };

  switch (action) {
    case 'CREATE_LEAD': {
      const fullName = [parameters.first_name, parameters.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
      add('Name', fullName || parameters.name);
      add('Email', parameters.email);
      add('Company', parameters.company);
      add('Phone', parameters.phone);
      add('Status', parameters.status);
      add('Source', parameters.lead_source);
      add('Priority', parameters.priority);
      add('Expected Close', parameters.expected_close_date);
      add('Deal Value', parameters.deal_value);
      break;
    }
    case 'UPDATE_LEAD': {
      add('Target', parameters.email || parameters.lead_id);
      [
        'first_name',
        'last_name',
        'company',
        'phone',
        'status',
        'lead_source',
        'priority',
        'deal_value',
        'expected_close_date',
        'notes'
      ].forEach(key => {
        if (parameters[key] !== undefined && parameters[key] !== null && parameters[key] !== '') {
          add(humanizeKey(key), parameters[key]);
        }
      });
      break;
    }
    case 'GET_LEAD': {
      add('Lead ID', parameters.lead_id);
      add('Email', parameters.email);
      break;
    }
    case 'SEARCH_LEADS': {
      add('Query', parameters.search);
      add('Limit', parameters.limit);
      break;
    }
    case 'LIST_LEADS': {
      add('Status', parameters.status);
      add('Source', parameters.source || parameters.lead_source);
      add('Assigned To', parameters.assigned_to);
      add('Sort By', parameters.sort_by);
      add('Sort Order', parameters.sort_order);
      add('Limit', parameters.limit);
      break;
    }
    case 'GET_STATS': {
      add('Scope', 'Company');
      break;
    }
    default: {
      Object.entries(parameters).forEach(([key, value]) => add(humanizeKey(key), value));
    }
  }

  return summary;
};

const ChatPanel = () => {
  const { chatPanelOpen, toggleChatPanel, chatMessages, addChatMessage, clearChatMessages, setChatPanelSize, chatPanelSize } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [width, setWidth] = useState(chatPanelSize?.width || 400);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const resizeHandleRef = useRef(null);

  // Initialize messages from context
  const messages = chatMessages.length > 0 ? chatMessages : [
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your CRM assistant. I can help you create leads, search for leads, update lead information, and show you statistics. What would you like to do?',
      timestamp: new Date()
    }
  ];

  // Handle resize start
  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const container = chatContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;

      // Enforce min/max width
      const constrainedWidth = Math.max(300, Math.min(600, newWidth));
      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setChatPanelSize({ width });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width, setChatPanelSize]);

  // Update width from context
  useEffect(() => {
    if (chatPanelSize?.width) {
      setWidth(chatPanelSize.width);
    }
  }, [chatPanelSize]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearConversation = async () => {
    try {
      await chatbotService.clearHistory();
      clearChatMessages();
      addChatMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Conversation cleared. How can I help you?',
        timestamp: new Date()
      });
      setPendingAction(null);
      toast.success('Conversation cleared');
    } catch (error) {
      toast.error('Failed to clear conversation');
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };
    addChatMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(messageText);

      const normalizedParameters = response.parameters && typeof response.parameters === 'object' ? response.parameters : {};
      const normalizedMissingFields = Array.isArray(response.missingFields) ? response.missingFields : [];

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        action: response.action,
        data: response.data,
        intent: response.intent,
        parameters: normalizedParameters,
        missingFields: normalizedMissingFields,
        needsConfirmation: response.needsConfirmation,
        meta: {
          source: response.source,
          model: response.model
        }
      };

      addChatMessage(assistantMessage);

      if (response.needsConfirmation && response.action !== 'CHAT') {
        const pendingParameters = response.data?.parameters || normalizedParameters;
        setPendingAction({
          action: response.action,
          parameters: pendingParameters,
          summary: buildActionSummary(response.action, pendingParameters),
          missingFields: normalizedMissingFields,
          intent: response.intent,
          source: response.source,
          model: response.model
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
        isError: true,
        meta: { source: 'system' }
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        content: `Action completed successfully. ${getActionSuccessMessage(pendingAction.action)}`,
        timestamp: new Date(),
        action: pendingAction.action,
        data: response,
        parameters: pendingAction.parameters,
        meta: { source: 'system' }
      };

      addChatMessage(assistantMessage);
      setPendingAction(null);
      toast.success('Action completed');
    } catch (error) {
      console.error('Error confirming action:', error);
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Failed to complete action: ${error.message || 'Unknown error'}`,
        timestamp: new Date(),
        isError: true,
        meta: { source: 'system' }
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    const cancelMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Action cancelled. What else can I help you with?',
      timestamp: new Date(),
      meta: { source: 'system' }
    };
    addChatMessage(cancelMessage);
  };

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

  const quickActions = [
    { label: 'Create Lead', prompt: 'I want to create a new lead' },
    { label: 'Show All Leads', prompt: 'Show me all leads' },
    { label: 'Lead Stats', prompt: 'Show me lead statistics' },
    { label: 'Qualified Leads', prompt: 'Show me qualified leads' }
  ];

  return (
    <>
      {/* Mobile overlay backdrop */}
      {chatPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleChatPanel}
        />
      )}
      
      {/* Chat Panel - Desktop sidebar / Mobile overlay */}
      <div 
        ref={chatContainerRef}
        className={`fixed md:relative top-16 md:top-0 right-0 md:right-auto bottom-0 h-[calc(100vh-64px)] md:h-auto bg-background border-l flex flex-col shadow-2xl md:shadow-lg transition-transform duration-300 ease-in-out z-40 ${
          chatPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        } md:translate-x-0`}
        style={{ width: `${width}px`, maxWidth: '100%' }}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-5 flex items-center justify-between flex-shrink-0 rounded-t-none border-b">
          <div>
            <h3 className="font-semibold text-base">CRM Assistant</h3>
            <p className="text-xs opacity-90 mt-0.5">Powered by Gemini AI</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              className="h-9 w-9 hover:bg-primary/80 rounded-lg"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-5">
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Pending Action Confirmation */}
        {pendingAction && (
          <CardFooter className="flex flex-col gap-4 border-t bg-muted/50 p-5 pt-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending Action</p>
              <p className="text-base font-semibold text-foreground">
                {getActionLabel(pendingAction.action)}
              </p>
              {pendingAction.intent && (
                <p className="text-sm text-muted-foreground mt-1">{pendingAction.intent}</p>
              )}
            </div>

            {pendingAction.summary?.length > 0 && (
              <div className="w-full bg-card border rounded-lg p-4 text-xs max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-foreground mb-3">Details to confirm:</p>
                <ul className="space-y-2.5">
                  {pendingAction.summary.map(item => (
                    <li key={`${item.label}-${item.value}`} className="flex justify-between gap-3 items-center">
                      <span className="font-medium flex-shrink-0 text-foreground">{item.label}</span>
                      <span className="text-right text-muted-foreground truncate text-xs">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingAction.missingFields?.length > 0 && (
              <div className="w-full text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Missing: {pendingAction.missingFields.join(', ')}</span>
              </div>
            )}

            <div className="flex w-full gap-3 pt-2">
              <Button
                onClick={confirmAction}
                disabled={isLoading}
                size="sm"
                className="flex-1"
              >
                Confirm
              </Button>
              <Button
                onClick={cancelAction}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        )}

        {/* Quick Actions */}
        {!pendingAction && messages.length === 1 && (
          <div className="border-t p-3 bg-card flex-shrink-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2">QUICK ACTIONS</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="text-xs h-auto py-2"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

      {/* Input Area */}
      <ChatInput onSendMessage={sendMessage} disabled={isLoading} />

      {/* Resize Handle - Only on desktop */}
      <div 
        ref={resizeHandleRef}
        onMouseDown={handleResizeStart}
        className="hidden md:block absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary hover:opacity-100 opacity-0 transition-opacity duration-200 group"
        title="Drag to resize"
      />
      </div>
    </>
  );
};

export default ChatPanel;
