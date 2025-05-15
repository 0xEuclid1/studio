// src/lib/socket-client.ts
import { io, Socket as SocketIOClient } from 'socket.io-client';
import type { Player, PlayerSetupInfo, GamePhase } from '@/types';

// Export Socket type for use in other files
export type Socket = SocketIOClient<SocketEvents, SocketEmitEvents>;

// Socket connection states
export type SocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Socket event types
export type SocketEvents = {
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;
  game_state_update: (state: GameState) => void;
  player_checkpoint: (data: { playerName: string; checkpointId: number }) => void;
  player_finished: (data: { playerName: string; finishTime: number }) => void;
  game_reset: () => void;
};

// Socket emit event types
export type SocketEmitEvents = {
  player_join: (playerSetup: PlayerSetupInfo) => void;
  player_ready: (isReady: boolean) => void;
  checkpoint_passed: (checkpointId: number) => void;
  player_finish: () => void;
  restart_game: () => void;
};

export type GameState = {
  phase: GamePhase;
  players: Record<string, Player>;
  readyPlayersCount: number;
  countdown: number | null;
  raceStartTime: number | null;
};

// Socket instance with proper typing
let socket: Socket | null = null;

// Connection state management
let connectionState: SocketConnectionState = 'disconnected';
let connectionStateListeners: ((state: SocketConnectionState) => void)[] = [];

// Subscribe to connection state changes
export const subscribeToConnectionState = (listener: (state: SocketConnectionState) => void) => {
  connectionStateListeners.push(listener);
  return () => {
    connectionStateListeners = connectionStateListeners.filter(l => l !== listener);
  };
};

// Update connection state and notify listeners
const updateConnectionState = (newState: SocketConnectionState) => {
  connectionState = newState;
  connectionStateListeners.forEach(listener => listener(newState));
};

// Get current connection state
export const getConnectionState = () => connectionState;

// Initialize socket with reconnection logic
export const initializeSocket = async (): Promise<Socket | null> => {
  if (socket?.connected) {
    return socket;
  }

  try {
    updateConnectionState('connecting');
    
    // Initialize socket endpoint
    await fetch('/api/socket');
    
    // Create socket instance with reconnection options
    socket = io({
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to socket server', socket?.id);
      updateConnectionState('connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      updateConnectionState('disconnected');
      
      // If the server closed the connection, try to reconnect
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      updateConnectionState('error');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to socket server after', attemptNumber, 'attempts');
      updateConnectionState('connected');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect...', attemptNumber);
      updateConnectionState('connecting');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      updateConnectionState('error');
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect to socket server');
      updateConnectionState('error');
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    updateConnectionState('error');
    return null;
  }
};

// Emit event with proper error handling
const emitWithErrorHandling = <T extends keyof SocketEmitEvents>(
  event: T,
  ...args: Parameters<SocketEmitEvents[T]>
) => {
  if (!socket?.connected) {
    console.error(`Socket not connected. Cannot emit ${event}`);
    return false;
  }

  try {
    socket.emit(event, ...args);
    return true;
  } catch (error) {
    console.error(`Error emitting ${event}:`, error);
    return false;
  }
};

// Register player with the server
export const registerPlayer = (playerSetup: PlayerSetupInfo) => {
  return emitWithErrorHandling('player_join', playerSetup);
};

// Update player ready status
export const setPlayerReady = (isReady: boolean) => {
  return emitWithErrorHandling('player_ready', isReady);
};

// Notify server when player passes a checkpoint
export const passCheckpoint = (checkpointId: number) => {
  return emitWithErrorHandling('checkpoint_passed', checkpointId);
};

// Notify server when player finishes race
export const playerFinish = () => {
  return emitWithErrorHandling('player_finish');
};

// Request to restart the game
export const restartGame = () => {
  return emitWithErrorHandling('restart_game');
};

// Get current client's player ID
export const getCurrentPlayerId = () => {
  return socket?.id ?? null;
};

// Check if this client is the current player
export const isCurrentPlayer = (playerId: string) => {
  return socket?.id === playerId;
};

// Clean up socket connection
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    updateConnectionState('disconnected');
  }
};

// Add event listener with proper typing
export const addEventListener = <T extends keyof SocketEvents>(
  event: T,
  listener: SocketEvents[T]
) => {
  socket?.on(event, listener as any);
  return () => {
    socket?.off(event, listener as any);
  };
};

// Remove event listener
export const removeEventListener = <T extends keyof SocketEvents>(
  event: T,
  listener: SocketEvents[T]
) => {
  socket?.off(event, listener as any);
};