"use client";

import type { Player, Checkpoint } from '@/types';
import { TRACK_PATH, TRACK_SVG_VIEWBOX, TRACK_COLOR, TRACK_STROKE_WIDTH, CAR_RADIUS } from '@/lib/game-config';
import React, { useRef, useEffect, useState } from 'react';
import { Zap, Flag } from 'lucide-react';

interface RaceTrackProps {
  players: Player[];
  checkpoints: Checkpoint[];
  countdown: number | null; // null if not in countdown
  gamePhase: string;
}

export function RaceTrack({ players, checkpoints, countdown, gamePhase }: RaceTrackProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  const getCarPosition = (playerPos: number) => {
    if (!pathRef.current || pathLength === 0 || playerPos < 0 || playerPos > RACE_LAPS) { // RACE_LAPS for total distance
      return { x: 0, y: 0 }; // Default or initial position
    }
    const distance = (playerPos / RACE_LAPS) * pathLength;
    return pathRef.current.getPointAtLength(Math.min(distance, pathLength)); // Cap distance at pathLength
  };
  
  const RACE_LAPS = 1; // Assuming 1 lap race for now. Can be from game-config

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <h1 className="text-9xl font-bold text-white animate-ping">{countdown}</h1>
        </div>
      )}
      {countdown === 0 && gamePhase === 'countdown' && (
         <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <h1 className="text-9xl font-bold text-white animate-pulse">GO!</h1>
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
        {/* Start/Finish Line */}
        <line x1="100" y1="70" x2="100" y2="130" stroke="white" strokeWidth="5" strokeDasharray="5,5" />
        <Flag x="60" y="40" size={28} color="white" />

        {/* Checkpoints */}
        {checkpoints.map(cp => (
          <Zap key={cp.id} x={cp.x} y={cp.y} size={24} color="hsl(var(--primary))" fill="hsl(var(--primary))" className="opacity-80" />
        ))}
        
        {/* Cars */}
        {players.map(player => {
          const pos = getCarPosition(player.position);
          if(pos.x === 0 && pos.y === 0 && player.position > 0) { // Avoid rendering at 0,0 if path not ready but position started moving
             const initialPoint = pathRef.current?.getPointAtLength(0);
             if(initialPoint) {
                pos.x = initialPoint.x;
                pos.y = initialPoint.y;
             }
          }
          return (
            <g key={player.id} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r={CAR_RADIUS} fill={player.color} stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
              <text
                x="0"
                y={CAR_RADIUS + 12} // Position nickname below the car
                textAnchor="middle"
                fontSize="10"
                fill={player.color}
                stroke="black"
                strokeWidth="0.3px"
                paintOrder="stroke"
                className="font-semibold"
              >
                {player.name}
              </text>
            </g>
          );
        })}
      </svg>
       <div className="absolute bottom-4 left-4 p-2 bg-background/70 rounded-md border">
        {players.map(p => (
          <div key={p.id} className="text-sm">
            <span style={{color: p.color}} className="font-bold">{p.name}</span>: Lap {p.lap}, Pos: {(p.position * 100).toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  );
}
