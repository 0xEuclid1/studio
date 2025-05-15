"use client";

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import type { GameState, PlayerSetupInfo } from '@/types';
import {
  initializeSocket,
  subscribeToConnectionState,
  type SocketConnectionState,
  type Socket,
  type SocketEvents,
  type SocketEmitEvents,
  addEventListener,
  removeEventListener,
  disconnectSocket
} from '@/lib/socket-client';

// Socket context type
type SocketContextType = {
  socket: Socket<SocketEvents, SocketEmitEvents> | null;
  connectionState: SocketConnectionState;
  gameState: GameState;
  registerPlayer: (playerInfo: PlayerSetupInfo) => boolean;
  setPlayerReady: (isReady: boolean) => boolean;
  passCheckpoint: (checkpointId: number) => boolean;
  playerFinish: () => boolean;
  restartGame: () => boolean;
  getCurrentPlayerId: () => string | null;
};

// Initial game state
const initialGameState: GameState = {
  phase: 'lobby',
  players: {},
  readyPlayersCount: 0,
  countdown: null,
  raceStartTime: null
};

// Create socket context
const SocketContext = createContext<SocketContextType>({
  socket: null,
  connectionState: 'disconnected',
  gameState: initialGameState,
  registerPlayer: () => false,
  setPlayerReady: () => false,
  passCheckpoint: () => false,
  playerFinish: () => false,
  restartGame: () => false,
  getCurrentPlayerId: () => null,
});

// Socket Hook
export const useSocket = () => useContext(SocketContext);

// Socket Provider component
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket<SocketEvents, SocketEmitEvents> | null>(null);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>('disconnected');
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // Initialize socket connection
  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      try {
        const socketInstance = await initializeSocket();
        if (mounted && socketInstance) {
          setSocket(socketInstance);
        }
      } catch (error) {
        console.error('Failed to setup socket:', error);
      }
    };

    setupSocket();

    // Subscribe to connection state changes
    const unsubscribe = subscribeToConnectionState((state) => {
      if (mounted) {
        setConnectionState(state);
      }
    });

    // Cleanup function
    return () => {
      mounted = false;
      unsubscribe();
      disconnectSocket();
    };
  }, []);

  // Set up game state listener
  useEffect(() => {
    if (!socket) return;

    const unsubscribe = addEventListener('game_state_update', (newState) => {
      setGameState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [socket]);

  // Socket functions with proper error handling
  const registerPlayer = useCallback((playerInfo: PlayerSetupInfo) => {
    if (!socket?.connected) {
      console.error('Socket not connected');
      return false;
    }
    return socket.emit('player_join', playerInfo);
  }, [socket]);

  const setPlayerReady = useCallback((isReady: boolean) => {
    if (!socket?.connected) {
      console.error('Socket not connected');
      return false;
    }
    return socket.emit('player_ready', isReady);
  }, [socket]);

  const passCheckpoint = useCallback((checkpointId: number) => {
    if (!socket?.connected) {
      console.error('Socket not connected');
      return false;
    }
    return socket.emit('checkpoint_passed', checkpointId);
  }, [socket]);

  const playerFinish = useCallback(() => {
    if (!socket?.connected) {
      console.error('Socket not connected');
      return false;
    }
    return socket.emit('player_finish');
  }, [socket]);

  const restartGame = useCallback(() => {
    if (!socket?.connected) {
      console.error('Socket not connected');
      return false;
    }
    return socket.emit('restart_game');
  }, [socket]);

  const getCurrentPlayerId = useCallback(() => {
    return socket?.id ?? null;
  }, [socket]);

  // Context value
  const value: SocketContextType = {
    socket,
    connectionState,
    gameState,
    registerPlayer,
    setPlayerReady,
    passCheckpoint,
    playerFinish,
    restartGame,
    getCurrentPlayerId,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};