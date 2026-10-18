import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, onTyping, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="p-3 border-t border-border bg-card/80 backdrop-blur-md rounded-b-lg">
      <div className="flex items-end space-x-2 bg-background border border-border/50 rounded-xl p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Team chat is unavailable" : "Type a message..."}
          disabled={disabled}
          className="flex-1 bg-transparent resize-none border-0 focus:ring-0 text-sm p-2 max-h-[120px] min-h-[40px] text-foreground placeholder-muted-foreground outline-none"
          rows={1}
        />
        <div className="flex items-center space-x-1 pb-1">
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="w-8 h-8 rounded-full shadow-sm bg-primary hover:bg-primary/90 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
