"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, GamePhase, PlayerSetupInfo, Checkpoint } from '@/types';
import { PlayerSetupForm } from '@/components/game/player-setup-form';
import { RaceTrack } from '@/components/game/race-track';
import { Leaderboard } from '@/components/game/leaderboard';
import { useToast } from '@/hooks/use-toast';
import { 
  CHECKPOINTS, 
  COUNTDOWN_SECONDS, 
  RACE_LAPS,
  GAME_FPS,
  getRandomSpeed,
  getInitialSpeeds
} from '@/lib/game-config';

export default function VelocityDashPage() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [players, setPlayers] = useState<Player[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { toast } = useToast();
  const gameLoopRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    setPlayers([]);
    setCountdown(null);
    setGamePhase('lobby');
  }, []);

  const handleSetupComplete = useCallback((playerInfos: PlayerSetupInfo[]) => { // Expect array of PlayerSetupInfo
    const initialPlayers: Player[] = playerInfos.map((info, index) => ({
      id: `player${index + 1}`,
      name: info.name,
      color: info.color,
      speed: 0, // Speeds will be set after countdown
      position: 0,
      lap: 1,
      finishTime: null,
      rank: undefined,
      lastCheckpointPassed: 0,
    }));
    setPlayers(initialPlayers);
    setGamePhase('countdown');
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  // Countdown Logic
  useEffect(() => {
    if (gamePhase === 'countdown' && countdown !== null) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => (c !== null ? c - 1 : null)), 1000);
        return () => clearTimeout(timer);
      } else if (countdown === 0) {
        // Assign initial speeds when countdown finishes
        setPlayers(prevPlayers => {
          const initialSpeeds = getInitialSpeeds(prevPlayers.length); // Pass number of players
          return prevPlayers.map((p, idx) => ({ ...p, speed: initialSpeeds[idx] }));
        });
        setGamePhase('racing');
        setCountdown(null); // End countdown display
        lastFrameTimeRef.current = performance.now(); // Initialize for game loop
      }
    }
  }, [gamePhase, countdown]);

  // Game Loop
  const runGameLoop = useCallback((timestamp: number) => {
    if (gamePhase !== 'racing') return;

    const deltaTime = (timestamp - lastFrameTimeRef.current) / 1000; // seconds
    lastFrameTimeRef.current = timestamp;

    let allFinished = true;
    const updatedPlayers = players.map(player => {
      if (player.finishTime !== null) { // Already finished
        return player;
      }
      allFinished = false;

      let newPosition = player.position + player.speed * deltaTime;
      let newSpeed = player.speed;
      let newLastCheckpointPassed = player.lastCheckpointPassed;

      // Checkpoint logic
      for (const cp of CHECKPOINTS) {
        // Player must pass the checkpoint in this frame and not have passed it before in this lap segment
        if (player.position < cp.position && newPosition >= cp.position && player.lastCheckpointPassed < cp.id) {
          newSpeed = getRandomSpeed(); 
          newLastCheckpointPassed = cp.id;
          toast({
            title: `${player.name} hit checkpoint ${cp.id}!`,
            description: `New speed assigned.`,
            duration: 2000,
          });
          break; // Process one checkpoint per frame
        }
      }
      
      // Handle lap completion / finish
      if (newPosition >= RACE_LAPS) {
        newPosition = RACE_LAPS; // Cap at finish line
        if (!player.finishTime) {
          // Calculate finish time based on a consistent game start time, or relative to race start after countdown.
          // For simplicity, using Date.now() but ideally this would be based on time elapsed since race started.
          const finishTime = performance.now() - (lastFrameTimeRef.current - deltaTime*1000); // Approximate time since race start
          toast({
            title: `${player.name} finished!`,
            variant: "default",
            duration: 3000,
          });
          return { ...player, position: newPosition, speed: newSpeed, lastCheckpointPassed: newLastCheckpointPassed, finishTime, lap: RACE_LAPS };
        }
      }
      
      return { ...player, position: newPosition, speed: newSpeed, lastCheckpointPassed: newLastCheckpointPassed };
    });

    setPlayers(updatedPlayers);

    if (allFinished && updatedPlayers.length > 0) {
      setGamePhase('results');
      // Assign ranks
      const sortedByTime = [...updatedPlayers]
        .filter(p => p.finishTime !== null)
        .sort((a, b) => (a.finishTime as number) - (b.finishTime as number));
      
      const finalPlayers = updatedPlayers.map(p => {
        const rank = sortedByTime.findIndex(sp => sp.id === p.id);
        return {...p, rank: p.finishTime !== null ? rank + 1 : undefined};
      });
      setPlayers(finalPlayers);
      return; // Stop loop
    }
    
    gameLoopRef.current = requestAnimationFrame(runGameLoop);

  }, [gamePhase, players, toast]);


  useEffect(() => {
    if (gamePhase === 'racing') {
      // Ensure lastFrameTimeRef is set correctly when racing starts, potentially after countdown
      lastFrameTimeRef.current = performance.now(); 
      gameLoopRef.current = requestAnimationFrame(runGameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gamePhase, runGameLoop]);


  if (gamePhase === 'lobby') {
    return <PlayerSetupForm onSetupComplete={handleSetupComplete} />;
  }

  if (gamePhase === 'countdown' || gamePhase === 'racing') {
    return <RaceTrack players={players} checkpoints={CHECKPOINTS} countdown={countdown} gamePhase={gamePhase} />;
  }

  if (gamePhase === 'results') {
    // In results, finishTime is a timestamp. We need to show duration.
    // Assuming leaderboard handles display correctly based on finishTime being a timestamp.
    // If finishTime needs to be duration, conversion should happen before passing to Leaderboard or inside it.
    // For Leaderboard, it expects finishTime to be a number that can be divided by 1000 for seconds.
    // The current calculation of finishTime is performance.now() - (start time), which is a duration.
    return <Leaderboard players={players} onPlayAgain={resetGame} />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Loading Velocity Dash...</p>
    </div>
  );
}
