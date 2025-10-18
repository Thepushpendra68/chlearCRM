import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { SendHorizontal } from 'lucide-react';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-5 bg-card flex flex-col gap-3 flex-shrink-0">
      <div className="flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-3 border border-input rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm placeholder:text-muted-foreground/70"
          style={{ maxHeight: '100px' }}
        />
        <Button
          type="submit"
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-lg"
          aria-label="Send message"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/80 px-1">💡 Enter to send • Shift+Enter for new line</p>
    </form>
  );
};

export default ChatInput;