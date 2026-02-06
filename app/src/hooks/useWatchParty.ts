import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '@/config/api';
import { useApp } from '@/context/AppContext';

export interface Participant {
  userId: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  isReady: boolean;
}

export interface ChatMessage {
  userId: string;
  name: string;
  message: string;
  timestamp: Date;
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  lastUpdate: Date;
}

export interface RoomData {
  roomId: string;
  animeId: string;
  episodeId: string;
  animeTitle: string;
  episodeNumber: number;
  participants: Participant[];
  messages: ChatMessage[];
  videoState: VideoState;
  isHost: boolean;
}

interface UseWatchPartyReturn {
  socket: Socket | null;
  isConnected: boolean;
  roomData: RoomData | null;
  messages: ChatMessage[];
  participants: Participant[];
  isHost: boolean;
  error: string | null;
  currentUserId: string | null;
  videoState: VideoState | null;
  joinRoom: (params: JoinRoomParams) => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  sendVideoState: (isPlaying: boolean, currentTime: number) => void;
  seekVideo: (currentTime: number) => void;
  toggleReady: () => void;
  transferHost: (newHostId: string) => void;
  kickParticipant: (userId: string) => void;
  sendReaction: (emoji: string) => void;
}

interface JoinRoomParams {
  roomId?: string;
  animeId?: string;
  episodeId?: string;
  animeTitle?: string;
  episodeNumber?: number;
  isHost?: boolean;
}

export function useWatchParty(): UseWatchPartyReturn {
  const { user } = useApp();
  const token = user ? (user as any).token || localStorage.getItem('auth_token') : null;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoState, setVideoState] = useState<VideoState | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    const socket = io(`${BACKEND_URL}/watchparty`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WatchParty] Connected');
      setIsConnected(true);
      setError(null);
    });

    socket.on('disconnect', () => {
      console.log('[WatchParty] Disconnected, will attempt to reconnect...');
      setIsConnected(false);
    });
    
    // Auto-rejoin on reconnect
    socket.on('reconnect', () => {
      console.log('[WatchParty] Reconnected');
      if (roomData?.roomId) {
        console.log('[WatchParty] Rejoining room:', roomData.roomId);
        socket.emit('rejoin-room', { roomId: roomData.roomId });
      }
    });

    socket.on('connect_error', (err: Error) => {
      console.error('[WatchParty] Connection error:', err);
      setError('Failed to connect to watch party server');
    });

    socket.on('error', ({ message }: { message: string }) => {
      setError(message);
    });

    socket.on('room-joined', (data: RoomData) => {
      setRoomData(data);
      setMessages(data.messages);
      setParticipants(data.participants);
      setIsHost(data.isHost);
      setError(null);
    });

    socket.on('user-joined', (user: Participant) => {
      setParticipants(prev => [...prev, user]);
    });

    socket.on('user-left', ({ userId }: { userId: string }) => {
      setParticipants(prev => prev.filter(p => p.userId !== userId));
    });

    socket.on('user-ready', ({ userId, isReady }: { userId: string; isReady: boolean }) => {
      console.log('[WatchParty] User ready:', userId, isReady);
      setParticipants(prev =>
        prev.map(p => (p.userId === userId ? { ...p, isReady } : p))
      );
    });

    socket.on('new-message', (message: ChatMessage) => {
      console.log('[WatchParty] New message:', message);
      setMessages(prev => [...prev, message]);
    });

    // Store reactions separately with auto-remove
    socket.on('new-reaction', ({ name, emoji }: { name: string; emoji: string }) => {
      console.log('[WatchParty] New reaction:', name, emoji);
      const reaction = { name, emoji, id: Date.now() };
      // Add to reactions state (will be managed in component)
      window.dispatchEvent(new CustomEvent('watchparty-reaction', { detail: reaction }));
    });

    socket.on('video-state-update', (state: VideoState) => {
      console.log('[WatchParty] Video state update:', state);
      setVideoState(state);
    });

    socket.on('video-seek', (data: { currentTime: number }) => {
      console.log('[WatchParty] Video seek:', data);
      setVideoState(prev => prev ? { ...prev, currentTime: data.currentTime } : { isPlaying: false, currentTime: data.currentTime, lastUpdate: new Date() });
    });

    socket.on('host-transferred', ({ newHostId }: { newHostId: string }) => {
      setParticipants(prev =>
        prev.map(p => ({
          ...p,
          isHost: p.userId === newHostId,
        }))
      );
      if (user && newHostId === user.id) {
        setIsHost(true);
      }
    });

    socket.on('became-host', () => {
      setIsHost(true);
    });

    socket.on('kicked', (data?: { reason?: string }) => {
      console.log('[WatchParty] You were kicked:', data);
      // Disconnect socket
      socket.disconnect();
      setRoomData(null);
      setMessages([]);
      setParticipants([]);
      setIsHost(false);
      setError(data?.reason || 'You were kicked from the room');
    });
    
    socket.on('participant-kicked', ({ userId, name }: { userId: string; name: string }) => {
      console.log('[WatchParty] Participant kicked:', name);
      setParticipants(prev => prev.filter(p => p.userId !== userId));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const joinRoom = useCallback((params: JoinRoomParams) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join-room', params);
  }, []);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.disconnect();
    setRoomData(null);
    setMessages([]);
    setParticipants([]);
    setIsHost(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    console.log('[WatchParty] Sending message:', message);
    if (!socketRef.current || !message.trim()) return;
    socketRef.current.emit('send-message', { message: message.trim() });
    console.log('[WatchParty] Message emitted');
  }, []);

  const sendVideoState = useCallback((isPlaying: boolean, currentTime: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('video-state-change', { isPlaying, currentTime });
  }, []);

  const seekVideo = useCallback((currentTime: number) => {
    if (!socketRef.current) return;
    socketRef.current.emit('video-seek', { currentTime });
  }, []);

  const toggleReady = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit('toggle-ready');
  }, []);

  const transferHost = useCallback((newHostId: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('transfer-host', { newHostId });
  }, []);

  const kickParticipant = useCallback((userId: string) => {
    console.log('[WatchParty] Emitting kick-participant for:', userId);
    if (!socketRef.current) {
      console.log('[WatchParty] Cannot kick: socket not connected');
      return;
    }
    socketRef.current.emit('kick-participant', { userId }, (response: any) => {
      console.log('[WatchParty] Kick response:', response);
    });
  }, []);

  const sendReaction = useCallback((emoji: string) => {
    if (!socketRef.current) return;
    socketRef.current.emit('send-reaction', { emoji });
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    roomData,
    messages,
    participants,
    isHost,
    error,
    currentUserId: user?.id || null,
    videoState,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendVideoState,
    seekVideo,
    toggleReady,
    transferHost,
    kickParticipant,
    sendReaction,
  };
}

export default useWatchParty;
