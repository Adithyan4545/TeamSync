import React, { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import MessageBubble, { IMessage } from './MessageBubble';
import api from '@/lib/axios';

interface TeamChatProps {
  teamId: string;
  teamName: string;
  currentUserId: string;
  teamStatus: string;
}

export default function TeamChat({ teamId, teamName, currentUserId, teamStatus }: TeamChatProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    // 1. Fetch initial messages via REST API
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/teams/${teamId}/messages`);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // 2. Initialize Socket.IO
    const authHeader = api.defaults.headers.common['Authorization'];
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : '';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    const newSocket = io(backendUrl, {
      auth: { token },
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_team', teamId, (response: any) => {
        if (!response.success) {
          console.error('Failed to join team room:', response.message);
        }
      });
    });

    newSocket.on('receive_message', (message: IMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('user_typing', ({ userId, isTyping }: { userId: string, isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_team', teamId);
      newSocket.disconnect();
    };
  }, [teamId]);

  const handleSendMessage = (text: string) => {
    if (!socket || !text.trim()) return;

    socket.emit('send_message', { teamId, message: text }, (response: any) => {
      if (!response.success) {
        console.error('Send failed:', response.message);
      }
    });
    
    // Clear our typing status immediately when sending
    socket.emit('typing', { teamId, isTyping: false });
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', { teamId, isTyping: true });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { teamId, isTyping: false });
    }, 2000);
  };

  const isClosed = teamStatus === 'Closed' || teamStatus === 'Archived';

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] border border-border/50 rounded-lg bg-card/30 shadow-sm relative overflow-hidden backdrop-blur-md">
      <ChatHeader teamName={teamName} onlineCount={isConnected ? 1 : 0} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p className="mb-2">No messages yet.</p>
            <p className="text-sm">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.sender?._id === currentUserId;
            const prevMsg = messages[index - 1];
            // Show sender info if previous message was not from the same user or if it's been more than 5 minutes
            const showSenderInfo = !prevMsg || prevMsg.sender?._id !== msg.sender?._id || 
              (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() > 5 * 60000);
            
            return (
              <MessageBubble 
                key={msg._id} 
                message={msg} 
                isCurrentUser={isCurrentUser}
                showSenderInfo={showSenderInfo}
              />
            );
          })
        )}
        
        {typingUsers.size > 0 && (
          <div className="text-xs text-muted-foreground animate-pulse flex items-center ml-12 mb-2">
            Someone is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping}
        disabled={isClosed} 
      />
    </div>
  );
}
