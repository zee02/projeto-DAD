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
  startGame(gameId, player1, player2, gameType = "bisca", betAmount = 2) {
    if (this.games.has(gameId)) {
      throw new Error(`Game ${gameId} already exists`);
    }

    const engine = new BiscaGameEngine();
    engine.initGame();

    // Aleatoriamente escolher quem é o primeiro a jogar
    const firstPlayer = Math.random() > 0.5 ? "player1" : "player2";

    const game = {
      id: gameId,
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
        // Automaticamente resolver trick no servidor
        const trickWinner = game.engine.resolveTrick();
        const winnerKey =
          trickWinner === "player1" ? "player1" : "player2";

        game.history.push({
          timestamp: Date.now(),
          player: winnerKey,
          action: "won_trick",
        });

        // Se jogo acabou
        if (state.phase === "end") {
          return this.finishGame(gameId);
        }

        // Próximo player é o que venceu o trick
        game.currentPlayer = winnerKey;
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

    // Determinar vencedor
    if (state.scores.player1 > state.scores.player2) {
      game.winner = "player1";
    } else if (state.scores.player2 > state.scores.player1) {
      game.winner = "player2";
    } else {
      // Empate - decidir por algo (ex: jogador que começou)
      game.winner = game.currentPlayer;
    }

    game.status = "finished";
    game.endedAt = Date.now();

    // Copiar scores e marks do engine
    game.player1.score = state.scores.player1;
    game.player2.score = state.scores.player2;
    game.player1.marks = state.marks.player1;
    game.player2.marks = state.marks.player2;

    return {
      status: "game_finished",
      winner: game.winner,
      gameState: this.getGameState(gameId),
    };
  }

  /**
   * Obter estado do jogo para enviar ao cliente
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
        score: game.player1.score,
        marks: game.player1.marks,
        hand: engineState.player1Hand,
        trickCount: engineState.player1Tricks.length,
      },
      player2: {
        userId: game.player2.userId,
        name: game.player2.name,
        score: game.player2.score,
        marks: game.player2.marks,
        hand: engineState.player2Hand,
        trickCount: engineState.player2Tricks.length,
      },
      table: engineState.table.map((c, idx) => ({ owner: idx === 0 ? 'player1' : 'player2', card: c })),
      trumpCard: engineState.trumpCard,
      deckRemaining: engineState.deck.length,
      winner: game.winner,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
    };
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
