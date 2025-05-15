// Güncellenen src/types/index.ts
export interface Player {
  id: string;
  name: string;
  color: string;
  speed: number; // percentage of track per second (0 to 1 range, e.g. 0.05 is 5% per second)
  position: number; // 0 to 1, percentage of track completed
  lap: number; 
  finishTime: number | null; // time in ms when finished, or null if DNF
  rank?: number;
  lastCheckpointPassed: number; // id of the last checkpoint passed
  isReady: boolean; // Whether the player is ready to start
}

export type GamePhase = 'lobby' | 'countdown' | 'racing' | 'results';

export interface Checkpoint {
  id: number;
  position: number; // percentage on track (0 to 1)
  x: number; // For icon positioning
  y: number; // For icon positioning
}

export interface PlayerSetupInfo {
  name: string;
  color: string;
  isReady?: boolean; // Oyuncunun yarışa hazır olup olmadığını belirtir
}

export interface GameState {
  phase: GamePhase;
  players: Record<string, Player>;
  readyPlayersCount: number;
  countdown: number | null;
  raceStartTime: number | null;
}