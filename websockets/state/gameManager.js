/**
 * Gerencia estado dos jogos multiplayer
 * Source of truth para o estado de cada jogo
 */

import { BiscaGameEngine } from "./biscaGameEngine.js";

export class GameManager {
  constructor() {
    this.games = new Map(); // gameId -> { players, engine, state, history }
    this.playerGames = new Map(); // userId -> gameId
  }

  /**
   * Iniciar novo jogo
   */
  startGame(gameId, player1, player2, gameType = "3", betAmount = 2, matchId = null) {
    if (this.games.has(gameId)) {
      throw new Error(`Game ${gameId} already exists`);
    }

    const engine = new BiscaGameEngine(gameType);
    engine.initGame();

    // Aleatoriamente escolher quem é o primeiro a jogar
    const firstPlayer = Math.random() > 0.5 ? "player1" : "player2";

    const game = {
      id: gameId,
      dbGameId: null, // Will be set when game is saved to database
      matchId: matchId, // Store matchId for database save
      player1: { ...player1, score: 0, marks: 0, tricks: [] },
      player2: { ...player2, score: 0, marks: 0, tricks: [] },
      gameType,
      betAmount,
      status: "playing",
      currentPlayer: firstPlayer, // "player1" ou "player2"
      turnStartTime: Date.now(),
      turnTimeLimit: 20000, // 20 segundos
      engine,
      history: [],
      tricksToSave: [], // Store tricks to save when game ends
      startedAt: Date.now(),
      endedAt: null,
      winner: null,
    };

    this.games.set(gameId, game);
    this.playerGames.set(player1.userId, gameId);
    this.playerGames.set(player2.userId, gameId);

    return game;
  }

  /**
   * Obter jogo
   */
  getGame(gameId) {
    return this.games.get(gameId);
  }

  /**
   * Obter jogo do player
   */
  getPlayerGame(userId) {
    const gameId = this.playerGames.get(userId);
    return gameId ? this.games.get(gameId) : null;
  }

  /**
   * Player joga uma carta
   * Valida se é a sua vez, se tem a carta, etc
   */
  playCard(gameId, userId, cardId) {
    const game = this.games.get(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);

    // Verificar se é o jogador certo
    const playerKey = game.player1.userId === userId ? "player1" : "player2";
    if (game.currentPlayer !== playerKey) {
      throw new Error(`Not ${playerKey}'s turn`);
    }

    // Verificar timeout
    const turnElapsed = Date.now() - game.turnStartTime;
    if (turnElapsed > game.turnTimeLimit) {
      return {
        status: "timeout",
        message: `${playerKey} timed out`,
      };
    }

    try {
      // Delegar ao engine
      let result;
      if (playerKey === "player1") {
        result = game.engine.player1PlayCard(cardId);
      } else {
        result = game.engine.player2PlayCard(cardId);
      }

      if (!result.success) {
        return {
          status: "invalid",
          message: result.message,
        };
      }

      // Registrar no histórico
      game.history.push({
        timestamp: Date.now(),
        player: playerKey,
        card: cardId,
        action: "play",
      });

      // Verificar se trick está completo (2 cartas na mesa)
      const state = game.engine.getState();
      if (state.table.length === 2) {
        // DON'T resolve trick yet - let connection.js handle it after delay
        // Just return the state with both cards visible
        // The trick will be resolved by calling resolveTrickDelayed()
      } else {
        // Passar a vez ao outro player
        game.currentPlayer =
          playerKey === "player1" ? "player2" : "player1";
      }

      game.turnStartTime = Date.now(); // Reset timer
      return {
        status: "success",
        gameState: this.getGameState(gameId),
      };
    } catch (error) {
      return {
        status: "error",
        message: error.message,
      };
    }
  }

  /**
   * Player desiste do jogo
   */
  surrender(gameId, userId) {
    const game = this.games.get(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);

    const playerKey = game.player1.userId === userId ? "player1" : "player2";
    const loserKey = playerKey;
    const winnerKey = playerKey === "player1" ? "player2" : "player1";

    // Award remaining cards to winner and finalize scores
    if (typeof game.engine.awardRemainingTo === 'function') {
      game.engine.awardRemainingTo(winnerKey);
    }
    const state = game.engine.getState();
    game.player1.score = state.scores.player1;
    game.player2.score = state.scores.player2;
    game.status = "finished";
    game.winner = winnerKey;
    game.endedAt = Date.now();

    game.history.push({
      timestamp: Date.now(),
      player: loserKey,
      action: "surrender",
    });

    return {
      status: "surrendered",
      winner: game[winnerKey],
      loser: game[loserKey],
      gameState: this.getGameState(gameId),
    };
  }

  /**
   * Resolve trick after cards have been visible for delay
   */
  resolveTrickDelayed(gameId) {
    const game = this.games.get(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);

    const state = game.engine.getState();
    if (state.table.length !== 2) {
      return { status: 'no_trick', message: 'No complete trick to resolve' };
    }

    // Save cards info before resolving the trick
    const tableEntry1 = state.table[0];
    const tableEntry2 = state.table[1];
    const card1 = tableEntry1.card;
    const card2 = tableEntry2.card;
    const card1Player = tableEntry1.owner === 'player1' ? game.player1 : game.player2;
    const card2Player = tableEntry2.owner === 'player1' ? game.player1 : game.player2;
    
    // Resolve trick
    const trickWinner = game.engine.resolveTrick();
    const winnerKey = trickWinner === "player1" ? "player1" : "player2";
    const winnerPlayer = game[winnerKey];

    game.history.push({
      timestamp: Date.now(),
      player: winnerKey,
      action: "won_trick",
    });

    // Get the updated state to get points
    const updatedState = game.engine.getState();
    const lastTrick = updatedState[`${winnerKey}Tricks`][updatedState[`${winnerKey}Tricks`].length - 1];
    const pointsWon = lastTrick ? lastTrick.points : 0;

    // Store trick data to save later when game ends
    const trickNumber = updatedState.player1Tricks.length + updatedState.player2Tricks.length;
    game.tricksToSave.push({
      trick_number: trickNumber,
      card1_id: card1.id,
      card1_suit: card1.suit,
      card1_rank: card1.rank,
      card1_value: this.getCardValue(card1),
      card1_player_id: card1Player.userId,
      card2_id: card2.id,
      card2_suit: card2.suit,
      card2_rank: card2.rank,
      card2_value: this.getCardValue(card2),
      card2_player_id: card2Player.userId,
      winner_user_id: winnerPlayer.userId,
      points_won: pointsWon,
      trump_suit: updatedState.trumpSuit,
    });

    // Se jogo acabou
    if (updatedState.phase === "end") {
      return this.finishGame(gameId);
    }

    // Próximo player é o que venceu o trick
    game.currentPlayer = winnerKey;
    game.turnStartTime = Date.now(); // Reset timer

    return {
      status: "success",
      gameState: this.getGameState(gameId),
    };
  }

  /**
   * Verificar timeout de turno
   */
  checkTurnTimeout(gameId) {
    const game = this.games.get(gameId);
    if (!game || game.status !== "playing") return null;

    const turnElapsed = Date.now() - game.turnStartTime;
    if (turnElapsed > game.turnTimeLimit) {
      const loserKey = game.currentPlayer;
      const winnerKey =
        game.currentPlayer === "player1" ? "player2" : "player1";

      // Award remaining cards to winner and finalize scores
      if (typeof game.engine.awardRemainingTo === 'function') {
        game.engine.awardRemainingTo(winnerKey);
      }
      const state = game.engine.getState();
      game.player1.score = state.scores.player1;
      game.player2.score = state.scores.player2;
      game.status = "finished";
      game.winner = winnerKey;
      game.endedAt = Date.now();

      game.history.push({
        timestamp: Date.now(),
        player: loserKey,
        action: "timeout",
      });

      return {
        status: "timeout",
        winner: game[winnerKey],
        loser: game[loserKey],
      };
    }

    return null;
  }

  /**
   * Finalizar jogo
   */
  finishGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) throw new Error(`Game ${gameId} not found`);

    const state = game.engine.getState();

    // Copiar scores e marks do engine primeiro
    game.player1.score = state.scores.player1;
    game.player2.score = state.scores.player2;
    game.player1.marks = state.marks.player1;
    game.player2.marks = state.marks.player2;

    // Determinar vencedor baseado nos scores
    if (state.scores.player1 > state.scores.player2) {
      game.winner = "player1";
    } else if (state.scores.player2 > state.scores.player1) {
      game.winner = "player2";
    } else {
      // Draw - no winner
      game.winner = null;
    }

    game.status = "finished";
    game.endedAt = Date.now();

    return {
      status: "game_finished",
      winner: game.winner,
      gameState: this.getGameState(gameId),
    };
  }

  /**
   * Obter estado do jogo para enviar ao cliente
   * Returns state for both players (with opponent hand hidden)
   */
  getGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    const engineState = game.engine.getState();

    return {
      gameId: game.id,
      status: game.status,
      currentPlayer: game.currentPlayer,
      turnTimeRemaining: Math.max(
        0,
        game.turnTimeLimit - (Date.now() - game.turnStartTime)
      ),
      player1: {
        userId: game.player1.userId,
        name: game.player1.name,
        score: engineState.scores.player1,
        marks: engineState.marks.player1,
        hand: engineState.player1Hand,
        trickCount: engineState.player1Tricks.length,
      },
      player2: {
        userId: game.player2.userId,
        name: game.player2.name,
        score: engineState.scores.player2,
        marks: engineState.marks.player2,
        hand: engineState.player2Hand,
        trickCount: engineState.player2Tricks.length,
      },
      table: engineState.table,
      trumpCard: engineState.trumpCard,
      deckRemaining: engineState.deck.length,
      winner: game.winner,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
    };
  }

  /**
   * Get personalized game state for a specific player
   * Hides opponent's hand and pending card
   */
  getPlayerGameState(gameId, userId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    const engineState = game.engine.getState();
    const isPlayer1 = game.player1.userId === userId;

    return {
      gameId: game.id,
      status: game.status,
      currentPlayer: game.currentPlayer,
      turnTimeRemaining: Math.max(
        0,
        game.turnTimeLimit - (Date.now() - game.turnStartTime)
      ),
      player1: {
        userId: game.player1.userId,
        name: game.player1.name,
        score: engineState.scores.player1,
        marks: engineState.marks.player1,
        hand: isPlayer1 ? engineState.player1Hand : [], // Only show own hand
        handSize: engineState.player1Hand.length, // Show hand size for opponent
        trickCount: engineState.player1Tricks.length,
      },
      player2: {
        userId: game.player2.userId,
        name: game.player2.name,
        score: engineState.scores.player2,
        marks: engineState.marks.player2,
        hand: !isPlayer1 ? engineState.player2Hand : [], // Only show own hand
        handSize: engineState.player2Hand.length, // Show hand size for opponent
        trickCount: engineState.player2Tricks.length,
      },
      table: engineState.table,
      trumpCard: engineState.trumpCard,
      deckRemaining: engineState.deck.length,
      winner: game.winner,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
    };
  }

  /**
   * Save trick data to the database
   */
  async saveTrickToDatabase(game, card1, card2, card1Player, card2Player, winnerPlayer, pointsWon, trickNumber, trumpSuit) {
    const CARD_VALUES = { A: 11, '7': 10, K: 4, J: 3, Q: 2 };
    const getCardValue = (card) => CARD_VALUES[card.rank] || 0;

    const trickData = {
      game_id: game.id,
      trick_number: trickNumber,
      card1_id: card1.id,
      card1_suit: card1.suit,
      card1_rank: card1.rank,
      card1_value: getCardValue(card1),
      card1_player_id: card1Player.userId,
      card2_id: card2.id,
      card2_suit: card2.suit,
      card2_rank: card2.rank,
      card2_value: getCardValue(card2),
      card2_player_id: card2Player.userId,
      winner_user_id: winnerPlayer.userId,
      points_won: pointsWon,
      trump_suit: trumpSuit,
    };

    try {
      await saveTrick(trickData);
    } catch (error) {
      console.error('Failed to save trick to database:', error);
    }
  }

  /**
   * Save all tricks to database
   */
  async saveTricksToDatabase(dbGameId, tricks) {
    if (!dbGameId || !tricks || tricks.length === 0) {
      return;
    }

    // Add game_id to each trick
    const tricksWithGameId = tricks.map(trick => ({
      ...trick,
      game_id: dbGameId
    }));

    try {
      const { saveTricks } = await import('../utils/apiClient.js');
      await saveTricks(tricksWithGameId);
      console.log(`Saved ${tricks.length} tricks to database`);
    } catch (error) {
      console.error('Failed to save tricks:', error);
    }
  }

  /**
   * Get card value (helper for trick saving)
   */
  getCardValue(card) {
    const CARD_VALUES = { A: 11, '7': 10, K: 4, J: 3, Q: 2 };
    return CARD_VALUES[card.rank] || 0;
  }

  /**
   * Remover jogo
   */
  removeGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    this.playerGames.delete(game.player1.userId);
    this.playerGames.delete(game.player2.userId);
    this.games.delete(gameId);
  }
}
