/**
 * BiscaGameEngine para multiplayer
 * Versão adaptada do motor de jogo single-player
 * Funciona como "source of truth" no servidor
 */

const SUITS = ['H', 'D', 'C', 'S'];
const RANKS = ['A', '7', 'K', 'J', 'Q', '6', '5', '4', '3', '2'];
const CARD_VALUES = { A: 11, '7': 10, K: 4, J: 3, Q: 2 };

export class BiscaGameEngine {
  constructor() {
    this.deck = [];
    this.player1Hand = [];
    this.player2Hand = [];
    this.table = [];
    this.player1Tricks = [];
    this.player2Tricks = [];
    this.trumpCard = null;
    this.trumpSuit = null;
    this.currentPlayer = 'player1'; // Quem é a vez
    this.phase = 'draw'; // draw | no-draw
    this.scores = { player1: 0, player2: 0 };
    this.marks = { player1: 0, player2: 0 };
    this.winner = null;
  }

  initGame() {
    this.deck = this.createDeck();
    this.shuffleDeck();
    this.dealCards();
    this.trumpCard = this.deck.pop();
    this.trumpSuit = this.trumpCard.suit;
  }

  createDeck() {
    const deck = [];
    for (let suit of SUITS) {
      for (let rank of RANKS) {
        deck.push({ suit, rank, id: `${suit}${rank}` });
      }
    }
    return deck;
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCards() {
    // Distribuir 3 cartas a cada jogador
    for (let i = 0; i < 3; i++) {
      this.player1Hand.push(this.deck.pop());
      this.player2Hand.push(this.deck.pop());
    }
  }

  player1PlayCard(cardId) {
    const cardIndex = this.player1Hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, message: 'Card not found in hand' };
    }

    const card = this.player1Hand[cardIndex];
    this.table.push(card);
    this.player1Hand.splice(cardIndex, 1);

    return { success: true, card };
  }

  player2PlayCard(cardId) {
    const cardIndex = this.player2Hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return { success: false, message: 'Card not found in hand' };
    }

    const card = this.player2Hand[cardIndex];
    this.table.push(card);
    this.player2Hand.splice(cardIndex, 1);

    return { success: true, card };
  }

  /**
   * Resolve quem venceu o trick
   * Retorna 'player1' ou 'player2'
   */
  resolveTrick() {
    if (this.table.length !== 2) {
      throw new Error('Trick not complete');
    }

    const [card1, card2] = this.table;
    const winner = this.doesSecondCardWin(card1, card2) ? 'player2' : 'player1';

    // Contar pontos do trick
    const trickPoints = this.getCardValue(card1) + this.getCardValue(card2);

    if (winner === 'player1') {
      this.player1Tricks.push({ cards: [card1, card2], points: trickPoints });
      this.scores.player1 += trickPoints;
    } else {
      this.player2Tricks.push({ cards: [card1, card2], points: trickPoints });
      this.scores.player2 += trickPoints;
    }

    this.table = [];

    // Distribuir novas cartas
    this.drawCards();

    // Verificar se jogo acabou
    if (this.deck.length === 0 && this.player1Hand.length === 0) {
      this.finishGame();
    }

    // O vencedor do trick joga primeiro no próximo
    this.currentPlayer = winner;

    return winner;
  }

  drawCards() {
    // Quem ganhou o trick tira primeiro (já está como currentPlayer)
    const firstPlayer = this.currentPlayer;
    const secondPlayer = firstPlayer === 'player1' ? 'player2' : 'player1';

    if (this.deck.length > 0) {
      if (firstPlayer === 'player1' && this.player1Hand.length < 3) {
        this.player1Hand.push(this.deck.pop());
      } else if (firstPlayer === 'player2' && this.player2Hand.length < 3) {
        this.player2Hand.push(this.deck.pop());
      }
    }

    if (this.deck.length > 0) {
      if (secondPlayer === 'player1' && this.player1Hand.length < 3) {
        this.player1Hand.push(this.deck.pop());
      } else if (secondPlayer === 'player2' && this.player2Hand.length < 3) {
        this.player2Hand.push(this.deck.pop());
      }
    }

    // Atualizar fase
    if (this.deck.length === 0) {
      this.phase = 'no-draw';
    }
  }

  doesSecondCardWin(firstCard, secondCard) {
    // Segunda carta bate primeira se:
    // 1. Mesmo naipe e valor mais alto
    // 2. Trunfo vs não-trunfo

    if (secondCard.suit === this.trumpSuit && firstCard.suit !== this.trumpSuit) {
      return true; // Segunda é trunfo, primeira não
    }

    if (secondCard.suit === firstCard.suit) {
      return this.getCardValue(secondCard) > this.getCardValue(firstCard);
    }

    return false;
  }

  getCardValue(card) {
    return CARD_VALUES[card.rank] || 0;
  }

  finishGame() {
    this.computeMarks();
    this.winner = this.scores.player1 > this.scores.player2 ? 'player1' : 'player2';
  }

  computeMarks() {
    const markThresholds = { Capote: 91, Flag: 120, Risca: 61 };

    if (this.scores.player1 >= markThresholds.Capote) {
      this.marks.player1 |= 1; // Bit 0: Capote
    }
    if (this.scores.player1 >= markThresholds.Flag) {
      this.marks.player1 |= 2; // Bit 1: Flag
    }
    if (this.scores.player1 >= markThresholds.Risca) {
      this.marks.player1 |= 4; // Bit 2: Risca
    }

    if (this.scores.player2 >= markThresholds.Capote) {
      this.marks.player2 |= 1;
    }
    if (this.scores.player2 >= markThresholds.Flag) {
      this.marks.player2 |= 2;
    }
    if (this.scores.player2 >= markThresholds.Risca) {
      this.marks.player2 |= 4;
    }
  }

  getState() {
    return {
      player1Hand: this.player1Hand,
      player2Hand: this.player2Hand,
      table: this.table,
      player1Tricks: this.player1Tricks,
      player2Tricks: this.player2Tricks,
      trumpCard: this.trumpCard,
      trumpSuit: this.trumpSuit,
      currentPlayer: this.currentPlayer,
      phase: this.phase,
      deck: this.deck,
      scores: this.scores,
      marks: this.marks,
      winner: this.winner,
    };
  }
}
