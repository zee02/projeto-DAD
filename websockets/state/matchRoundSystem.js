/**
 * Sistema de Pontos por Ronda para Partidas Multiplayer
 * Regras:
 * - Score 61-90: 1 ponto
 * - Score 91-119: 2 pontos
 * - Score 120+: 4 pontos (partida termina imediatamente)
 * - Partida termina em 4 pontos totais
 * - Se baralho acabar, redistribui e continua
 */

export class MatchRoundSystem {
  constructor() {
    this.roundHistory = []; // Array de todas as rondas da partida
  }

  /**
   * Calcula pontos baseado no score final da ronda
   * @param {number} score - Score do jogador nesta ronda
   * @returns {object} { points: number, terminated: boolean, reason: string }
   */
  static calculateRoundPoints(score) {
    score = Number(score) || 0;
    console.log(`[MatchRoundSystem] calculateRoundPoints(${score})`);
    
    if (score >= 120) {
      console.log(`[MatchRoundSystem] Score ${score} >= 120: returning 4 points (instant win)`);
      return {
        points: 4,
        terminated: true,
        reason: 'Score >= 120 (instant win)',
      };
    }

    if (score >= 91 && score < 120) {
      console.log(`[MatchRoundSystem] Score ${score} in [91, 120): returning 2 points`);
      return {
        points: 2,
        terminated: false,
        reason: 'Score 91-119 (2 points)',
      };
    }

    if (score >= 61 && score < 91) {
      console.log(`[MatchRoundSystem] Score ${score} in [61, 91): returning 1 point`);
      return {
        points: 1,
        terminated: false,
        reason: 'Score 61-90 (1 point)',
      };
    }

    console.log(`[MatchRoundSystem] Score ${score} < 61: returning 0 points`);
    return {
      points: 0,
      terminated: false,
      reason: 'Score < 61 (0 points)',
    };
  }

  /**
   * Verifica se algum jogador atingiu ou ultrapassou um milestone de pontos
   * e retorna os marks que devem ser atualizados
   * Usado para atualização em tempo real durante o jogo
   * @param {number} previousScore - Score anterior
   * @param {number} currentScore - Score atual
   * @returns {object} { pointsEarned: number, crossed: boolean }
   */
  static getPointsMilestone(previousScore, currentScore) {
    const result = {
      pointsEarned: 0,
      crossed: false,
      milestone: null,
    };

    // Verificar se cruzou 60 pontos
    if (previousScore < 61 && currentScore >= 61) {
      result.pointsEarned = 1;
      result.crossed = true;
      result.milestone = 61;
    }
    // Verificar se cruzou 91 pontos
    else if (previousScore < 91 && currentScore >= 91) {
      result.pointsEarned = 2;
      result.crossed = true;
      result.milestone = 91;
    }
    // Verificar se cruzou 120 pontos
    else if (previousScore < 120 && currentScore >= 120) {
      result.pointsEarned = 4;
      result.crossed = true;
      result.milestone = 120;
    }

    return result;
  }

  /**
   * Processa fim de ronda e retorna nova pontuação
   * @param {object} match - Objeto da partida
   * @param {object} roundResult - { player1Score, player2Score, ...}
   * @returns {object} { match, gameEnded: boolean, matchEnded: boolean, winner: string|null }
   */
  static processRoundEnd(match, roundResult) {
    const player1Result = this.calculateRoundPoints(roundResult.player1Score);
    const player2Result = this.calculateRoundPoints(roundResult.player2Score);

    // Atualizar pontos da partida
    match.player1.marks += player1Result.points;
    match.player2.marks += player2Result.points;

    // Registar ronda no histórico
    const round = {
      roundNumber: match.games.length + 1, // Usa número de jogos como referência
      player1: {
        score: roundResult.player1Score,
        pointsEarned: player1Result.points,
        reason: player1Result.reason,
      },
      player2: {
        score: roundResult.player2Score,
        pointsEarned: player2Result.points,
        reason: player2Result.reason,
      },
      cumulative: {
        player1: match.player1.marks,
        player2: match.player2.marks,
      },
      timestamp: Date.now(),
    };

    match.roundHistory = match.roundHistory || [];
    match.roundHistory.push(round);

    // Verificar se partida terminou (alguém atingiu 4 pontos ou score 120+)
    let matchEnded = false;
    let winner = null;

    if (player1Result.terminated || player2Result.terminated) {
      // Alguém fez 120+
      matchEnded = true;
      winner = player1Result.terminated ? 'player1' : 'player2';
    } else if (match.player1.marks >= match.maxWins) {
      matchEnded = true;
      winner = 'player1';
    } else if (match.player2.marks >= match.maxWins) {
      matchEnded = true;
      winner = 'player2';
    }

    return {
      match,
      roundResult: round,
      gameEnded: true, // Ronda acabou
      matchEnded,
      winner,
    };
  }

  /**
   * Verifica se baralho acabou e precisa ser redistribuído
   * @param {number} deckRemaining - Cartas restantes no baralho
   * @param {number} handSize - Tamanho da mão (3 ou 9)
   * @returns {boolean}
   */
  static isDeckExhausted(deckRemaining, handSize) {
    // Se há menos de 2 * handSize cartas, não há suficientes para os dois
    return deckRemaining < handSize * 2;
  }

  /**
   * Verifica se alguém atingiu a meta de marks para vencer a partida
   * @param {object} match - Dados da partida
   * @returns {object} { matchEnded: boolean, winner: string|null }
   */
  static checkMatchVictory(match) {
    if (match.player1.marks >= match.maxWins) {
      return {
        matchEnded: true,
        winner: 'player1',
      };
    }
    if (match.player2.marks >= match.maxWins) {
      return {
        matchEnded: true,
        winner: 'player2',
      };
    }
    return {
      matchEnded: false,
      winner: null,
    };
  }

  /**
   * Retorna estado atual da partida formatado para sincronização
   * @param {object} match
   * @returns {object}
   */
  static getMatchState(match) {
    return {
      matchId: match.id,
      player1: {
        userId: match.player1.userId,
        marks: match.player1.marks,
        wins: match.player1.wins,
        coinsWon: match.player1.coinsWon,
      },
      player2: {
        userId: match.player2.userId,
        marks: match.player2.marks,
        wins: match.player2.wins,
        coinsWon: match.player2.coinsWon,
      },
      maxWins: match.maxWins,
      currentRound: (match.roundHistory || []).length,
      gameCount: match.games.length,
      status: match.status,
      winner: match.winner,
    };
  }

  /**
   * Calcula prêmios finais baseado em pontos acumulados
   * @param {object} match
   * @returns {object} { player1Coins, player2Coins, totalBet }
   */
  static calculateFinalPrizes(match) {
    const totalBet = match.player1.coinsBet + match.player2.coinsBet;
    const winner = match.winner;

    if (!winner) {
      // Empate (não deve acontecer)
      return {
        player1Coins: Math.floor(totalBet / 2),
        player2Coins: Math.floor(totalBet / 2),
        totalBet,
      };
    }

    return {
      player1Coins: winner === 'player1' ? totalBet : 0,
      player2Coins: winner === 'player2' ? totalBet : 0,
      totalBet,
    };
  }
}

/**
 * Histórico de rondas da partida
 * Estrutura individual para rastreamento completo
 */
export class RoundHistory {
  constructor(matchId) {
    this.matchId = matchId;
    this.rounds = [];
  }

  addRound(roundData) {
    this.rounds.push({
      ...roundData,
      addedAt: Date.now(),
    });
  }

  getSummary() {
    return {
      totalRounds: this.rounds.length,
      rounds: this.rounds,
    };
  }

  getLastRound() {
    return this.rounds[this.rounds.length - 1] || null;
  }
}
