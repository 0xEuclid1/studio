"use client";

import type { Player } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, RotateCcw } from 'lucide-react';
import { getCurrentPlayerId } from '@/lib/socket-client';

interface LeaderboardProps {
  players: Player[];
  onPlayAgain: () => void;
}

export function Leaderboard({ players, onPlayAgain }: LeaderboardProps) {
  const currentPlayerId = getCurrentPlayerId();
  
  // Filter out players that weren't ready for the race
  const activePlayers = players.filter(player => player.isReady);
  
  // Sort players by rank/finish time
  const sortedPlayers = [...activePlayers].sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.finishTime === null && b.finishTime !== null) return 1; // DNF last
    if (a.finishTime !== null && b.finishTime === null) return -1; // Finished first
    if (a.finishTime && b.finishTime) return a.finishTime - b.finishTime;
    return b.position - a.position; // Fallback to position if times are equal or DNF
  });

  const winner = sortedPlayers.length > 0 && sortedPlayers[0].rank === 1 ? sortedPlayers[0] : null;
  const currentPlayerResult = sortedPlayers.find(player => player.id === currentPlayerId);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Yarış Sonuçları!</CardTitle>
          {winner && (
            <div className="flex flex-col items-center mt-4">
              <Trophy className="w-24 h-24 text-yellow-400" data-ai-hint="trophy celebration" />
              <CardDescription className="text-xl mt-2">
                Kazanan: <span style={{ color: winner.color }} className="font-bold">{winner.name}</span>
                {winner.id === currentPlayerId && <span className="ml-2">(Sen!)</span>}
              </CardDescription>
            </div>
          )}
          
          {currentPlayerResult && (
            <div className="mt-4 p-3 bg-primary/10 rounded-md">
              <h3 className="text-lg font-semibold">Senin Sonucun</h3>
              <p>
                {currentPlayerResult.rank 
                  ? `${currentPlayerResult.rank}. sırada bitirdin!` 
                  : 'Yarışı tamamlayamadın.'}
              </p>
              {currentPlayerResult.finishTime && (
                <p className="text-sm mt-1">
                  Süren: {(currentPlayerResult.finishTime / 1000).toFixed(2)} saniye
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Sıra</TableHead>
                <TableHead>Nickname</TableHead>
                <TableHead className="text-right">Süre (sn)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player, index) => (
                <TableRow 
                  key={player.id} 
                  className={`
                    ${player.rank === 1 ? 'bg-primary/10' : ''}
                    ${player.id === currentPlayerId ? 'font-bold' : ''}
                  `}
                >
                  <TableCell className="font-medium text-center">{player.rank || index + 1}</TableCell>
                  <TableCell 
                    style={{ color: player.color }} 
                    className="font-semibold"
                  >
                    {player.name}
                    {player.id === currentPlayerId && ' (Sen)'}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.finishTime ? (player.finishTime / 1000).toFixed(2) : 'DNF'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-center pt-6">
          <Button onClick={onPlayAgain} size="lg">
            <RotateCcw className="mr-2 h-5 w-5" /> Tekrar Oyna
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}