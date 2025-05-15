import type { Checkpoint } from '@/types';

export const TRACK_SVG_VIEWBOX = "0 0 800 600";
export const TRACK_PATH = "M 100,100 H 700 A 50,50 0 0 1 750,150 V 450 A 50,50 0 0 1 700,500 H 100 A 50,50 0 0 1 50,450 V 150 A 50,50 0 0 1 100,100 Z";
export const TRACK_COLOR = "#00FF00"; // Bright Green
export const TRACK_STROKE_WIDTH = 20;
export const CAR_RADIUS = 12;

export const CHECKPOINTS: Checkpoint[] = [
  { id: 1, position: 0.09, x: 250, y: 100 },
  { id: 2, position: 0.18, x: 550, y: 100 },
  { id: 3, position: 0.27, x: 750, y: 200 },
  { id: 4, position: 0.36, x: 750, y: 400 },
  { id: 5, position: 0.45, x: 600, y: 500 },
  { id: 6, position: 0.54, x: 300, y: 500 },
  { id: 7, position: 0.63, x: 50, y: 400 },
  { id: 8, position: 0.72, x: 50, y: 200 },
  { id: 9, position: 0.81, x: 150, y: 120 }, // Adjusted to be more distinct from start/finish
  { id: 10, position: 0.90, x: 450, y: 120 },// Adjusted
];

// Speed in percentage of track per second (e.g., 0.05 = 5% of track per second)
export const MIN_SPEED = 0.035; // Halved from 0.07
export const MAX_SPEED = 0.06;  // Halved from 0.12
// export const INITIAL_SPEED_VARIATION = 0.01; // Max difference between initial speeds - no longer used this way

export const COUNTDOWN_SECONDS = 3;
export const RACE_LAPS = 1;

export const GAME_FPS = 60; // Target FPS for game loop updates

export function getRandomSpeed(): number {
  return Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
}

export function getInitialSpeeds(numPlayers: number): number[] {
  const speeds: number[] = [];
  for (let i = 0; i < numPlayers; i++) {
    speeds.push(getRandomSpeed());
  }
  return speeds;
}
