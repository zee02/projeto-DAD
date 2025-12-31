/**
 * BiscaGameEngine para multiplayer
 * Versão adaptada do motor de jogo single-player
 * Funciona como "source of truth" no servidor
 */

const SUITS = ['H', 'D', 'C', 'S'];
const RANKS = ['A', '7', 'K', 'J', 'Q', '6', '5', '4', '3', '2'];
const CARD_VALUES = { A: 11, '7': 10, K: 4, J: 3, Q: 2 };

export class BiscaGameEngine {
  constructor(mode = '3') {
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
    this.mode = mode === '9' ? '9' : '3';
    this.handSize = this.mode === '9' ? 9 : 3;
  }

  initGame() {
    this.deck = this.createDeck();
    this.shuffleDeck();
    this.dealCards();
    // Trump é a última carta do baralho, permanece no baralho
    this.trumpCard = this.deck[this.deck.length - 1];
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
    // Distribuir cartas iniciais (3 ou 9 por jogador)
    for (let i = 0; i < this.handSize; i++) {
      this.player1Hand.push(this.deck.pop());
      this.player2Hand.push(this.deck.pop());
    }
  }

  player1PlayCard(cardId) {
    console.log(`[player1PlayCard] Playing card ${cardId}. Hand BEFORE: [${this.player1Hand.map(c => c.id).join(', ')}]`);
    
    const cardIndex = this.player1Hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      console.log(`[player1PlayCard] ERROR: Card not found in hand!`);
      return { success: false, message: 'Card not found in hand' };
    }
    
    // Validar jogada na fase sem compra (seguir naipe se possível)
    if (this.phase === 'no-draw' && this.table.length === 1) {
      const leadSuit = this.table[0].card.suit;
      const hasSuit = this.player1Hand.some(c => c.suit === leadSuit);
      const chosen = this.player1Hand[cardIndex];
      if (hasSuit && chosen.suit !== leadSuit) {
        return { success: false, message: 'Must follow suit' };
      }
    }

    const card = this.player1Hand[cardIndex];
    this.table.push({ card, owner: 'player1' });
    this.player1Hand.splice(cardIndex, 1);
    
    console.log(`[player1PlayCard] Card REMOVED. Hand AFTER: [${this.player1Hand.map(c => c.id).join(', ')}]`);
    console.log(`[player1PlayCard] Table now has ${this.table.length} cards. Deck has ${this.deck.length} cards remaining.`);

    return { success: true, card };
  }

  player2PlayCard(cardId) {
    console.log(`[player2PlayCard] Playing card ${cardId}. Hand BEFORE: [${this.player2Hand.map(c => c.id).join(', ')}]`);
    
    const cardIndex = this.player2Hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      console.log(`[player2PlayCard] ERROR: Card not found in hand!`);
      return { success: false, message: 'Card not found in hand' };
    }
    // Validar jogada na fase sem compra (seguir naipe se possível)
    if (this.phase === 'no-draw' && this.table.length === 1) {
      const leadSuit = this.table[0].card.suit;
      const hasSuit = this.player2Hand.some(c => c.suit === leadSuit);
      const chosen = this.player2Hand[cardIndex];
      if (hasSuit && chosen.suit !== leadSuit) {
        return { success: false, message: 'Must follow suit' };
      }
    }

    const card = this.player2Hand[cardIndex];
    this.table.push({ card, owner: 'player2' });
    this.player2Hand.splice(cardIndex, 1);
    console.log(`[player2PlayCard] Card REMOVED. Hand AFTER: [${this.player2Hand.map(c => c.id).join(', ')}]`);
    console.log(`[player2PlayCard] Table now has ${this.table.length} cards. Deck has ${this.deck.length} cards remaining.`);

    return { success: true, card };
  }

  /**
   * Resolve quem venceu o trick
   * Retorna 'player1' ou 'player2'
   */
  /**
   * Resolve quem venceu o trick
   * Retorna 'player1' ou 'player2'
   * 
   * CARD DRAW SEQUENCE (strictly enforced):
   * 1. Both players play their cards (playCard removes from hand)
   * 2. resolveTrick is called when table has 2 cards
   * 3. Winner is determined
   * 4. Table is cleared
   * 5. CARDS ARE DRAWN: Winner draws first, loser draws second
   * 6. Next turn begins
   */
  resolveTrick() {
    if (this.table.length !== 2) {
      throw new Error('Trick not complete');
    }

    const card1 = this.table[0].card;
    const card2 = this.table[1].card;
    const secondWins = this.doesSecondCardWin(card1, card2);
    const winner = secondWins ? 'player2' : 'player1';

    // Contar pontos do trick
    const trickPoints = this.getCardValue(card1) + this.getCardValue(card2);

    // Debug logging for trump card logic
    const card1IsTrump = card1.suit === this.trumpSuit;
    const card2IsTrump = card2.suit === this.trumpSuit;
    console.log(
      `[Trick Resolution] Trump: ${this.trumpSuit} | ` +
      `Card1: ${card1.id} (trump: ${card1IsTrump}) | ` +
      `Card2: ${card2.id} (trump: ${card2IsTrump}) | ` +
      `Winner: ${winner} (${secondWins ? 'secondWins' : 'firstWins'}) | ` +
      `Points: ${trickPoints}`
    );

    if (winner === 'player1') {
      this.player1Tricks.push({ cards: [card1, card2], points: trickPoints });
      this.scores.player1 += trickPoints;
    } else {
      this.player2Tricks.push({ cards: [card1, card2], points: trickPoints });
      this.scores.player2 += trickPoints;
    }

    this.table = [];

    // Draw new cards after trick resolution - ONLY after both players have played
    // Winner draws first, then loser
    console.log(`[resolveTrick] Drawing cards for winner ${winner}. Deck size: ${this.deck.length}`);
    
    if (this.deck.length > 0) {
      // Winner draws first
      if (winner === 'player1' && this.player1Hand.length < this.handSize) {
        const card = this.deck.pop();
        this.player1Hand.push(card);
        console.log(`[resolveTrick] Player1 (winner) drew: ${card.id}. New hand size: ${this.player1Hand.length}`);
      } else if (winner === 'player2' && this.player2Hand.length < this.handSize) {
        const card = this.deck.pop();
        this.player2Hand.push(card);
        console.log(`[resolveTrick] Player2 (winner) drew: ${card.id}. New hand size: ${this.player2Hand.length}`);
      }
    }

    if (this.deck.length > 0) {
      // Loser draws second
      const loser = winner === 'player1' ? 'player2' : 'player1';
      if (loser === 'player1' && this.player1Hand.length < this.handSize) {
        const card = this.deck.pop();
        this.player1Hand.push(card);
        console.log(`[resolveTrick] Player1 (loser) drew: ${card.id}. New hand size: ${this.player1Hand.length}`);
      } else if (loser === 'player2' && this.player2Hand.length < this.handSize) {
        const card = this.deck.pop();
        this.player2Hand.push(card);
        console.log(`[resolveTrick] Player2 (loser) drew: ${card.id}. New hand size: ${this.player2Hand.length}`);
      }
    }

    // Check if game should end
    // Game ends when deck is empty AND both hands are empty
    const shouldEndGame = this.deck.length === 0 && this.player1Hand.length === 0 && this.player2Hand.length === 0;

    if (shouldEndGame) {
      this.finishGame();
    }

    // O vencedor do trick joga primeiro no próximo
    this.currentPlayer = winner;

    return winner;
  }


  /**
   * Deprecated: Cards are now drawn in resolveTrick()
   * This method is kept for reference but should not be called
   */
  drawCards() {
    console.warn('[drawCards] This method is deprecated. Cards should be drawn in resolveTrick()');
    // Quem ganhou o trick tira primeiro (já está como currentPlayer)
    const firstPlayer = this.currentPlayer;
    const secondPlayer = firstPlayer === 'player1' ? 'player2' : 'player1';

    if (this.deck.length > 0) {
      if (firstPlayer === 'player1' && this.player1Hand.length < this.handSize) {
        this.player1Hand.push(this.deck.pop());
      } else if (firstPlayer === 'player2' && this.player2Hand.length < this.handSize) {
        this.player2Hand.push(this.deck.pop());
      }
    }

    if (this.deck.length > 0) {
      if (secondPlayer === 'player1' && this.player1Hand.length < this.handSize) {
        this.player1Hand.push(this.deck.pop());
      } else if (secondPlayer === 'player2' && this.player2Hand.length < this.handSize) {
        this.player2Hand.push(this.deck.pop());
      }
    }

    // Atualizar fase
    if (this.deck.length === 0) {
      this.phase = 'no-draw';
    }
  }

  doesSecondCardWin(firstCard, secondCard) {
    // Regras corretas:
    // - Mesmo naipe: maior valor ganha
    // - Se naipes diferentes e segundo é trunfo (e o primeiro não), segundo ganha
    // - Se naipes diferentes e nenhum é trunfo, ganha quem abriu (segundo NÃO ganha)
    const trump = this.trumpSuit;
    if (firstCard.suit === secondCard.suit) {
      return this.getCardValue(secondCard) > this.getCardValue(firstCard);
    }
    if (secondCard.suit === trump && firstCard.suit !== trump) {
      return true;
    }
    if (firstCard.suit === trump && secondCard.suit !== trump) {
      return false;
    }
    return false;
  }

  getCardValue(card) {
    return CARD_VALUES[card.rank] || 0;
  }

  finishGame() {
    this.phase = 'end';
    this.computeMarks();
    
    // Determine winner based on scores
    if (this.scores.player1 > this.scores.player2) {
      this.winner = 'player1';
    } else if (this.scores.player2 > this.scores.player1) {
      this.winner = 'player2';
    } else {
      // Draw - no winner
      this.winner = null;
    }
  }

  /**
   * Em caso de timeout/desistência, atribuir todas as cartas restantes ao vencedor
   * (mãos, mesa e baralho), atualizar pontuações e finalizar jogo.
   */
  awardRemainingTo(winnerKey) {
    // Coletar todas as cartas remanescentes
    const remaining = [];
    // cartas na mesa (extrair card do {card, owner})
    if (this.table && this.table.length) {
      remaining.push(...this.table.map(t => t.card));
      this.table = [];
    }
    // mãos
    remaining.push(...this.player1Hand);
    remaining.push(...this.player2Hand);
    this.player1Hand = [];
    this.player2Hand = [];
    // baralho restante (inclui trump por ser última carta)
    if (this.deck && this.deck.length) {
      remaining.push(...this.deck);
      this.deck = [];
    }

    // Somar pontos das cartas restantes
    const extraPoints = remaining.reduce((sum, c) => sum + (this.getCardValue(c) || 0), 0);

    if (winnerKey === 'player1') {
      this.player1Tricks.push({ cards: remaining, points: extraPoints });
      this.scores.player1 += extraPoints;
    } else {
      this.player2Tricks.push({ cards: remaining, points: extraPoints });
      this.scores.player2 += extraPoints;
    }

    // Finalizar
    this.finishGame();
    this.winner = winnerKey;
  }

  computeMarks() {
    // Bisca mark awards per game:
    // 120 points = Bandeira (full match win, 2 marks)
    // 91-119 points = Capote (2 marks)
    // 61-90 points = Risca/Moça (1 mark)
    // 0-60 points = No mark (0 marks)
    
    this.marks.player1 = this._calculateMarks(this.scores.player1);
    this.marks.player2 = this._calculateMarks(this.scores.player2);
  }

  _calculateMarks(score) {
    if (score >= 120) {
      return 2; // Bandeira
    } else if (score >= 91) {
      return 2; // Capote
    } else if (score >= 61) {
      return 1; // Risca
    }
    return 0;
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
