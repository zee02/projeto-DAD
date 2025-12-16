/**
 * Gerencia apostas e partidas (Match system)
 * Partida = série de jogos até 4 vitórias com apostas acumuladas
 */

export class BettingManager {
  constructor() {
    this.matches = new Map(); // matchId -> match data
    this.playerMatches = new Map(); // userId -> [matchIds]
    this.gameToMatch = new Map(); // gameId -> matchId
    this.matchCounter = 0;
  }

  /**
   * Criar novo Match (série de jogos)
   * betPerGame = moedas por jogo (ex: 2)
   * maxWins = vitórias necessárias para vencer a partida (ex: 4)
   */
  createMatch(player1, player2, betPerGame = 2, maxWins = 4) {
    const matchId = `match_${++this.matchCounter}`;
    const match = {
      id: matchId,
      player1: {
        userId: player1.userId,
        socketId: player1.socketId,
        wins: 0,
        coinsWon: 0,
        coinsBet: 0,
        status: 'active',
      },
      player2: {
        userId: player2.userId,
        socketId: player2.socketId,
        wins: 0,
        coinsWon: 0,
        coinsBet: 0,
        status: 'active',
      },
      betPerGame,
      maxWins,
      currentGame: null,
      games: [],
      status: 'ongoing', // ongoing | finished
      winner: null,
      createdAt: Date.now(),
      finishedAt: null,
    };

    this.matches.set(matchId, match);

    // Registrar players no match
    if (!this.playerMatches.has(player1.userId)) {
      this.playerMatches.set(player1.userId, []);
    }
    if (!this.playerMatches.has(player2.userId)) {
      this.playerMatches.set(player2.userId, []);
    }
    this.playerMatches.get(player1.userId).push(matchId);
    this.playerMatches.get(player2.userId).push(matchId);

    return match;
  }

  /**
   * Registrar resultado de um jogo
   * winner: 'player1' ou 'player2'
   */
  recordGameResult(matchId, gameId, winner, scores) {
    const match = this.matches.get(matchId);
    if (!match) throw new Error(`Match ${matchId} not found`);

    // Cobrar apostas de ambos players
    const betAmount = match.betPerGame;
    match.player1.coinsBet += betAmount;
    match.player2.coinsBet += betAmount;

    // Atualizar vitória
    if (winner === 'player1') {
      match.player1.wins++;
      match.player1.coinsWon += betAmount * 2; // Ganha a aposta do adversário + a sua
    } else {
      match.player2.wins++;
      match.player2.coinsWon += betAmount * 2;
    }

    // Registrar jogo
    match.games.push({
      gameId,
      winner,
      scores,
      timestamp: Date.now(),
    });

    // Verificar se partida acabou
    if (
      match.player1.wins >= match.maxWins ||
      match.player2.wins >= match.maxWins
    ) {
      return this.finishMatch(matchId);
    }

    return {
      status: 'game_recorded',
      match,
    };
  }

  /**
   * Registrar desistência de um player
   * O outro player vence automaticamente
   */
  recordSurrender(matchId, userId) {
    const match = this.matches.get(matchId);
    if (!match) throw new Error(`Match ${matchId} not found`);

    const surrenderer =
      match.player1.userId === userId ? 'player1' : 'player2';
    const winner = surrenderer === 'player1' ? 'player2' : 'player1';

    // O winner vence a partida automaticamente
    match[winner].wins = match.maxWins;
    match[surrenderer].status = 'surrendered';

    return this.finishMatch(matchId, winner);
  }

  /**
   * Finalizar a partida e calcular recompensas
   */
  finishMatch(matchId, forceWinner = null) {
    const match = this.matches.get(matchId);
    if (!match) throw new Error(`Match ${matchId} not found`);

    // Determinar vencedor
    if (forceWinner) {
      match.winner = forceWinner;
    } else {
      match.winner =
        match.player1.wins >= match.maxWins ? 'player1' : 'player2';
    }

    match.status = 'finished';
    match.finishedAt = Date.now();

    // Calcular recompensas finais
    const totalBet =
      match.player1.coinsBet + match.player2.coinsBet;
    const winnerCoins =
      match.winner === 'player1'
        ? match.player1.coinsWon
        : match.player2.coinsWon;

    return {
      status: 'match_finished',
      match,
      winnerCoins,
      totalBet,
    };
  }

  /**
   * Obter match
   */
  getMatch(matchId) {
    return this.matches.get(matchId);
  }

  /**
   * Obter matchs do player (últimas 5 ou todas)
   */
  getPlayerMatches(userId, limit = 5) {
    const matchIds = this.playerMatches.get(userId) || [];
    return matchIds
      .map(id => this.matches.get(id))
      .filter(m => m)
      .slice(-limit);
  }

  /**
   * Registrar gameId para match (para linkagem rápida)
   */
  linkGameToMatch(gameId, matchId) {
    this.gameToMatch.set(gameId, matchId);
  }

  /**
   * Obter match de um game
   */
  getMatchForGame(gameId) {
    const matchId = this.gameToMatch.get(gameId);
    return matchId ? this.matches.get(matchId) : null;
  }

  /**
   * Remover match quando não mais necessário
   */
  removeMatch(matchId) {
    const match = this.matches.get(matchId);
    if (!match) return;

    this.playerMatches.delete(match.player1.userId);
    this.playerMatches.delete(match.player2.userId);
    this.matches.delete(matchId);
  }
}
