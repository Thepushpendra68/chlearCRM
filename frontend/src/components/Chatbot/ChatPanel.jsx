import { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import chatbotService from '../../services/chatbotService';
import { useAuth } from '../../context/AuthContext';
import { useVoice } from '../../hooks/useVoice';
import VoiceInput from '../Voice/VoiceInput';
import VoiceToggle from '../Voice/VoiceToggle';
import audioService from '../../services/audioService';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Trash2, X, AlertCircle, Mic, MicOff } from 'lucide-react';

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
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const resizeHandleRef = useRef(null);

  // Voice functionality
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isVoiceSupported,
    startListening,
    stopListening,
    speak
  } = useVoice();

  // Calculate width as percentage of viewport (20% default, 30% max)
  const getDefaultWidth = () => {
    const vw = window.innerWidth;
    return Math.min(vw * 0.2, vw * 0.3); // 20% default, capped at 30%
  };

  const [widthPercent, setWidthPercent] = useState(chatPanelSize?.widthPercent || 20);

  // Track mobile viewport and update width
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      const vw = window.innerWidth;
      const newWidth = vw - e.clientX;
      
      // Calculate as percentage: min 15%, max 30%
      const newPercent = (newWidth / vw) * 100;
      const constrainedPercent = Math.max(15, Math.min(30, newPercent));
      
      setWidthPercent(constrainedPercent);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setChatPanelSize({ widthPercent });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, widthPercent, setChatPanelSize]);

  // Update width from context
  useEffect(() => {
    if (chatPanelSize?.widthPercent) {
      setWidthPercent(chatPanelSize.widthPercent);
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

      // Play notification sound for new message
      audioService.playPattern('message-received');

      // Speak the response if voice mode is enabled
      if (voiceMode && response.response) {
        speak(response.response);
      }

      if (response.needsConfirmation && response.action !== 'CHAT') {
        const pendingParameters = response.data?.parameters || normalizedParameters;
        if (!response.pendingActionToken) {
          toast.error('Unable to prepare confirmation token. Please try again.');
          setPendingAction(null);
        } else {
          setPendingAction({
            action: response.action,
            parameters: pendingParameters,
            summary: buildActionSummary(response.action, pendingParameters),
            missingFields: normalizedMissingFields,
            intent: response.intent,
            source: response.source,
            model: response.model,
            confirmationToken: response.pendingActionToken,
            expiresAt: response.pendingActionExpiresAt
          });
        }
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
      // Play error sound
      audioService.playPattern('action-error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voice transcript
  useEffect(() => {
    if (transcript && voiceMode) {
      sendMessage(transcript);
    }
  }, [transcript]);

  // Toggle voice mode
  const toggleVoiceMode = () => {
    if (isListening) {
      stopListening();
    }
    setVoiceMode(!voiceMode);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    if (
      pendingAction.expiresAt &&
      new Date(pendingAction.expiresAt).getTime() < Date.now()
    ) {
      toast.error('This confirmation expired. Please ask again.');
      setPendingAction(null);
      return;
    }

    if (!pendingAction.confirmationToken) {
      toast.error('Missing confirmation token. Please try again.');
      setPendingAction(null);
      return;
    }

    setIsLoading(true);

    try {
      const response = await chatbotService.confirmAction(
        pendingAction.confirmationToken
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
      // Play success sound
      audioService.playPattern('action-success');
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
      // Play error sound
      audioService.playPattern('action-error');
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
      
      {/* Chat Panel - Desktop integrated sidebar / Mobile overlay */}
      <div 
        ref={chatContainerRef}
        className={`fixed md:relative top-16 md:top-0 right-0 md:right-auto bottom-0 h-[calc(100vh-64px)] md:h-full bg-background border-l flex flex-col shadow-2xl md:shadow-lg transition-all duration-300 ease-in-out z-40 ${
          chatPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        } md:translate-x-0`}
        style={{ 
          width: isMobile ? '90vw' : `${widthPercent}vw`,
          minWidth: isMobile ? undefined : '280px',
          maxWidth: isMobile ? undefined : '30vw'
        }}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between flex-shrink-0 rounded-t-none border-b">
          <div>
            <h3 className="font-semibold text-sm">CRM Assistant</h3>
            <p className="text-[10px] opacity-90 mt-0.5">Powered by Gemini AI</p>
          </div>
          <div className="flex items-center gap-1">
            {isVoiceSupported && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoiceMode}
                className={`h-7 w-7 hover:bg-primary/80 rounded ${voiceMode ? 'bg-primary/60' : ''}`}
                title={voiceMode ? 'Switch to text mode' : 'Switch to voice mode'}
              >
                {voiceMode ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={clearConversation}
              className="h-7 w-7 hover:bg-primary/80 rounded"
              title="Clear conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages Container */}
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2.5">
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="flex space-x-0.5">
                    <div className="w-1 h-1 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-primary-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Pending Action Confirmation */}
        {pendingAction && (
          <CardFooter className="flex flex-col gap-2 border-t bg-muted/50 p-3">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Pending Action</p>
              <p className="text-xs font-semibold text-foreground">
                {getActionLabel(pendingAction.action)}
              </p>
              {pendingAction.intent && (
                <p className="text-[10px] text-muted-foreground">{pendingAction.intent}</p>
              )}
            </div>

            {pendingAction.summary?.length > 0 && (
              <div className="w-full bg-card border rounded p-2 text-[10px] max-h-32 overflow-y-auto">
                <p className="text-[10px] font-semibold text-foreground mb-1.5">Details to confirm:</p>
                <ul className="space-y-1">
                  {pendingAction.summary.map(item => (
                    <li key={`${item.label}-${item.value}`} className="flex justify-between gap-2 items-center">
                      <span className="font-medium flex-shrink-0 text-foreground">{item.label}</span>
                      <span className="text-right text-muted-foreground truncate">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingAction.missingFields?.length > 0 && (
              <div className="w-full text-[10px] bg-destructive/10 border border-destructive/20 rounded p-2 text-destructive flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>Missing: {pendingAction.missingFields.join(', ')}</span>
              </div>
            )}

            <div className="flex w-full gap-2 pt-1">
              <Button
                onClick={confirmAction}
                disabled={isLoading}
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                Confirm
              </Button>
              <Button
                onClick={cancelAction}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        )}

        {/* Quick Actions */}
        {!pendingAction && messages.length === 1 && (
          <div className="border-t p-2 bg-card flex-shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">QUICK ACTIONS</p>
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="text-[10px] h-auto py-1.5"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

      {/* Input Area */}
      {voiceMode ? (
        <div className="border-t p-3 bg-card flex-shrink-0">
          <VoiceInput
            onTranscript={setTranscript}
            onInterimTranscript={setInterimTranscript}
            disabled={isLoading}
          />
          {interimTranscript && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground italic">
              {interimTranscript}
            </div>
          )}
        </div>
      ) : (
        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      )}

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
