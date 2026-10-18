import React from 'react';
import { Bot } from 'lucide-react';

export interface IMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  message: string;
  messageType: 'text' | 'system';
  createdAt: string;
}

interface MessageBubbleProps {
  message: IMessage;
  isCurrentUser: boolean;
  showSenderInfo: boolean;
}

export default function MessageBubble({ message, isCurrentUser, showSenderInfo }: MessageBubbleProps) {
  if (message.messageType === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-accent/50 text-muted-foreground text-xs px-4 py-1.5 rounded-full flex items-center space-x-2 border border-border/50">
          <Bot className="w-3.5 h-3.5" />
          <span>{message.message}</span>
        </div>
      </div>
    );
  }

  const timeString = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(message.createdAt));
  const initials = message.sender?.name ? message.sender.name.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className={`flex w-full ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`flex max-w-[75%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        {showSenderInfo && !isCurrentUser && (
          <div className="flex-shrink-0 mb-5">
            {message.sender?.profilePicture ? (
              <img src={message.sender.profilePicture} alt={message.sender?.name || 'User'} className="w-7 h-7 rounded-full object-cover border border-border" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                {initials}
              </div>
            )}
          </div>
        )}
        
        {!showSenderInfo && !isCurrentUser && <div className="w-7 flex-shrink-0" />}

        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          {showSenderInfo && (
            <span className="text-[11px] text-muted-foreground mb-1 ml-1 mr-1 font-medium">
              {isCurrentUser ? 'You' : (message.sender?.name || 'Unknown User')}
            </span>
          )}
          <div
            className={`px-4 py-2.5 rounded-2xl ${
              isCurrentUser
                ? 'bg-primary text-primary-foreground rounded-br-sm shadow-sm'
                : 'bg-card text-card-foreground rounded-bl-sm border border-border/50 shadow-sm'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 mx-1 opacity-70">
            {timeString}
          </span>
        </div>
      </div>
    </div>
  );
}
