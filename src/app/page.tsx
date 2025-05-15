"use client";

import { useState, useEffect } from 'react';
import type { PlayerSetupInfo } from '@/types';
import { PlayerSetupForm } from '@/components/game/player-setup-form';
import { RaceTrack } from '@/components/game/race-track';
import { Leaderboard } from '@/components/game/leaderboard';
import { useToast } from '@/hooks/use-toast';
import { CHECKPOINTS } from '@/lib/game-config';
import dynamic from 'next/dynamic';

// Client tarafı SocketProvider bileşenini yükle
const ClientSideSocketProvider = dynamic(
  () => import('@/components/socket-provider').then((mod) => ({ default: mod.SocketProvider })),
  { ssr: false }
);

// Client tarafı Socket hook'unu yükle
const useClientSocket = () => {
  // Client tarafında olup olmadığımızı kontrol et
  if (typeof window === 'undefined') {
    // Sunucu tarafında varsayılan değerler dön
    return {
      socket: null,
      isConnected: false,
      gameState: {
        phase: 'lobby',
        players: {},
        readyPlayersCount: 0,
        countdown: null,
        raceStartTime: null
      },
      registerPlayer: () => {},
      setPlayerReady: () => {},
      passCheckpoint: () => {},
      playerFinish: () => {},
      restartGame: () => {},
      getCurrentPlayerId: () => null,
    };
  }
  
  // Client tarafında ise useSocket hook'unu dinamik olarak import et ve kullan
  const { useSocket } = require('@/components/socket-provider');
  return useSocket();
};

export default function VelocityDashPage() {
  // Sayfanın client tarafında render edildiğinden emin ol
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Eğer client tarafında değilsek, yükleniyor görünümü göster
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Velocity Dash Yükleniyor...</p>
      </div>
    );
  }
  
  return (
    <ClientSideSocketProvider>
      <GameContent />
    </ClientSideSocketProvider>
  );
}

// Client tarafında render edilecek oyun içeriği
function GameContent() {
  const { toast } = useToast();
  const {
    gameState,
    registerPlayer,
    setPlayerReady,
    passCheckpoint,
    playerFinish,
    restartGame,
    getCurrentPlayerId,
  } = useClientSocket();
  
  const [localPlayerSetup, setLocalPlayerSetup] = useState<PlayerSetupInfo | null>(null);
  
  // Toast olaylarını dinle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Socket.io-client'ı dinamik olarak import et
      const initEvents = async () => {
        try {
          const socket = (await import('socket.io-client')).io();
          
          // Checkpoint geçişlerini dinle
          socket.on('player_checkpoint', ({ playerName, checkpointId }) => {
            toast({
              title: `${playerName} viraj ${checkpointId}'i geçti!`,
              description: 'Yeni hız atandı.',
              duration: 2000,
            });
          });
          
          // Yarış bitişlerini dinle
          socket.on('player_finished', ({ playerName, finishTime }) => {
            toast({
              title: `${playerName} yarışı bitirdi!`,
              description: `Süre: ${(finishTime / 1000).toFixed(2)} saniye`,
              variant: 'default',
              duration: 3000,
            });
          });
          
          // Oyun sıfırlamayı dinle
          socket.on('game_reset', () => {
            setLocalPlayerSetup(null);
          });
        } catch (error) {
          console.error('Failed to initialize socket events:', error);
        }
      };
      
      initEvents();
    }
  }, [toast]);
  
  // Oyuncu kurulumunu işle
  const handlePlayerSetup = (playerInfo: PlayerSetupInfo) => {
    setLocalPlayerSetup(playerInfo);
    registerPlayer(playerInfo);
  };
  
  // Hazır durumunu işle
  const handlePlayerReady = (isReady: boolean) => {
    if (localPlayerSetup) {
      setLocalPlayerSetup({
        ...localPlayerSetup,
        isReady
      });
      setPlayerReady(isReady);
    }
  };
  
  // Oyun fazına göre uygun bileşeni göster
  const renderGamePhase = () => {
    const { phase, countdown, players } = gameState;
    const currentPlayerId = getCurrentPlayerId();
    
    // Oyuncular nesnesini diziye dönüştür
    const playersArray = Object.values(players);
    
    switch (phase) {
      case 'lobby':
        // Oyuncu zaten kurulduysa, bekleme ekranını göster
        if (localPlayerSetup) {
          const readyCount = gameState.readyPlayersCount;
          const totalPlayers = Object.keys(gameState.players).length;
          
          return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4 text-primary">Oyuncular Bekleniyor</h1>
                <p className="text-xl mb-6">
                  {readyCount} / {totalPlayers} oyuncu hazır 
                  <span className="text-muted-foreground ml-2">(minimum 3 oyuncu gerekli)</span>
                </p>
                <p className="mb-4">Yarışçılar:</p>
                <div className="flex flex-col gap-2 max-w-md mx-auto">
                  {playersArray.map(player => (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-3 rounded-md border ${
                        player.isReady ? 'border-primary' : 'border-muted'
                      }`}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full mr-3" 
                          style={{ backgroundColor: player.color }}
                        />
                        <span style={{ color: player.color }}>{player.name}</span>
                        {player.id === currentPlayerId && <span className="ml-2">(Sen)</span>}
                      </div>
                      <span className={player.isReady ? 'text-primary' : 'text-muted-foreground'}>
                        {player.isReady ? 'Hazır' : 'Bekliyor'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {currentPlayerId && (
                <button 
                  className={`px-6 py-3 rounded-md font-bold text-white transition-colors ${
                    localPlayerSetup?.isReady 
                      ? 'bg-destructive hover:bg-destructive/90' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                  onClick={() => handlePlayerReady(!localPlayerSetup?.isReady)}
                >
                  {localPlayerSetup?.isReady ? 'Hazır Değilim' : 'Hazırım'}
                </button>
              )}
            </div>
          );
        }
        
        // Oyuncu henüz kurulmadıysa, kurulum formunu göster
        return <PlayerSetupForm onSetupComplete={handlePlayerSetup} singlePlayer={true} />;
        
      case 'countdown':
      case 'racing':
        return (
          <RaceTrack 
            players={playersArray} 
            checkpoints={CHECKPOINTS} 
            countdown={countdown} 
            gamePhase={phase}
            currentPlayerId={currentPlayerId}
            onCheckpointPassed={passCheckpoint}
            onRaceFinish={playerFinish}
          />
        );
        
      case 'results':
        return <Leaderboard players={playersArray} onPlayAgain={restartGame} />;
        
      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <p>Velocity Dash Yükleniyor...</p>
          </div>
        );
    }
  };

  return renderGamePhase();
}