import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useApp } from '@/context/AppContext';
import { getAuthToken } from '@/lib/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  communityRole?: string;
  message: string;
  timestamp: Date;
  isGuest?: boolean;
  isPinned?: boolean;
}

interface UseGlobalChatReturn {
  messages: ChatMessage[];
  pinnedMessage: ChatMessage | null;
  isConnected: boolean;
  onlineCount: number;
  typingUsers: string[];
  error: string | null;
  clearError: () => void;
  sendMessage: (message: string) => void;
  setTyping: (isTyping: boolean) => void;
  loadMoreMessages: () => void;
  deleteMessage: (messageId: string) => void;
  pinMessage: (messageId: string, isPinned: boolean) => void;
}

export function useGlobalChat(): UseGlobalChatReturn {
  const { user } = useApp();
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<ChatMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const token = getAuthToken();
    
    // Build auth object
    const auth: { token?: string; username?: string; userId?: string; avatar?: string; communityRole?: string } = {};
    
    if (token && user) {
      // Logged in user - include token
      auth.token = token;
      auth.userId = user.id;
      auth.username = user.name;
      auth.avatar = user.avatar;
      auth.communityRole = user.communityRole;
      console.log('[GlobalChat] Connecting as user:', user.name, 'role:', user.communityRole);
    } else {
      // Guest user
      const savedGuestName = localStorage.getItem('chat_guest_name');
      auth.username = savedGuestName || undefined;
      console.log('[GlobalChat] Connecting as guest');
    }

    const socket = io(`${BACKEND_URL}/globalchat`, {
      auth,
      transports: ['polling', 'websocket'], // iOS works better with polling first
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[GlobalChat] Connected to server, socket id:', socket.id);
      setIsConnected(true);
    });

    socket.on('connect_error', (err) => {
      console.error('[GlobalChat] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[GlobalChat] Disconnected from server, reason:', reason);
      setIsConnected(false);
    });

    socket.on('message-history', (history: any[]) => {
      setMessages(history.map(msg => ({
        id: msg._id?.toString() || msg.id,
        userId: msg.userId,
        username: msg.username,
        avatar: msg.avatar,
        communityRole: msg.communityRole,
        message: msg.message,
        timestamp: new Date(msg.timestamp),
        isGuest: msg.isGuest,
        isPinned: msg.isPinned
      })));
    });

    socket.on('new-message', (message: any) => {
      setMessages(prev => {
        const msgId = message._id?.toString() || message.id;
        // Prevent duplicate messages
        if (prev.some(m => m.id === msgId)) {
          return prev;
        }
        return [...prev, {
          id: msgId,
          userId: message.userId,
          username: message.username,
          avatar: message.avatar,
          communityRole: message.communityRole,
          message: message.message,
          timestamp: new Date(message.timestamp),
          isGuest: message.isGuest,
          isPinned: message.isPinned
        }];
      });
    });

    socket.on('online-count', (count: number) => {
      setOnlineCount(count);
    });

    socket.on('user-typing', ({ username, isTyping }: { username: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (isTyping) {
          if (!prev.includes(username)) {
            return [...prev, username];
          }
        } else {
          return prev.filter(u => u !== username);
        }
        return prev;
      });

      // Auto remove typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== username));
        }, 3000);
      }
    });

    socket.on('more-messages', (newMessages: any[]) => {
      setMessages(prev => [
        ...newMessages.map(msg => ({
          id: msg._id?.toString() || msg.id,
          userId: msg.userId,
          username: msg.username,
          avatar: msg.avatar,
          communityRole: msg.communityRole,
          message: msg.message,
          timestamp: new Date(msg.timestamp),
          isGuest: msg.isGuest,
          isPinned: msg.isPinned
        })),
        ...prev
      ]);
    });

    socket.on('message-deleted', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      setPinnedMessage(prev => prev?.id === messageId ? null : prev);
    });

    socket.on('message-pinned', ({ messageId, isPinned, message }: { messageId: string; isPinned: boolean; message?: any }) => {
      if (isPinned && message) {
        setPinnedMessage({
          id: message._id?.toString() || message.id,
          userId: message.userId,
          username: message.username,
          avatar: message.avatar,
          communityRole: message.communityRole,
          message: message.message,
          timestamp: new Date(message.timestamp),
          isGuest: message.isGuest,
          isPinned: true
        });
      } else {
        setPinnedMessage(null);
      }
      // Update message in list
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPinned } : m));
    });

    socket.on('error', ({ message }: { message: string }) => {
      console.error('[GlobalChat] Error:', message);
      setError(message);
    });

    return () => {
      console.log('[GlobalChat] Disconnecting socket...');
      socket.disconnect();
    };
  }, [user?.id]); // Reconnect when user ID changes

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current && isConnected && message.trim()) {
      socketRef.current.emit('send-message', { message });
    }
  }, [isConnected]);

  const setTyping = useCallback((isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', isTyping);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Auto stop typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketRef.current?.emit('typing', false);
        }, 3000);
      }
    }
  }, [isConnected]);

  const loadMoreMessages = useCallback(() => {
    if (socketRef.current && isConnected && messages.length > 0) {
      const oldestMessage = messages[0];
      socketRef.current.emit('load-more-messages', { 
        before: oldestMessage.timestamp.toISOString() 
      });
    }
  }, [isConnected, messages]);

  const deleteMessage = useCallback((messageId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('delete-message', { messageId });
    }
  }, [isConnected]);

  const pinMessage = useCallback((messageId: string, isPinned: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('pin-message', { messageId, isPinned });
    }
  }, [isConnected]);

  return {
    messages,
    pinnedMessage,
    isConnected,
    onlineCount,
    typingUsers,
    error,
    clearError,
    sendMessage,
    deleteMessage,
    pinMessage,
    setTyping,
    loadMoreMessages
  };
}
