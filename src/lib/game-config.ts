
import type { Checkpoint } from '@/types';

export const TRACK_SVG_VIEWBOX = "0 0 800 600";
// Yeni, daha virajlı pist yolu
export const TRACK_PATH = "M 100,300 C 100,100 300,100 300,200 S 500,300 600,200 S 700,100 700,300 S 600,500 500,400 S 300,300 200,400 S 100,500 100,300 Z";
export const TRACK_COLOR = "#00FF00"; // Bright Green
export const TRACK_STROKE_WIDTH = 20;
export const CAR_RADIUS = 12;

// Yeni pist yoluna göre güncellenmiş viraj (checkpoint) koordinatları
export const CHECKPOINTS: Checkpoint[] = [
  { id: 1, position: 0.09, x: 180, y: 120 }, // İlk büyük virajın başları
  { id: 2, position: 0.18, x: 300, y: 190 }, // İlk S kavisinin ortası
  { id: 3, position: 0.27, x: 450, y: 230 }, // İkinci S öncesi düzlük
  { id: 4, position: 0.36, x: 600, y: 190 }, // İkinci S kavisinin tepesi
  { id: 5, position: 0.45, x: 680, y: 250 }, // Pistin en sağına yakın iniş başlangıcı
  { id: 6, position: 0.54, x: 680, y: 350 }, // Pistin en sağında aşağı dönüş
  { id: 7, position: 0.63, x: 580, y: 450 }, // Alt tarafta sola dönüş başlangıcı
  { id: 8, position: 0.72, x: 480, y: 410 }, // Alt S kavisinin ortası
  { id: 9, position: 0.81, x: 350, y: 370 }, // Son S kavisinden çıkış
  { id: 10, position: 0.90, x: 180, y: 410 },// Bitiş çizgisine yaklaşırken
];

// Hızlar düşürüldü
export const MIN_SPEED = 0.025; // Önceki 0.035
export const MAX_SPEED = 0.045;  // Önceki 0.06

export const COUNTDOWN_SECONDS = 3;
export const RACE_LAPS = 1; // Oyun şu anda tek tur üzerine kurulu

export const GAME_FPS = 60;

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
