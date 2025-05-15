import type { Checkpoint } from '@/types';

export const TRACK_SVG_VIEWBOX = "0 0 800 600";
export const TRACK_PATH = "M 100,100 H 700 A 50,50 0 0 1 750,150 V 450 A 50,50 0 0 1 700,500 H 100 A 50,50 0 0 1 50,450 V 150 A 50,50 0 0 1 100,100 Z";
export const TRACK_COLOR = "#00FF00"; // Bright Green
export const TRACK_STROKE_WIDTH = 20;
export const CAR_RADIUS = 12;

export const CHECKPOINTS: Checkpoint[] = [
  { id: 1, position: 0.18, x: 380, y: 100 }, // Approximate positions for icons on the given track
  { id: 2, position: 0.38, x: 750, y: 300 },
  { id: 3, position: 0.58, x: 420, y: 500 },
  { id: 4, position: 0.78, x: 50, y: 300 },
  { id: 5, position: 0.95, x: 100, y: 120 }, // Near finish line
];

// Speed in percentage of track per second (e.g., 0.05 = 5% of track per second)
export const MIN_SPEED = 0.07; // 7% track per second
export const MAX_SPEED = 0.12; // 12% track per second
export const INITIAL_SPEED_VARIATION = 0.01; // Max difference between initial speeds

export const COUNTDOWN_SECONDS = 3;
export const RACE_LAPS = 1;

export const GAME_FPS = 60; // Target FPS for game loop updates

export function getRandomSpeed(): number {
  return Math.random() * (MAX_SPEED - MIN_SPEED) + MIN_SPEED;
}

export function getInitialSpeeds(): [number, number] {
  const speed1 = getRandomSpeed();
  let speed2 = getRandomSpeed();
  // Ensure speeds are close
  while (Math.abs(speed1 - speed2) > INITIAL_SPEED_VARIATION) {
    speed2 = getRandomSpeed();
  }
  return [speed1, speed2];
}
