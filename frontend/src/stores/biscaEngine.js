// src/game/biscaEngine.js

// ---------------------------
// CARTAS E VALORES OFICIAIS
// ---------------------------

export const SUITS = ['H', 'D', 'C', 'S'] // Hearts, Diamonds, Clubs, Spades
export const RANKS = ['A', '7', 'K', 'J', 'Q', '6', '5', '4', '3', '2']

export const CARD_VALUES = {
  A: 11,
  '7': 10,
  K: 4,
  J: 3,
  Q: 2,
  '6': 0,
  '5': 0,
  '4': 0,
  '3': 0,
  '2': 0
}

// Para mostrar símbolo bonito na UI (opcional)
export const SUIT_SYMBOL = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠'
}

// ---------------------------
// CRIAR E BARALHAR BARALHO
// ---------------------------

export function createDeck() {
  const deck = []
  let id = 1
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: id++,
        suit,
        rank,
        value: CARD_VALUES[rank]
      })
    }
  }
  return deck
}

export function shuffle(deck) {
  const d = [...deck]
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[d[i], d[j]] = [d[j], d[i]]
  }
  return d
}

// ---------------------------
// ENGINE PRINCIPAL DA BISCA
// ---------------------------

export class BiscaEngine {
  /**
   * mode: '3' ou '9'
   */
  constructor(mode = '3') {
    this.mode = mode === '9' ? '9' : '3'
    this.handSize = this.mode === '9' ? 9 : 3

    this.deck = shuffle(createDeck())
    // trunfo = última carta do baralho
    this.trumpCard = this.deck[this.deck.length - 1]
    this.trumpSuit = this.trumpCard.suit

    this.playerHand = []
    this.botHand = []
    this.playerTricks = []
    this.botTricks = []

    this.table = [] // [{card, owner}]
    this.leadPlayer = 'player' // quem abre a vaza atual
    this.currentPlayer = 'player'
    this.phase = 'draw' // 'draw' (ainda há baralho) ou 'no-draw'
    this.gameOver = false
    this.winner = null
    this.scores = { player: 0, bot: 0 }
    this.marks = { player: 0, bot: 0 }

    this.dealInitialHands()
  }

  // ---------------------------
  // DISTRIBUIÇÃO INICIAL
  // ---------------------------

  dealInitialHands() {
    // dá handSize cartas alternadas
    for (let i = 0; i < this.handSize; i++) {
      this.playerHand.push(this.deck.pop())
      this.botHand.push(this.deck.pop())
    }
  }

  // ---------------------------
  // UTILITÁRIOS
  // ---------------------------

  getLegalCards(hand, suitToFollow) {
    // fase 1: pode jogar qualquer carta
    if (this.phase === 'draw' || !suitToFollow) return hand

    // fase 2 (sem baralho): tem de seguir o naipe se tiver
    const hasSuit = hand.some(c => c.suit === suitToFollow)
    if (!hasSuit) return hand
    return hand.filter(c => c.suit === suitToFollow)
  }

  isDeckEmpty() {
    return this.deck.length === 0
  }

  // ---------------------------
  // JOGADAS
  // ---------------------------

  /**
   * Jogada do jogador (UI chama este método).
   * Recebe o id da carta clicada.
   */
  playerPlayCard(cardId) {
    if (this.gameOver) return
    if (this.currentPlayer !== 'player') return

    const cardIndex = this.playerHand.findIndex(c => c.id === cardId)
    if (cardIndex === -1) return

    const card = this.playerHand[cardIndex]

    // validacao na fase 2 (seguir naipe)
    const suitToFollow = this.table.length === 0 ? null : this.table[0].card.suit
    const legal = this.getLegalCards(this.playerHand, suitToFollow)
    if (!legal.some(c => c.id === card.id)) {
      // jogada ilegal
      return
    }

    this.playerHand.splice(cardIndex, 1)
    this.table.push({ card, owner: 'player' })

    // frontend vai controlar quando resolver a vaza
    if (this.table.length < 2) {
      // agora é a vez do bot (frontend vai chamar botAutoPlay com delay)
      this.currentPlayer = 'bot'
    }
  }

  /**
   * IA do bot: faz jogada automaticamente.
   * Implementa a regra: se jogar em segundo tenta ganhar com a carta minima possível,
   * senão joga a carta mais fraca.
   */
  botAutoPlay() {
    if (this.gameOver) return
    if (this.currentPlayer !== 'bot') return
    if (this.botHand.length === 0) return

    const suitToFollow = this.table.length === 0 ? null : this.table[0].card.suit
    const legalCards = this.getLegalCards(this.botHand, suitToFollow)

    let chosenCard

    if (this.table.length === 1) {
      // bot joga em segundo – tenta ganhar
      const leadCard = this.table[0].card
      // todas as cartas que ganham a vaza
      const winningCards = legalCards.filter(c =>
        this.doesSecondCardWin(leadCard, c)
      )

      if (winningCards.length > 0) {
        // joga a que ganha com menor valor
        winningCards.sort((a, b) => a.value - b.value)
        chosenCard = winningCards[0]
      } else {
        // não consegue ganhar -> joga a mais fraca
        legalCards.sort((a, b) => a.value - b.value)
        chosenCard = legalCards[0]
      }
    } else {
      // bot abre a vaza: joga a carta mais fraca legal
      legalCards.sort((a, b) => a.value - b.value)
      chosenCard = legalCards[0]
    }

    const idx = this.botHand.findIndex(c => c.id === chosenCard.id)
    if (idx !== -1) {
      this.botHand.splice(idx, 1)
      this.table.push({ card: chosenCard, owner: 'bot' })
    }

    // frontend vai controlar quando resolver a vaza
    if (this.table.length < 2) {
      this.currentPlayer = 'player'
    }
  }

  /**
   * Decide se a segunda carta ganha à primeira, dado o trunfo.
   */
  doesSecondCardWin(leadCard, secondCard) {
    const trump = this.trumpSuit

    // ambos do mesmo naipe
    if (leadCard.suit === secondCard.suit) {
      return secondCard.value > leadCard.value
    }

    // segundo é trunfo e primeiro não
    if (secondCard.suit === trump && leadCard.suit !== trump) {
      return true
    }

    // primeiro é trunfo e segundo não
    if (leadCard.suit === trump && secondCard.suit !== trump) {
      return false
    }

    // nenhum é trunfo e naipes diferentes → ganha quem abriu
    return false
  }

  /**
   * Avalia a vaza (2 cartas na mesa), atribui cartas ao vencedor,
   * compra do baralho se ainda estivermos na fase de compra,
   * e verifica fim de jogo.
   */
  resolveTrick() {
    if (this.table.length !== 2) return

    const [play1, play2] = this.table
    const trump = this.trumpSuit
    let winner = play1.owner // por defeito, quem abriu

    const leadCard = play1.card
    const secondCard = play2.card

    if (this.doesSecondCardWin(leadCard, secondCard)) {
      winner = play2.owner
    }

    // atribuir cartas ao monte de vazas
    const trickCards = this.table.map(p => p.card)
    if (winner === 'player') {
      this.playerTricks.push(...trickCards)
    } else {
      this.botTricks.push(...trickCards)
    }

    this.table = []
    this.leadPlayer = winner
    this.currentPlayer = winner

    // fase de compra (se ainda houver baralho)
    if (!this.isDeckEmpty()) {
      // vencedor compra primeiro
      if (winner === 'player') {
        this.drawCardTo(this.playerHand)
        this.drawCardTo(this.botHand)
      } else {
        this.drawCardTo(this.botHand)
        this.drawCardTo(this.playerHand)
      }

      // se depois disto baralho esvaziou → passa para fase 2
      if (this.isDeckEmpty()) {
        this.phase = 'no-draw'
      }
    } else {
      // sem baralho → já estávamos na fase 2
      this.phase = 'no-draw'
    }

    // fim de jogo?
    if (
      this.isDeckEmpty() &&
      this.playerHand.length === 0 &&
      this.botHand.length === 0
    ) {
      this.finishGame()
      return
    }

    // se não acabou, o próximo a jogar será definido pelo frontend
    if (!this.gameOver && this.currentPlayer === 'bot') {
      // frontend vai chamar botAutoPlay com delay para animação
    }
  }

  drawCardTo(hand) {
    if (this.deck.length === 0) return
    hand.push(this.deck.pop())
  }

  // ---------------------------
  // PONTUAÇÃO E FIM DO JOGO
  // ---------------------------

  computePoints(cards) {
    return cards.reduce((sum, c) => sum + (CARD_VALUES[c.rank] || 0), 0)
  }

  computeMarks(pointsWinner) {
    if (pointsWinner >= 120) return 3 // bandeira
    if (pointsWinner >= 91) return 2 // capote
    if (pointsWinner >= 61) return 1 // risca
    return 0
  }

  finishGame() {
    this.gameOver = true

    const playerPoints = this.computePoints(this.playerTricks)
    const botPoints = this.computePoints(this.botTricks)
    this.scores = { player: playerPoints, bot: botPoints }

    if (playerPoints > botPoints) {
      this.winner = 'player'
      this.marks.player = this.computeMarks(playerPoints)
    } else if (botPoints > playerPoints) {
      this.winner = 'bot'
      this.marks.bot = this.computeMarks(botPoints)
    } else {
      this.winner = 'draw'
    }
  }

  // ---------------------------
  // SNAPSHOT PARA A UI
  // ---------------------------

  getState() {
    return {
      mode: this.mode,
      handSize: this.handSize,
      trumpCard: this.trumpCard,
      trumpSuit: this.trumpSuit,
      deckCount: this.deck.length,
      phase: this.phase,
      playerHand: [...this.playerHand],
      botHandCount: this.botHand.length,
      table: this.table.map(t => ({ ...t })),
      leadPlayer: this.leadPlayer,
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      scores: { ...this.scores },
      marks: { ...this.marks },
      playerTricksCount: this.playerTricks.length / 2,
      botTricksCount: this.botTricks.length / 2
    }
  }
}
