import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Smile,
  Wifi,
  WifiOff,
  Users,
  Loader2,
  Trash2,
  Pin,
  PinOff,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useGlobalChat, type ChatMessage } from '@/hooks/useGlobalChat';
import RoleBadge from './RoleBadge';

// Group messages by date
function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
  
  messages.forEach((msg) => {
    const msgDate = new Date(msg.timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    const existingGroup = groups.find(g => g.date === msgDate);
    if (existingGroup) {
      existingGroup.messages.push(msg);
    } else {
      groups.push({ date: msgDate, messages: [msg] });
    }
  });
  
  return groups;
}

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useApp();
  
  const { 
    messages, 
    pinnedMessage,
    isConnected, 
    onlineCount, 
    typingUsers,
    error,
    clearError,
    sendMessage, 
    setTyping,
    deleteMessage,
    pinMessage
  } = useGlobalChat();
  
  const isAdmin = user?.communityRole === 'admin' || user?.isAdmin;

  // Emojis
  const emojis = ['👍', '❤️', '😂', '😮', '👏', '🔥', '❓', '🎉', '🤔', '👋', '💯', '✨'];

  // Group messages by date
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  // Track new messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.userId !== user?.id) {
        setHasNewMessage(true);
        setUnreadCount(prev => Math.min(prev + 1, 99));
      }
    }
  }, [messages, isOpen, user?.id]);

  // Scroll to bottom when new message (only if already at bottom)
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages, isOpen]);

  // Lock body scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle input change with typing indicator
  const handleInputChange = (value: string) => {
    setInputMessage(value);
    setTyping(value.length > 0);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage);
    setInputMessage('');
    setShowEmojiPicker(false);
    setTyping(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addEmoji = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      setHasNewMessage(false);
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isMyMessage = (msg: ChatMessage) => {
    if (user?.id) {
      return msg.userId === user.id;
    }
    return msg.isGuest && msg.userId.includes('guest_');
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]} sedang mengetik...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} dan ${typingUsers[1]} sedang mengetik...`;
    return `${typingUsers.length} orang sedang mengetik...`;
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className="fixed bottom-24 sm:bottom-20 right-4 z-50 group"
      >
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6C5DD3] via-[#8B5CF6] to-[#A78BFA] shadow-lg shadow-[#6C5DD3]/30 flex items-center justify-center overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <MessageCircle className="w-6 h-6 text-white relative z-10" />
          
          {/* Connection Status Indicator */}
          <div className={`absolute top-2 left-2 w-2.5 h-2.5 rounded-full border-2 border-[#6C5DD3] ${isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
        </div>
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full flex items-center justify-center text-[11px] text-white font-bold border-2 border-[#0F0F1A]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
        
        {/* New Message Pulse */}
        {hasNewMessage && (
          <span className="absolute inset-0 rounded-2xl ring-2 ring-[#6C5DD3] ring-offset-2 ring-offset-[#0F0F1A] animate-ping opacity-30" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-40 sm:bottom-36 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-10rem)] bg-[#0F0F1A]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#6C5DD3]/20 to-transparent">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  {/* Online indicator on avatar */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0F0F1A] ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Chat Komunitas</h3>
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <Wifi className="w-3 h-3" />
                        Online
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <WifiOff className="w-3 h-3" />
                        Menghubungkan...
                      </span>
                    )}
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {onlineCount}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/50 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs flex-1">{error}</p>
                  <button onClick={clearError} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pinned Message */}
            <AnimatePresence>
              {pinnedMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-gradient-to-r from-[#6C5DD3]/30 to-[#8B5CF6]/20 border-b border-[#6C5DD3]/30 px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-[#6C5DD3]/30 rounded-full">
                      <Pin className="w-3 h-3 text-[#8B5CF6]" />
                      <span className="text-[10px] text-[#8B5CF6] font-medium uppercase tracking-wide">Disematkan</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {pinnedMessage.avatar ? (
                        <img src={pinnedMessage.avatar} alt={pinnedMessage.username} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        pinnedMessage.username[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs text-white/80 font-medium">{pinnedMessage.username}</span>
                        {(pinnedMessage.communityRole && pinnedMessage.communityRole !== 'member') && (
                          <RoleBadge role={pinnedMessage.communityRole} size="sm" />
                        )}
                      </div>
                      <p className="text-sm text-white/90 line-clamp-2">{pinnedMessage.message}</p>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => pinMessage(pinnedMessage.id, false)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white/80 transition-colors"
                        title="Lepas sematan"
                      >
                        <PinOff className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin overscroll-contain"
              onWheel={(e) => {
                const container = messagesContainerRef.current;
                if (!container) return;
                
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isAtTop = scrollTop === 0;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                const isScrollingUp = e.deltaY < 0;
                const isScrollingDown = e.deltaY > 0;
                
                // Prevent scroll propagation if at boundary
                if ((isAtTop && isScrollingUp) || (isAtBottom && isScrollingDown)) {
                  e.preventDefault();
                }
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                const container = messagesContainerRef.current;
                if (!container) return;
                
                const { scrollTop, scrollHeight, clientHeight } = container;
                const isAtTop = scrollTop === 0;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
                
                // Prevent pull-to-refresh and scroll propagation
                if (isAtTop || isAtBottom) {
                  e.preventDefault();
                }
                e.stopPropagation();
              }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 py-8">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">Belum ada pesan</p>
                  <p className="text-xs mt-1">Mulai percakapan sekarang!</p>
                </div>
              ) : (
                <>
                  {messageGroups.map((group) => (
                    <div key={group.date} className="space-y-1">
                      {/* Date Divider */}
                      <div className="flex items-center justify-center">
                        <div className="px-3 py-1 bg-white/5 rounded-full">
                          <span className="text-[10px] text-white/40">{group.date}</span>
                        </div>
                      </div>
                      
                      {group.messages.map((msg, index) => {
                        const myMessage = isMyMessage(msg);
                        const isFirstInGroup = index === 0 || group.messages[index - 1].userId !== msg.userId;
                        const isLastInGroup = index === group.messages.length - 1 || group.messages[index + 1].userId !== msg.userId;
                        const isConsecutive = !isFirstInGroup;
                        
                        // WHATSAPP STYLE: Pesan sendiri tanpa avatar & username
                        if (myMessage) {
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`group flex justify-end ${isConsecutive ? '-mt-1.5' : ''}`}
                            >
                              <div className="flex items-start gap-1 max-w-[85%]">
                                {/* Admin Actions - di kiri bubble */}
                                {isAdmin && (
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 self-center">
                                    <button
                                      onClick={() => pinMessage(msg.id, true)}
                                      disabled={pinnedMessage?.id === msg.id}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-[#6C5DD3] transition-colors disabled:opacity-30"
                                      title="Sematkan pesan"
                                    >
                                      <Pin className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteMessage(msg.id)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                                      title="Hapus pesan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                                
                                {/* Message Bubble */}
                                <div className="flex flex-col items-end gap-0.5">
                                  <div className="bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-lg shadow-[#6C5DD3]/20 text-sm leading-relaxed">
                                    {msg.message}
                                  </div>
                                  {/* Time */}
                                  {isLastInGroup && (
                                    <span className="text-[10px] text-white/30 mr-1">
                                      {formatTime(msg.timestamp)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        }
                        
                        // PESAN ORANG LAIN - dengan avatar & username
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group flex gap-2 ${isConsecutive ? '-mt-1.5' : ''}`}
                          >
                            {/* Avatar - only show for first message in group */}
                            {isFirstInGroup ? (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[#6C5DD3]/20">
                                {msg.avatar ? (
                                  <img src={msg.avatar} alt={msg.username} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  msg.username[0].toUpperCase()
                                )}
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-8" />
                            )}
                            
                            {/* Message Content */}
                            <div className="flex flex-col items-start max-w-[75%]">
                              {/* Username & Badge - only for first message */}
                              {isFirstInGroup && (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-xs text-white/60 font-medium">{msg.username}</span>
                                  {!msg.isGuest && msg.communityRole && msg.communityRole !== 'member' && (
                                    <RoleBadge role={msg.communityRole} size="sm" />
                                  )}
                                  {msg.isGuest && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/40">Guest</span>
                                  )}
                                </div>
                              )}
                              
                              {/* Message Bubble */}
                              <div className="flex items-start gap-1">
                                <div className="bg-white/10 text-white/95 px-4 py-2.5 rounded-2xl rounded-tl-sm hover:bg-white/15 transition-colors text-sm leading-relaxed">
                                  {msg.message}
                                </div>
                                
                                {/* Admin Actions */}
                                {isAdmin && (
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 self-center">
                                    <button
                                      onClick={() => pinMessage(msg.id, true)}
                                      disabled={pinnedMessage?.id === msg.id}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-[#6C5DD3] transition-colors disabled:opacity-30"
                                      title="Sematkan pesan"
                                    >
                                      <Pin className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteMessage(msg.id)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                                      title="Hapus pesan"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {/* Time - only for last message */}
                              {isLastInGroup && (
                                <span className="text-[10px] text-white/30 mt-0.5 ml-1">
                                  {formatTime(msg.timestamp)}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
              
              {/* Typing Indicator */}
              <AnimatePresence>
                {typingUsers.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2 text-xs text-white/40 pl-10"
                  >
                    <div className="flex gap-1 bg-white/5 px-3 py-2 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px]">{getTypingText()}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-white/5">
              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-16 left-4 right-4 p-3 bg-[#1A1A2E]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl"
                  >
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {emojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="w-9 h-9 hover:bg-white/10 rounded-xl transition-all hover:scale-110 text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-[#6C5DD3]/20 text-[#6C5DD3]' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isConnected ? "Ketik pesan..." : "Menghubungkan..."}
                    disabled={!isConnected}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6C5DD3]/50 focus:bg-white/[0.07] placeholder:text-white/30 disabled:opacity-50 transition-all"
                    maxLength={500}
                  />
                  {inputMessage.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
                      {inputMessage.length}/500
                    </span>
                  )}
                </div>
                
                <motion.button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || !isConnected}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 bg-gradient-to-br from-[#6C5DD3] to-[#8B5CF6] hover:from-[#5B4EC2] hover:to-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-[#6C5DD3]/20"
                >
                  {isConnected ? (
                    <Send className="w-5 h-5 text-white" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
