/**
 * Event handlers para WebSocket
 * Gerencia lobby, jogo, apostas e timers
 */

import { LobbyManager } from '../state/lobbyManager.js';
import { GameManager } from '../state/gameManager.js';
import { BettingManager } from '../state/matchManager.js';

// Instâncias globais
const lobbyManager = new LobbyManager();
const gameManager = new GameManager();
const bettingManager = new BettingManager();

// Timer tracking
const turnTimers = new Map(); // gameId -> timeoutId
const stateUpdateIntervals = new Map(); // gameId -> intervalId

export const handleConnectionEvents = (io, socket) => {
  console.log(`[${socket.id}] Connected`);

  // ========== LOBBY EVENTS ==========

  /**
   * Player entrar na lobby (esperar por oponente)
   * payload: { userId, name, gameType: '3'|'9', betAmount: 2 }
   */
  socket.on('lobby:join', (payload) => {
    console.log(`[${socket.id}] Joining lobby:`, payload);

    const { userId, name, gameType, betAmount } = payload;
    if (!userId || !gameType || betAmount === undefined) {
      socket.emit('error', {
        message: 'Invalid payload for lobby:join',
      });
      return;
    }

    try {
      // Player entra no lobby
      const result = lobbyManager.joinLobby(
        userId,
        name,
        socket.id,
        gameType,
        betAmount
      );

      socket.join(`lobby_${gameType}_${betAmount}`);
      socket.data.userId = userId;
      socket.data.gameType = gameType;
      socket.data.betAmount = betAmount;

      if (result.status === 'waiting') {
        // Primeiro player a esperar
        socket.emit('lobby:waiting', {
          lobbyId: result.lobbyId,
          message: 'Waiting for opponent...',
        });

        // Notificar outros players na lobby que há uma vaga
        socket
          .to(`lobby_${gameType}_${betAmount}`)
          .emit('lobby:available', {
            lobbyId: result.lobbyId,
          });
      } else if (result.status === 'ready') {
        // 2º player chegou - jogo pronto!
        const lobby = result.lobby;

        // Criar Match (série de jogos)
        const match = bettingManager.createMatch(
          lobby.player1,
          lobby.player2,
          betAmount
        );

        // Criar primeiro Game
        const gameId = `game_${lobby.id}_1`;
        const game = gameManager.startGame(
          gameId,
          lobby.player1,
          lobby.player2,
          gameType,
          betAmount,
          match.id // Pass matchId
        );

        bettingManager.linkGameToMatch(gameId, match.id);

        // Remover lobby do Map já que o jogo começou
        lobbyManager.removeLobby(lobby.id);

        // Join both players to game room for synchronized state updates and reconnections
        io.sockets.sockets.get(lobby.player1.socketId)?.join(`game_${gameId}`);
        io.sockets.sockets.get(lobby.player2.socketId)?.join(`game_${gameId}`);
        console.log(`[Game] Both players joined room: game_${gameId}`);

        // Notificar ambos players
        const gameStatePayload = gameManager.getGameState(gameId);
        console.log(
          `[Lobby] Emitting game:start to player1 (${lobby.player1.socketId}):`,
          { gameId, matchId: match.id, gameState: gameStatePayload }
        );

        io.to(lobby.player1.socketId).emit('game:start', {
          gameId,
          matchId: match.id,
          gameState: gameStatePayload,
          opponentUserId: lobby.player2.userId,
          betAmount,
          gameType,
        });

        io.to(lobby.player2.socketId).emit('game:start', {
          gameId,
          matchId: match.id,
          gameState: gameStatePayload,
          opponentUserId: lobby.player1.userId,
          betAmount,
          gameType,
        });

        // Iniciar timer para o primeiro player
        const firstPlayer = game.currentPlayer;
        if (firstPlayer === 'player1') {
          startTurnTimer(io, gameId, lobby.player1.socketId);
        } else {
          startTurnTimer(io, gameId, lobby.player2.socketId);
        }

        console.log(`[Lobby] Game started: ${gameId}, Match: ${match.id}`);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  /**
   * Player sair da lobby
   */
  socket.on('lobby:leave', (payload = {}) => {
    console.log(`[${socket.id}] Leaving lobby`, payload);

    const userId = socket.data.userId;
    if (!userId) return;

    try {
      const result = lobbyManager.leaveLobby(userId);
      socket.emit('lobby:left', result);
      
      // Não notificar outros jogadores: procura é isolada e silenciosa
      
      socket.leave(
        `lobby_${socket.data.gameType}_${socket.data.betAmount}`
      );
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // ========== GAME EVENTS ==========

  /**
   * Cliente pede estado atual do jogo (re-sync, não reconexão)
   * payload: { gameId }
   */
  socket.on('game:request_state', (payload) => {
    const { gameId } = payload || {}
    if (!gameId) {
      socket.emit('game:error', { message: 'Missing gameId in request_state' })
      return
    }

    const state = gameManager.getGameState(gameId)
    if (!state) {
      socket.emit('game:error', { message: `Game ${gameId} not found` })
      return
    }

    socket.emit('game:state_update', state)
  })

  /**
   * Player jogar uma carta
   * payload: { gameId, cardId }
   */
  socket.on('game:play_card', (payload) => {
    const { gameId, cardId } = payload;
    const userId = socket.data.userId;

    console.log(
      `[${socket.id}] Playing card: ${cardId} in game ${gameId}`
    );

    try {
      const result = gameManager.playCard(gameId, userId, cardId);

      if (result.status === 'success') {
        const gameState = result.gameState;
        const game = gameManager.getGame(gameId);

        // Encontrar IDs dos players
        const player1Socket = game.player1.socketId;
        const player2Socket = game.player2.socketId;

        // Enviar estado imediatamente para mostrar as cartas na mesa
        io.to(player1Socket)
          .to(player2Socket)
          .emit('game:state_update', gameState);

        // Se há 2 cartas na mesa (trick completo), adicionar delay antes de resolver
        if (gameState.table && gameState.table.length === 2) {
          // Emit a trick_complete event to show both cards briefly
          io.to(player1Socket)
            .to(player2Socket)
            .emit('game:trick_complete', {
              table: gameState.table,
              message: 'Resolving trick...'
            });

          // Wait 2 seconds so players can see both cards
          setTimeout(() => {
            // NOW resolve the trick after cards were visible
            console.log(`[game:play_card] Resolving trick for game ${gameId} after delay`);
            const resolveResult = gameManager.resolveTrickDelayed(gameId);
            console.log(`[game:play_card] Resolve result:`, resolveResult.status, 'Table length:', resolveResult.gameState?.table?.length);
            
            if (resolveResult.status === 'game_finished') {
              // Game ended after this trick
              const finalGameState = resolveResult.gameState;
              console.log(`[game:play_card] Game finished! Emitting final state with table length:`, finalGameState.table.length);
              io.to(player1Socket)
                .to(player2Socket)
                .emit('game:state_update', finalGameState);
              
              setTimeout(() => {
                handleGameEnd(io, gameId);
              }, 500);
            } else if (resolveResult.status === 'success') {
              // Get updated state after trick is resolved
              const updatedGameState = resolveResult.gameState;
              console.log(`[game:play_card] Trick resolved successfully. Emitting state with table length:`, updatedGameState.table.length);
              
              // Send updated state after trick resolution
              io.to(player1Socket)
                .to(player2Socket)
                .emit('game:state_update', updatedGameState);

              // Ajustar timer para o próximo player
              clearTimeout(turnTimers.get(gameId));
              const game = gameManager.getGame(gameId);
              const nextPlayer = game.currentPlayer;
              const nextPlayerSocket =
                nextPlayer === 'player1' ? player1Socket : player2Socket;
              startTurnTimer(io, gameId, nextPlayerSocket);
            }
          }, 2000); // 2 second delay to show both cards
        } else {
          // Only one card played, just update timer for next player
          clearTimeout(turnTimers.get(gameId));
          const nextPlayer = game.currentPlayer;
          const nextPlayerSocket =
            nextPlayer === 'player1' ? player1Socket : player2Socket;
          startTurnTimer(io, gameId, nextPlayerSocket);
        }
      } else if (result.status === 'timeout') {
        // Player perdeu por timeout
        handlePlayerTimeout(io, gameId, userId);
      } else {
        socket.emit('game:error', {
          message: result.message,
        });
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  /**
   * Player desistir do jogo
   */
  socket.on('game:surrender', (payload) => {
    const { gameId } = payload;
    const userId = socket.data.userId;

    console.log(`[${socket.id}] Surrendering from game ${gameId}`);

    try {
      const result = gameManager.surrender(gameId, userId);

      if (result.status === 'surrendered') {
        const game = gameManager.getGame(gameId);
        const match = bettingManager.getMatchForGame(gameId);

        // Registrar resultado na partida
        if (match) {
          const winner = result.winner.userId === game.player1.userId ? 'player1' : 'player2';
          bettingManager.recordSurrender(match.id, userId);
        }

        // Notificar ambos players
        io.to(`game_${gameId}`)
          .emit('game:surrendered', {
            gameId,
            surrenderedBy: userId,
            winner: result.winner.userId,
          });

        clearTimeout(turnTimers.get(gameId));
        handleGameEnd(io, gameId);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  /**
   * Player desconectar (contar como desistência)
   */
  socket.on('disconnect', () => {
    console.log(`[${socket.id}] Disconnected`);

    const userId = socket.data.userId;
    if (!userId) return;

    // Se player estava em lobby
    const lobby = lobbyManager.getPlayerLobby(userId);
    if (lobby) {
      lobbyManager.leaveLobby(userId);
      
      // Não notificar outros jogadores sobre desconexão na procura
      
      console.log(`[Lobby] Player ${userId} left lobby due to disconnect`);
    }

    // Se player estava em game
    const game = gameManager.getPlayerGame(userId);
    if (game) {
      // Player perdeu por desconexão
      handlePlayerDisconnect(io, game.id, userId);
      console.log(`[Game] Player ${userId} disconnected from game`);
    }
  });
};

/**
 * Iniciar timer de turno (20 segundos)
 */
function startTurnTimer(io, gameId, playerSocketId) {
  const game = gameManager.getGame(gameId);
  if (!game) return;

  // Limpar intervalo anterior se existir
  if (stateUpdateIntervals.has(gameId)) {
    clearInterval(stateUpdateIntervals.get(gameId));
  }

  const timeoutId = setTimeout(() => {
    const timeoutCheck = gameManager.checkTurnTimeout(gameId);
    if (timeoutCheck) {
      console.log(`[Game] ${gameId} - Timeout by player`);

      // Limpar intervalo
      if (stateUpdateIntervals.has(gameId)) {
        clearInterval(stateUpdateIntervals.get(gameId));
        stateUpdateIntervals.delete(gameId);
      }

      // Notificar ambos
      io.to(`game_${gameId}`)
        .emit('game:timeout', {
          gameId,
          winner: timeoutCheck.winner.userId,
          loser: timeoutCheck.loser.userId,
        });

      handleGameEnd(io, gameId);
    }
  }, game.turnTimeLimit);

  turnTimers.set(gameId, timeoutId);

  // Enviar atualizações de estado a cada 500ms para manter o timer sincronizado
  const stateInterval = setInterval(() => {
    const gameState = gameManager.getGameState(gameId);
    if (gameState) {
      // Broadcast to all sockets in the game room (handles reconnections automatically)
      io.to(`game_${gameId}`)
        .emit('game:state_update', gameState);
    }
  }, 500);

  stateUpdateIntervals.set(gameId, stateInterval);
}

/**
 * Processar timeout do player
 */
function handlePlayerTimeout(io, gameId, userId) {
  const game = gameManager.getGame(gameId);
  if (!game) return;

  gameManager.surrender(gameId, userId);

  io.to(`game_${gameId}`)
    .emit('game:timeout', {
      gameId,
      timedOutUserId: userId,
    });

  clearTimeout(turnTimers.get(gameId));
  handleGameEnd(io, gameId);
}

/**
 * Processar desconexão de player: contar como desistência
 */
function handlePlayerDisconnect(io, gameId, userId) {
  const game = gameManager.getGame(gameId);
  if (!game) return;

  // Determinar vencedor (o outro player)
  const winnerKey = game.player1.userId === userId ? 'player2' : 'player1';
  const loserKey = game.player1.userId === userId ? 'player1' : 'player2';

  // Atribuir todas as cartas restantes ao vencedor
  if (typeof game.engine.awardRemainingTo === 'function') {
    game.engine.awardRemainingTo(winnerKey);
  }

  // Atualizar scores
  const state = game.engine.getState();
  game.player1.score = state.scores.player1;
  game.player2.score = state.scores.player2;
  game.winner = winnerKey;
  game.status = 'finished';
  game.endedAt = Date.now();

  // Notificar ambos players sobre a desconexão e resultado
  io.to(`game_${gameId}`).emit('game:opponent_disconnected', {
    gameId,
    disconnectedUserId: userId,
    winner: game[winnerKey].userId,
  });

  // Limpar timers
  if (turnTimers.has(gameId)) {
    clearTimeout(turnTimers.get(gameId));
    turnTimers.delete(gameId);
  }
  if (stateUpdateIntervals.has(gameId)) {
    clearInterval(stateUpdateIntervals.get(gameId));
    stateUpdateIntervals.delete(gameId);
  }

  // Finalizar o jogo normalmente (salvar na DB, etc)
  handleGameEnd(io, gameId);
}

/**
 * Save game to database and update game object with database ID
 */
async function saveGameToDatabase(game) {
  const API_BASE_URL = process.env.API_URL || 'http://localhost:8000/api';
  
  const isDraw = game.player1.score === game.player2.score;
  
  // Determine winner and loser based on scores
  let winnerUserId = null;
  let loserUserId = null;
  
  if (!isDraw) {
    if (game.player1.score > game.player2.score) {
      winnerUserId = game.player1.userId;
      loserUserId = game.player2.userId;
    } else {
      winnerUserId = game.player2.userId;
      loserUserId = game.player1.userId;
    }
  }
  
  const gameData = {
    type: game.gameType,
    player1_user_id: game.player1.userId,
    player2_user_id: game.player2.userId,
    is_draw: isDraw,
    winner_user_id: winnerUserId,
    loser_user_id: loserUserId,
    match_id: game.matchId || null,
    status: 'Ended',
    began_at: new Date(game.startedAt).toISOString(),
    ended_at: new Date(game.endedAt).toISOString(),
    total_time: (game.endedAt - game.startedAt) / 1000, // in seconds
    player1_points: game.player1.score,
    player2_points: game.player2.score,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(gameData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to save game to database:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('Game saved to database:', result);
    
    // Store the database game ID in the game object
    if (result.data && result.data.id) {
      game.dbGameId = result.data.id;
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving game to database:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Processar fim de jogo
 */
async function handleGameEnd(io, gameId) {
  const game = gameManager.getGame(gameId);
  if (!game) return;

  // Limpar timers e intervalos
  if (turnTimers.has(gameId)) {
    clearTimeout(turnTimers.get(gameId));
    turnTimers.delete(gameId);
  }
  if (stateUpdateIntervals.has(gameId)) {
    clearInterval(stateUpdateIntervals.get(gameId));
    stateUpdateIntervals.delete(gameId);
  }

  // Save game to database
  const saveResult = await saveGameToDatabase(game);
  
  // Save all tricks to database if game was saved successfully
  if (saveResult.success && game.dbGameId && game.tricksToSave && game.tricksToSave.length > 0) {
    await gameManager.saveTricksToDatabase(game.dbGameId, game.tricksToSave);
  }

  const match = bettingManager.getMatchForGame(gameId);
  
  // Only emit game:ended if there's NO match (standalone game)
  // If there's a match, match:game_result will handle the UI
  if (!match) {
    const winnerPlayer = game.winner === 'player1' ? game.player1 : game.player2;
    const isDraw = game.player1.score === game.player2.score;
    
    io.to(`game_${gameId}`)
      .emit('game:ended', {
        gameId,
        winner: winnerPlayer,
        isDraw,
        scores: {
          player1: game.player1.score,
          player2: game.player2.score,
        },
        player1: game.player1,
        player2: game.player2,
        gameSaved: saveResult.success,
        dbGameId: game.dbGameId,
      });
  }

  if (match) {
    const winner = game.winner === 'player1' ? 'player1' : 'player2';
    const scores = {
      player1: game.player1.score,
      player2: game.player2.score,
    };

    const matchResult = bettingManager.recordGameResult(
      match.id,
      gameId,
      winner,
      scores
    );

    // Notificar resultado do match
    io.to(`game_${gameId}`)
      .emit('match:game_result', {
        gameId,
        winner: game[winner],
        scores,
        match: matchResult.match,
      });

    // Se match acabou
    if (matchResult.match.status === 'finished') {
      io.to(`game_${gameId}`)
        .emit('match:finished', {
          matchId: match.id,
          winner: matchResult.match.winner,
          totalCoinsWon: matchResult.winnerCoins,
          totalBet: matchResult.totalBet,
          match: matchResult.match,
        });
    }
  }

  gameManager.removeGame(gameId);
  clearTimeout(turnTimers.get(gameId));
}
