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
  joinRoom: (params: JoinRoomParams) => void;
  leaveRoom: () => void;
  sendMessage: (message: string) => void;
  sendVideoState: (isPlaying: boolean, currentTime: number) => void;
  seekVideo: (currentTime: number) => void;
  toggleReady: () => void;
  transferHost: (newHostId: string) => void;
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
      console.log('[WatchParty] Disconnected');
      setIsConnected(false);
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
      setParticipants(prev =>
        prev.map(p => (p.userId === userId ? { ...p, isReady } : p))
      );
    });

    socket.on('new-message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('video-state-update', (_state: VideoState) => {
      // Handled in WatchPartyRoom component
    });

    socket.on('video-seek', (_data: { currentTime: number }) => {
      // Handled in WatchPartyRoom component
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

    socket.on('kicked', () => {
      setRoomData(null);
      setMessages([]);
      setParticipants([]);
      setError('You were kicked from the room');
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
    if (!socketRef.current || !message.trim()) return;
    socketRef.current.emit('send-message', { message: message.trim() });
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

  return {
    socket: socketRef.current,
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
  };
}

export default useWatchParty;
