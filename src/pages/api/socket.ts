import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, GamePhase } from '@/types';

// Extend HTTPServer type to include io property
declare module 'http' {
  interface Server {
    io?: SocketIOServer;
  }
}

type GameState = {
  phase: GamePhase;
  players: Record<string, Player>;
  readyPlayersCount: number;
  countdown: number | null;
  raceStartTime: number | null;
};

let io: SocketIOServer | undefined;

const gameState: GameState = {
  phase: 'lobby',
  players: {},
  readyPlayersCount: 0,
  countdown: null,
  raceStartTime: null
};

function safeEmit<T extends any[]>(io: SocketIOServer | undefined, event: string, ...args: T) {
  if (io) {
    io.emit(event, ...args);
  }
}

function startRaceLoop(socketServer: SocketIOServer) {
  let lastUpdateTime = Date.now();
  const gameLoop = setInterval(() => {
    if (gameState.phase !== 'racing') {
      clearInterval(gameLoop);
      return;
    }
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTime) / 1000;
    lastUpdateTime = currentTime;
    let allFinished = true;
    Object.entries(gameState.players).forEach(([playerId, player]) => {
      if (player.isReady && player.finishTime === null) {
        allFinished = false;
        player.position += player.speed * deltaTime;
        if (player.position >= 1 && gameState.raceStartTime) {
          player.position = 1;
          player.finishTime = currentTime - gameState.raceStartTime;
          safeEmit(socketServer, 'player_finished', {
            playerId: player.id,
            playerName: player.name,
            finishTime: player.finishTime
          });
        }
      }
    });
    if (allFinished) {
      gameState.phase = 'results';
      const finishedPlayers = Object.values(gameState.players)
        .filter((p): p is Player & { finishTime: number } => p.isReady && typeof p.finishTime === 'number')
        .sort((a, b) => a.finishTime - b.finishTime);
      finishedPlayers.forEach((player, index) => {
        if (player.id in gameState.players) {
          gameState.players[player.id].rank = index + 1;
        }
      });
      clearInterval(gameLoop);
    }
    safeEmit(socketServer, 'game_state_update', gameState);
  }, 1000 / 60);
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
  // Ensure res.socket and res.socket.server exist
  const server = (res.socket as any)?.server as HTTPServer | undefined;
  if (!server) {
    res.status(500).end('No server available');
    return;
  }
  if (!server.io) {
    const socketServer = new SocketIOServer(server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    server.io = socketServer;
    io = socketServer;
    socketServer.on('connection', (socket) => {
      // Player join
      socket.on('player_join', (playerSetup) => {
        gameState.players[socket.id] = {
          id: socket.id,
          name: playerSetup.name,
          color: playerSetup.color,
          speed: 0,
          position: 0,
          lap: 1,
          finishTime: null,
          rank: undefined,
          lastCheckpointPassed: 0,
          isReady: playerSetup.isReady || false
        };
        if (playerSetup.isReady) {
          gameState.readyPlayersCount++;
        }
        safeEmit(socketServer, 'game_state_update', gameState);
      });
      // Player ready
      socket.on('player_ready', (isReady) => {
        if (gameState.players[socket.id]) {
          const wasReady = gameState.players[socket.id].isReady;
          gameState.players[socket.id].isReady = isReady;
          if (!wasReady && isReady) {
            gameState.readyPlayersCount++;
          } else if (wasReady && !isReady) {
            gameState.readyPlayersCount--;
          }
          if (gameState.readyPlayersCount >= 3 && gameState.phase === 'lobby') {
            gameState.phase = 'countdown';
            gameState.countdown = 3;
            safeEmit(socketServer, 'game_state_update', gameState);
            let count = 3;
            const countdownInterval = setInterval(() => {
              count--;
              gameState.countdown = count;
              safeEmit(socketServer, 'game_state_update', gameState);
              if (count <= 0) {
                clearInterval(countdownInterval);
                gameState.phase = 'racing';
                gameState.raceStartTime = Date.now();
                Object.values(gameState.players).forEach(player => {
                  if (player.isReady) {
                    player.speed = Math.random() * (0.045 - 0.025) + 0.025;
                  }
                });
                safeEmit(socketServer, 'game_state_update', gameState);
                startRaceLoop(socketServer);
              }
            }, 1000);
          } else {
            safeEmit(socketServer, 'game_state_update', gameState);
          }
        }
      });
      // Player checkpoint
      socket.on('checkpoint_passed', (checkpointId) => {
        if (gameState.players[socket.id] && gameState.phase === 'racing') {
          gameState.players[socket.id].lastCheckpointPassed = checkpointId;
          gameState.players[socket.id].speed = Math.random() * (0.045 - 0.025) + 0.025;
          safeEmit(socketServer, 'player_checkpoint', {
            playerId: socket.id,
            playerName: gameState.players[socket.id].name,
            checkpointId: checkpointId
          });
          safeEmit(socketServer, 'game_state_update', gameState);
        }
      });
      // Player finish
      socket.on('player_finish', () => {
        if (gameState.players[socket.id] && gameState.phase === 'racing' && !gameState.players[socket.id].finishTime && gameState.raceStartTime) {
          gameState.players[socket.id].finishTime = Date.now() - gameState.raceStartTime;
          let allFinished = true;
          let finishedPlayers: (Player & { finishTime: number })[] = [];
          Object.values(gameState.players).forEach(player => {
            if (player.isReady) {
              if (typeof player.finishTime === 'number') {
                finishedPlayers.push(player as Player & { finishTime: number });
              } else {
                allFinished = false;
              }
            }
          });
          finishedPlayers.sort((a, b) => a.finishTime - b.finishTime);
          finishedPlayers.forEach((player, index) => {
            if (player.id in gameState.players) {
              gameState.players[player.id].rank = index + 1;
            }
          });
          if (allFinished) {
            gameState.phase = 'results';
          }
          safeEmit(socketServer, 'game_state_update', gameState);
          safeEmit(socketServer, 'player_finished', {
            playerId: socket.id,
            playerName: gameState.players[socket.id].name,
            finishTime: gameState.players[socket.id].finishTime
          });
        }
      });
      // Restart game
      socket.on('restart_game', () => {
        Object.keys(gameState.players).forEach(playerId => {
          const player = gameState.players[playerId];
          player.speed = 0;
          player.position = 0;
          player.lap = 1;
          player.finishTime = null;
          player.rank = undefined;
          player.lastCheckpointPassed = 0;
        });
        gameState.phase = 'lobby';
        gameState.readyPlayersCount = 0;
        gameState.countdown = null;
        gameState.raceStartTime = null;
        safeEmit(socketServer, 'game_reset');
        safeEmit(socketServer, 'game_state_update', gameState);
      });
      // Disconnect
      socket.on('disconnect', () => {
        if (gameState.players[socket.id]) {
          if (gameState.players[socket.id].isReady) {
            gameState.readyPlayersCount--;
          }
          delete gameState.players[socket.id];
          if (gameState.phase === 'lobby' && gameState.readyPlayersCount < 3) {
            gameState.phase = 'lobby';
            gameState.countdown = null;
            gameState.raceStartTime = null;
          }
          safeEmit(socketServer, 'game_state_update', gameState);
        }
      });
    });
    console.log('Socket.io server initialized');
  }
  res.end();
};

export default SocketHandler; 