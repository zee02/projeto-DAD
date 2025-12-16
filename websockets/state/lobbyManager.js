/**
 * Gerencia lobbys de espera para jogos multiplayer
 * Cada lobby aguarda 2 jogadores para iniciar
 */

export class LobbyManager {
  constructor() {
    this.lobbys = new Map(); // lobbyId -> { player1, player2, createdAt, gameType, betAmount }
    this.playerLobbys = new Map(); // userId -> lobbyId
    this.lobbyCounter = 0;
  }

  /**
   * Cria um novo lobby ou coloca player num lobby existente
   */
  joinLobby(userId, socketId, gameType = "bisca", betAmount = 2) {
    // Se player já está num lobby, sair do anterior
    if (this.playerLobbys.has(userId)) {
      this.leaveLobby(userId);
    }

    // Procurar lobby vazio do mesmo tipo com mesma aposta
    const availableLobby = Array.from(this.lobbys.values()).find(
      (lobby) =>
        !lobby.player2 &&
        lobby.gameType === gameType &&
        lobby.betAmount === betAmount
    );

    if (availableLobby) {
      // Player 2 entra num lobby existente
      availableLobby.player2 = { userId, socketId };
      this.playerLobbys.set(userId, availableLobby.id);
      return {
        status: "ready",
        lobbyId: availableLobby.id,
        lobby: availableLobby,
      };
    } else {
      // Criar novo lobby
      const lobbyId = `lobby_${++this.lobbyCounter}`;
      const newLobby = {
        id: lobbyId,
        player1: { userId, socketId },
        player2: null,
        gameType,
        betAmount,
        createdAt: Date.now(),
        status: "waiting",
      };

      this.lobbys.set(lobbyId, newLobby);
      this.playerLobbys.set(userId, lobbyId);
      return { status: "waiting", lobbyId, lobby: newLobby };
    }
  }

  /**
   * Remove player de um lobby
   */
  leaveLobby(userId) {
    const lobbyId = this.playerLobbys.get(userId);
    if (!lobbyId) return null;

    const lobby = this.lobbys.get(lobbyId);
    if (!lobby) return null;

    // Remover player do lobby
    if (lobby.player1?.userId === userId) {
      lobby.player1 = null;
    } else if (lobby.player2?.userId === userId) {
      lobby.player2 = null;
    }

    this.playerLobbys.delete(userId);

    // Se lobby vazio, deletar
    if (!lobby.player1 && !lobby.player2) {
      this.lobbys.delete(lobbyId);
      return { status: "lobby_deleted", lobbyId };
    }

    return { status: "left", lobbyId };
  }

  /**
   * Obter estado do lobby
   */
  getLobby(lobbyId) {
    return this.lobbys.get(lobbyId);
  }

  /**
   * Obter lobby do player
   */
  getPlayerLobby(userId) {
    const lobbyId = this.playerLobbys.get(userId);
    return lobbyId ? this.lobbys.get(lobbyId) : null;
  }

  /**
   * Converter lobby para game (quando 2 players estão prontos)
   */
  lobbyToGame(lobbyId) {
    const lobby = this.lobbys.get(lobbyId);
    if (!lobby || !lobby.player1 || !lobby.player2) {
      return null;
    }

    this.lobbys.delete(lobbyId);
    return {
      gameId: `game_${lobbyId}`,
      player1: lobby.player1,
      player2: lobby.player2,
      gameType: lobby.gameType,
      betAmount: lobby.betAmount,
    };
  }

  /**
   * Listar lobbys disponíveis (por tipo e aposta)
   */
  getAvailableLobbys(gameType = "bisca", betAmount = 2) {
    return Array.from(this.lobbys.values()).filter(
      (lobby) =>
        !lobby.player2 &&
        lobby.gameType === gameType &&
        lobby.betAmount === betAmount
    );
  }
}
