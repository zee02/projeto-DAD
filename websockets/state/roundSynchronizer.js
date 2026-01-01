/**
 * Sistema de Sincronização de Rondas e Pontos para Multiplayer
 * Emite eventos WebSocket para manter ambos os jogadores sincronizados
 */

import { MatchRoundSystem } from './matchRoundSystem.js'

export class RoundSynchronizer {
  constructor(io) {
    this.io = io; // Socket.io instância
  }

  /**
   * Emitir eventos de fim de ronda para ambos jogadores
   * @param {object} match - Dados da partida
   * @param {object} roundData - Dados da ronda processada
   * @param {string} matchId - ID da partida
   */
  broadcastRoundEnd(match, roundData, matchId) {
    console.log(`[broadcastRoundEnd] Emitting round end event for match ${matchId}`);
    console.log(`[broadcastRoundEnd] RoundData structure:`, roundData);
    
    // Dados para sincronizar
    const syncData = {
      matchId,
      round: roundData,
      currentScore: {
        player1: match.player1.marks,
        player2: match.player2.marks,
      },
      maxWins: match.maxWins,
      timestamp: Date.now(),
    };

    // Emitir para ambos jogadores
    const player1Socket = match.player1.socketId;
    const player2Socket = match.player2.socketId;

    console.log(`[broadcastRoundEnd] Player1 socket: ${player1Socket}, Player2 socket: ${player2Socket}`);

    if (player1Socket) {
      this.io.to(player1Socket).emit('match:round_end', {
        ...syncData,
        perspective: 'player1',
        myScore: roundData.player1.score,
        opponentScore: roundData.player2.score,
        myPoints: roundData.player1.pointsEarned,
        opponentPoints: roundData.player2.pointsEarned,
      });
    }

    if (player2Socket) {
      this.io.to(player2Socket).emit('match:round_end', {
        ...syncData,
        perspective: 'player2',
        myScore: roundData.player2.score,
        opponentScore: roundData.player1.score,
        myPoints: roundData.player2.pointsEarned,
        opponentPoints: roundData.player1.pointsEarned,
      });
    }
  }

  /**
   * Emitir eventos de fim de partida
   * @param {object} match - Dados finais da partida
   * @param {string} matchId - ID da partida
   */
  broadcastMatchEnd(match, matchId) {
    const prizes = MatchRoundSystem.calculateFinalPrizes(match);
    const winner = match.winner === 'player1'
      ? match.player1.userId
      : match.player2.userId;

    // Dados para sincronizar
    const syncData = {
      matchId,
      winner,
      finalScore: {
        player1: match.player1.marks,
        player2: match.player2.marks,
      },
      totalRounds: (match.roundHistory || []).length,
      totalGames: match.games.length,
      totalBet: prizes.totalBet,
      prizesAwarded: {
        player1: prizes.player1Coins,
        player2: prizes.player2Coins,
      },
      timestamp: Date.now(),
    };

    // Emitir para ambos jogadores
    const player1Socket = match.player1.socketId;
    const player2Socket = match.player2.socketId;

    if (player1Socket) {
      this.io.to(player1Socket).emit('match:finished', {
        ...syncData,
        youWon: match.winner === 'player1',
        coinsEarned: prizes.player1Coins,
      });
    }

    if (player2Socket) {
      this.io.to(player2Socket).emit('match:finished', {
        ...syncData,
        youWon: match.winner === 'player2',
        coinsEarned: prizes.player2Coins,
      });
    }
  }

  /**
   * Emitir notificação de baralho acabado e redistribuição
   * @param {string} matchId - ID da partida
   * @param {string} gameType - Tipo de jogo ('3' ou '9')
   */
  broadcastDeckExhausted(match, matchId, gameType) {
    const player1Socket = match.player1.socketId;
    const player2Socket = match.player2.socketId;

    const message = {
      matchId,
      message: `Baralho acabou! Redistribuindo cartas para próxima ronda...`,
      gameType,
      currentScore: {
        player1: match.player1.marks,
        player2: match.player2.marks,
      },
      timestamp: Date.now(),
    };

    if (player1Socket) {
      this.io.to(player1Socket).emit('match:deck_exhausted', message);
    }
    if (player2Socket) {
      this.io.to(player2Socket).emit('match:deck_exhausted', message);
    }
  }

  /**
   * Emitir atualização de pontos da partida em tempo real
   * @param {object} match
   * @param {string} matchId
   */
  broadcastScoreUpdate(match, matchId) {
    const player1Socket = match.player1.socketId;
    const player2Socket = match.player2.socketId;

    const scoreData = {
      matchId,
      player1Marks: match.player1.marks,
      player2Marks: match.player2.marks,
      roundCount: (match.roundHistory || []).length,
      maxWins: match.maxWins,
      timestamp: Date.now(),
    };

    if (player1Socket) {
      this.io.to(player1Socket).emit('match:score_update', scoreData);
    }
    if (player2Socket) {
      this.io.to(player2Socket).emit('match:score_update', scoreData);
    }
  }

  /**
   * Emitir aviso de iminente vitória (ex: um jogador com 3 pontos)
   * @param {object} match
   * @param {string} matchId
   */
  broadcastVictoryWarning(match, matchId) {
    const player1Socket = match.player1.socketId;
    const player2Socket = match.player2.socketId;

    const hasWarning =
      match.player1.marks === match.maxWins - 1 ||
      match.player2.marks === match.maxWins - 1;

    if (!hasWarning) return;

    const warning = {
      matchId,
      player1Marks: match.player1.marks,
      player2Marks: match.player2.marks,
      maxWins: match.maxWins,
      warning:
        match.player1.marks === match.maxWins - 1
          ? 'Player 1 is almost winning!'
          : 'Player 2 is almost winning!',
      timestamp: Date.now(),
    };

    if (player1Socket) {
      this.io.to(player1Socket).emit('match:victory_warning', warning);
    }
    if (player2Socket) {
      this.io.to(player2Socket).emit('match:victory_warning', warning);
    }
  }

  /**
   * Enviar histórico completo de rondas para um jogador (no final)
   * @param {object} match
   * @param {string} userId
   */
  sendMatchHistory(match, userId) {
    const playerSocket =
      match.player1.userId === userId
        ? match.player1.socketId
        : match.player2.socketId;

    if (!playerSocket) return;

    const history = {
      matchId: match.id,
      roundHistory: match.roundHistory || [],
      gameCount: match.games.length,
      totalDuration: Date.now() - match.createdAt,
      summary: {
        player1: {
          userId: match.player1.userId,
          finalMarks: match.player1.marks,
          totalWins: match.player1.wins,
        },
        player2: {
          userId: match.player2.userId,
          finalMarks: match.player2.marks,
          totalWins: match.player2.wins,
        },
        winner: match.winner,
      },
    };

    this.io.to(playerSocket).emit('match:history_summary', history);
  }
}
