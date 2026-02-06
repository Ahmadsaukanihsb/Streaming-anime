import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Send, 
  Crown, 
  LogOut, 
  CheckCircle2,
  Copy,
  MessageSquare
} from 'lucide-react';
import { useWatchParty } from '@/hooks/useWatchParty';
import SafeAvatar from '@/components/SafeAvatar';
import { Button } from '@/components/ui/button';

interface WatchPartyRoomProps {
  roomId?: string;
  animeId: string;
  episodeId: string;
  animeTitle: string;
  episodeNumber: number;
  isHost?: boolean;
  onClose: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}

export default function WatchPartyRoom({
  roomId,
  animeId,
  episodeId,
  animeTitle,
  episodeNumber,
  isHost: initialHost = false,
  onClose,
  videoRef,
}: WatchPartyRoomProps) {
  const {
    isConnected,
    roomData,
    messages,
    participants,
    isHost,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendVideoState,
    seekVideo,
    toggleReady,
    transferHost,
  } = useWatchParty();

  const [messageInput, setMessageInput] = useState('');
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const wasPlayingRef = useRef(false);

  // Join room on mount
  useEffect(() => {
    if (!roomData && isConnected) {
      joinRoom({
        roomId,
        animeId,
        episodeId,
        animeTitle,
        episodeNumber,
        isHost: initialHost,
      });
    }
  }, [isConnected, roomData, joinRoom, roomId, animeId, episodeId, animeTitle, episodeNumber, initialHost]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Video sync
  useEffect(() => {
    if (!videoRef?.current || !roomData) return;

    const video = videoRef.current;

    const handlePlay = () => {
      if (isHost) {
        sendVideoState(true, video.currentTime);
      }
    };

    const handlePause = () => {
      if (isHost) {
        sendVideoState(false, video.currentTime);
      }
    };

    const handleSeek = () => {
      if (isHost) {
        seekVideo(video.currentTime);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeek);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeek);
    };
  }, [videoRef, isHost, sendVideoState, seekVideo, roomData]);

  // Video sync is handled in useWatchParty hook
  // This component receives synced state via roomData

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    sendMessage(messageInput);
    setMessageInput('');
  };

  const copyRoomCode = () => {
    if (roomData?.roomId) {
      navigator.clipboard.writeText(roomData.roomId);
    }
  };

  const readyCount = participants.filter(p => p.isReady).length;
  const totalCount = participants.length;

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1A1A2E] rounded-2xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Error</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <Button onClick={onClose} className="bg-[#6C5DD3] hover:bg-[#5B4EC2]">
            Close
          </Button>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#6C5DD3] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Connecting to watch party...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Main Content - Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0F0F1A]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-white font-semibold">{roomData.animeTitle}</h2>
              <p className="text-white/50 text-sm">Episode {roomData.episodeNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Room Code */}
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <span className="text-white/60 text-sm">Room:</span>
              <span className="text-[#6C5DD3] font-mono font-medium">{roomData.roomId}</span>
              <Copy className="w-4 h-4 text-white/40" />
            </button>

            {/* Ready Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-white/60 text-sm">{readyCount}/{totalCount} Ready</span>
            </div>

            {/* Participants Toggle */}
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
            >
              <Users className="w-4 h-4 text-white/60" />
              <span className="text-white text-sm">{participants.length}</span>
            </button>

            {/* Close */}
            <button
              onClick={() => {
                leaveRoom();
                onClose();
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Video Container - Transparent to show video player from parent */}
        <div className="flex-1 bg-transparent pointer-events-none" />
      </div>

      {/* Sidebar - Chat & Participants */}
      <AnimatePresence>
        <motion.div
          initial={{ x: 320 }}
          animate={{ x: 0 }}
          exit={{ x: 320 }}
          className={`${showParticipants ? 'flex' : 'hidden'} lg:flex w-80 bg-[#1A1A2E] border-l border-white/10 flex-col`}
        >
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setShowParticipants(false)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${!showParticipants ? 'text-[#6C5DD3] border-b-2 border-[#6C5DD3]' : 'text-white/60 hover:text-white'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </div>
            </button>
            <button
              onClick={() => setShowParticipants(true)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${showParticipants ? 'text-[#6C5DD3] border-b-2 border-[#6C5DD3]' : 'text-white/60 hover:text-white'}`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Participants
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showParticipants ? (
              <div className="p-4 space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.userId}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white/5"
                  >
                    <SafeAvatar
                      src={participant.avatar}
                      name={participant.name}
                      className="w-10 h-10"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium truncate">
                          {participant.name}
                        </span>
                        {participant.isHost && (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.isReady ? (
                          <span className="text-xs text-green-400">Ready</span>
                        ) : (
                          <span className="text-xs text-white/40">Not ready</span>
                        )}
                      </div>
                    </div>
                    {isHost && !participant.isHost && (
                      <button
                        onClick={() => transferHost(participant.userId)}
                        className="text-xs text-[#6C5DD3] hover:text-white"
                      >
                        Make Host
                      </button>
                    )}
                    {!isHost && participant.userId === roomData.participants.find(p => p.userId === participant.userId)?.userId && (
                      <button
                        onClick={toggleReady}
                        className={`text-xs px-2 py-1 rounded ${participant.isReady ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}
                      >
                        {participant.isReady ? 'Ready' : 'Ready?'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${msg.userId === roomData.participants.find(p => p.userId === msg.userId)?.userId ? 'items-start' : 'items-start'}`}
                    >
                      <span className="text-xs text-white/40 mb-1">{msg.name}</span>
                      <div className="bg-white/10 rounded-lg px-3 py-2 max-w-[90%]">
                        <p className="text-white text-sm">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6C5DD3]"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-2 bg-[#6C5DD3] rounded-lg hover:bg-[#5B4EC2] disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
