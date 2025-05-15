"use client";

import type { Player, Checkpoint } from '@/types';
import { TRACK_PATH, TRACK_SVG_VIEWBOX, TRACK_COLOR, TRACK_STROKE_WIDTH, CAR_RADIUS, RACE_LAPS, CHECKPOINTS } from '@/lib/game-config';
import React, { useRef, useEffect, useState } from 'react';
import { Zap, Flag } from 'lucide-react';

interface RaceTrackProps {
  players: Player[];
  checkpoints: Checkpoint[];
  countdown: number | null; 
  gamePhase: string;
  currentPlayerId: string | null;
  onCheckpointPassed: (checkpointId: number) => void;
  onRaceFinish: () => void;
}

export function RaceTrack({ 
  players, 
  checkpoints, 
  countdown, 
  gamePhase,
  currentPlayerId,
  onCheckpointPassed,
  onRaceFinish
}: RaceTrackProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const lastCheckpointRef = useRef<number>(0);
  const raceFinishedRef = useRef<boolean>(false);

  // Get current player object
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  // Check for checkpoint passing and race finish for the current player
  useEffect(() => {
    if (gamePhase !== 'racing' || !currentPlayer || !currentPlayerId || pathLength === 0) {
      return;
    }
    
    // Check for checkpoint passing
    for (const checkpoint of CHECKPOINTS) {
      // If player has passed a new checkpoint
      if (currentPlayer.position >= checkpoint.position && 
          checkpoint.id > lastCheckpointRef.current) {
        lastCheckpointRef.current = checkpoint.id;
        onCheckpointPassed(checkpoint.id);
        break;
      }
    }
    
    // Check for race finish
    if (!raceFinishedRef.current && currentPlayer.position >= 1) {
      raceFinishedRef.current = true;
      onRaceFinish();
    }
  }, [currentPlayer, gamePhase, onCheckpointPassed, onRaceFinish, pathLength, currentPlayerId]);

  const getCarPosition = (playerPos: number) => {
    if (!pathRef.current || pathLength === 0 || playerPos < 0) { 
      return { x: 0, y: 0 }; 
    }
    
    // Scale position to total race distance (RACE_LAPS)
    const totalDistance = playerPos;
    const distanceOnPath = totalDistance * pathLength;
    
    // If position exceeds path length, keep it at the end of the path
    return pathRef.current.getPointAtLength(Math.min(distanceOnPath, pathLength));
  };

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <h1 className="text-9xl font-bold text-white animate-ping">{countdown}</h1>
        </div>
      )}
      {countdown === 0 && gamePhase === 'countdown' && (
         <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <h1 className="text-9xl font-bold text-white animate-pulse">BAŞLA!</h1>
        </div>
      )}
      <svg viewBox={TRACK_SVG_VIEWBOX} className="w-full h-full max-w-5xl max-h-[90vh] drop-shadow-2xl">
        <path
          ref={pathRef}
          d={TRACK_PATH}
          stroke={TRACK_COLOR}
          strokeWidth={TRACK_STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Başlangıç/Bitiş Çizgisi - Yeni pistin başlangıç noktasına (100,300) göre ayarlandı */}
        <line x1="100" y1="270" x2="100" y2="330" stroke="white" strokeWidth="5" strokeDasharray="10,5" />
        <Flag x="60" y="260" size={28} color="white" />

        {/* Virajlar (Checkpoints) */}
        {checkpoints.map(cp => (
          <Zap key={cp.id} x={cp.x} y={cp.y} size={24} color="hsl(var(--primary))" fill="hsl(var(--primary))" className="opacity-80" />
        ))}
        
        {/* Arabalar */}
        {players.map(player => {
          if (!player.isReady) return null; // Don't render players who aren't ready
          
          const pos = getCarPosition(player.position);
          
          // If path isn't loaded yet, show car at start of track
          if(pos.x === 0 && pos.y === 0 && player.position === 0 && pathRef.current && pathLength > 0) {
             const initialPoint = pathRef.current.getPointAtLength(0);
             if(initialPoint) {
                pos.x = initialPoint.x;
                pos.y = initialPoint.y;
             }
          }
          
          // Highlight current player's car
          const isCurrentPlayer = player.id === currentPlayerId;
          const strokeWidth = isCurrentPlayer ? 3 : 2;
          const strokeColor = isCurrentPlayer ? "white" : "rgba(255,255,255,0.7)";
          
          return (
            <g key={player.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle 
                r={isCurrentPlayer ? CAR_RADIUS + 2 : CAR_RADIUS} 
                fill={player.color} 
                stroke={strokeColor} 
                strokeWidth={strokeWidth} 
              />
              <text
                x="0"
                y={CAR_RADIUS + 12} 
                textAnchor="middle"
                fontSize="10"
                fill={player.color}
                stroke="black"
                strokeWidth="0.3px"
                paintOrder="stroke"
                className={`font-semibold ${isCurrentPlayer ? 'font-bold' : ''}`}
              >
                {player.name}
                {isCurrentPlayer ? ' (Sen)' : ''}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-4 left-4 p-2 bg-background/70 rounded-md border">
        <h3 className="font-semibold mb-1">Yarışçılar:</h3>
        {players
          .filter(p => p.isReady)
          .map(p => (
            <div key={p.id} className="text-sm">
              <span 
                style={{color: p.color}} 
                className={`font-bold ${p.id === currentPlayerId ? 'text-primary' : ''}`}
              >
                {p.name} {p.id === currentPlayerId ? '(Sen)' : ''}
              </span>
              : İlerleme: {(p.position * 100).toFixed(0)}%
            </div>
          ))}
      </div>
    </div>
  );
}