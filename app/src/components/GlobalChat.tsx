import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Smile,
  Users,
  Trash2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '@/config/api';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  type?: 'text' | 'system';
}

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useApp();

  // Emojis
  const emojis = ['👍', '❤️', '😂', '😮', '👏', '🔥', '❓', '🎉', '🤔', '👋'];

  useEffect(() => {
    // Load message history from localStorage
    const savedMessages = localStorage.getItem('globalChat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load chat history');
      }
    }

    // Connect to global chat socket
    const socket = io(`${BACKEND_URL}/globalchat`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[GlobalChat] Connected');
      socket.emit('join-global-chat', {
        userId: user?.id || 'guest-' + Math.random().toString(36).substr(2, 9),
        username: user?.name || 'Guest'
      });
    });

    socket.on('message', (message: ChatMessage) => {
      setMessages(prev => {
        const newMessages = [...prev, { ...message, timestamp: new Date(message.timestamp) }];
        // Keep only last 100 messages
        const trimmed = newMessages.slice(-100);
        // Save to localStorage
        localStorage.setItem('globalChat_messages', JSON.stringify(trimmed));
        return trimmed;
      });
      
      if (!isOpen) {
        setHasNewMessage(true);
      }
    });

    socket.on('online-users', (count: number) => {
      setOnlineUsers(count);
    });

    socket.on('disconnect', () => {
      console.log('[GlobalChat] Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [user, isOpen]);

  // Scroll to bottom when new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !socketRef.current) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: user?.id || 'guest',
      username: user?.name || 'Guest',
      avatar: user?.avatar,
      message: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    socketRef.current.emit('send-message', message);
    setInputMessage('');
    setShowEmojiPicker(false);
  };

  const addEmoji = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
  };

  const clearHistory = () => {
    if (confirm('Hapus semua riwayat chat?')) {
      setMessages([]);
      localStorage.removeItem('globalChat_messages');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setHasNewMessage(false);
        }}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] shadow-lg shadow-[#6C5DD3]/30 flex items-center justify-center group"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        
        {/* New Message Indicator */}
        {hasNewMessage && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
        
        {/* Online Count Badge */}
        {onlineUsers > 0 && (
          <span className="absolute -bottom-1 -left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <Users className="w-3 h-3" />
            {onlineUsers}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-10rem)] bg-[#1A1A2E] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#6C5DD3]/20 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Chat Komunitas</h3>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {onlineUsers} Online
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={clearHistory}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                  title="Hapus riwayat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="text-center text-white/30 py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Belum ada pesan</p>
                  <p className="text-sm">Mulai chat sekarang!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
                      {msg.avatar ? (
                        <img src={msg.avatar} alt={msg.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        msg.username[0].toUpperCase()
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`max-w-[70%] ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-white/50">{msg.username}</span>
                        <span className="text-[10px] text-white/30">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div 
                        className={`px-3 py-2 rounded-2xl text-sm ${
                          msg.userId === user?.id 
                            ? 'bg-[#6C5DD3] text-white rounded-br-md' 
                            : 'bg-white/10 text-white/90 rounded-bl-md'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-16 left-4 right-4 p-2 bg-[#0F0F1A] rounded-xl border border-white/10 flex gap-2 flex-wrap justify-center"
                  >
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addEmoji(emoji)}
                        className="w-8 h-8 hover:bg-white/10 rounded-lg transition-colors text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#6C5DD3] placeholder:text-white/30"
                  maxLength={200}
                />
                
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-[#6C5DD3] hover:bg-[#5B4EC2] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
