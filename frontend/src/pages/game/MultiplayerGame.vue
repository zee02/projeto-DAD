<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSocketStore } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { SUIT_SYMBOL } from '@/stores/biscaEngine'

const router = useRouter()
const route = useRoute()
const socketStore = useSocketStore()
const authStore = useAuthStore()
const apiStore = useAPIStore()

// Game state
const gameId = ref(route.params.gameId)
const matchId = ref(route.query.matchId)
const gameState = ref(null)
const match = ref(null)
const opponentUserId = ref(null)
const betAmount = ref(0)
const gameType = ref('3')
const gameMessage = ref('')
const errorMessage = ref('')

// Timer
let turnTimerInterval = null
let gameStartTime = null

// Computed
const user = computed(() => authStore.user)

const gameTitle = computed(() =>
  gameType.value === '9' 
    ? 'Bisca – 9 Cards (Multiplayer)' 
    : 'Bisca – 3 Cards (Multiplayer)'
)

const isMyTurn = computed(() => {
  if (!gameState.value || !user.value) return false
  const myPlayer =
    gameState.value.player1.userId === user.value.id ? 'player1' : 'player2'
  return gameState.value.currentPlayer === myPlayer
})

const myHand = computed(() => {
  if (!gameState.value || !user.value) return []
  return gameState.value.player1.userId === user.value.id
    ? gameState.value.player1.hand
    : gameState.value.player2.hand
})

const opponentHand = computed(() => {
  if (!gameState.value || !user.value) return []
  return gameState.value.player1.userId === user.value.id
    ? gameState.value.player2.hand
    : gameState.value.player1.hand
})

const opponentInfo = computed(() => {
  if (!gameState.value || !user.value) return null
  return gameState.value.player1.userId === user.value.id
    ? gameState.value.player2
    : gameState.value.player1
})

const myScore = computed(() => {
  if (!gameState.value || !user.value) return 0
  return gameState.value.player1.userId === user.value.id
    ? gameState.value.player1.score
    : gameState.value.player2.score
})

const opponentScore = computed(() => {
  if (!gameState.value || !user.value) return 0
  return gameState.value.player1.userId === user.value.id
    ? gameState.value.player2.score
    : gameState.value.player1.score
})

const myTricks = computed(() => {
  if (!gameState.value || !user.value) return 0
  return gameState.value.player1.userId === user.value.id
    ? gameState.value.player1.trickCount
    : gameState.value.player2.trickCount
})

const opponentTricks = computed(() => {
  if (!gameState.value || !user.value) return 0
  return gameState.value.player1.userId === user.value.id
    ? gameState.value.player2.trickCount
    : gameState.value.player1.trickCount
})

const deckRemaining = computed(() => {
  if (!gameState.value) return 0
  return gameState.value.deckRemaining
})

const turnTimeRemaining = computed(() => {
  if (!gameState.value) return 20
  return Math.ceil(gameState.value.turnTimeRemaining / 1000)
})

const suitSymbol = suit => SUIT_SYMBOL[suit] || '?'

// Card image mapping
const getSuitPrefix = (suit) => {
  const map = { H: 'c', D: 'e', C: 'o', S: 'p' }
  return map[suit] || suit
}

const getRankNumber = (rank) => {
  const map = { A: '1', J: '11', Q: '12', K: '13' }
  return map[rank] || rank
}

const getCardImagePath = (card) => {
  if (!card) return '/cards/semFace.png'
  const suit = getSuitPrefix(card.suit)
  const rank = getRankNumber(card.rank)
  return `/cards/${suit}${rank}.png`
}

const getCardBackImagePath = () => '/cards/semFace.png'

// Play card
const playCard = (card) => {
  if (!isMyTurn.value) return

  socketStore.socket.emit('game:play_card', {
    gameId: gameId.value,
    cardId: card.id,
  })
}

// Surrender
const surrenderGame = () => {
  if (confirm('Are you sure you want to surrender? You will lose this game.')) {
    socketStore.socket.emit('game:surrender', {
      gameId: gameId.value,
    })
  }
}

// Go back to home
const goBack = () => {
  router.push('/')
}

// Deduct coins at game start
const deductCoinsAtGameStart = async () => {
  try {
    // Deduct coins from player's balance
    await apiStore.post('/coins/deduct', {
      amount: betAmount.value,
      reason: `Multiplayer bet - ${gameType.value} cards, match ${matchId.value}`
    })
    console.log('Coins deducted:', betAmount.value)
  } catch (error) {
    console.error('Failed to deduct coins:', error)
    errorMessage.value = 'Failed to deduct coins. Please try again.'
  }
}

// Award coins to winner
const awardCoinsToWinner = async (winnerId, amount) => {
  try {
    await apiStore.post('/coins/award', {
      user_id: winnerId,
      amount: amount,
      reason: `Multiplayer game win - ${gameType.value} cards, match ${matchId.value}`
    })
    console.log('Coins awarded:', amount)
  } catch (error) {
    console.error('Failed to award coins:', error)
  }
}

// Salvar match na database
const saveMatchToDatabase = async (payload) => {
  try {
    const matchData = {
      player1_user_id: payload.match.player1.userId,
      player2_user_id: payload.match.player2.userId,
      winner_user_id: payload.match.winner === 'player1' ? payload.match.player1.userId : payload.match.player2.userId,
      game_type: gameType.value,
      bet_per_game: betAmount.value,
      max_wins: payload.match.maxWins,
      player1_wins: payload.match.player1.wins,
      player2_wins: payload.match.player2.wins,
      player1_coins_bet: payload.match.player1.coinsBet,
      player2_coins_bet: payload.match.player2.coinsBet,
      player1_coins_won: payload.match.player1.coinsWon,
      player2_coins_won: payload.match.player2.coinsWon,
      games_data: payload.match.games,
    }
    
    await apiStore.postSaveMatch(matchData)
    console.log('Match saved to database')
  } catch (error) {
    console.error('Failed to save match:', error)
  }
}

// Set up socket listeners
onMounted(() => {
  console.log('[MultiplayerGame] Mounted, gameId:', gameId.value)
  console.log('[MultiplayerGame] Socket connected:', socketStore.isConnected)
  console.log('[MultiplayerGame] Last game:start payload:', socketStore.lastGameStartPayload.value)
  
  gameStartTime = Date.now()

  // Check if game:start payload already received (race condition handling)
  if (socketStore.lastGameStartPayload.value) {
    console.log('[MultiplayerGame] Using stored game:start payload:', socketStore.lastGameStartPayload.value)
    const payload = socketStore.lastGameStartPayload.value
    gameId.value = payload.gameId
    matchId.value = payload.matchId
    gameState.value = payload.gameState
    opponentUserId.value = payload.opponentUserId
    betAmount.value = payload.betAmount
    gameType.value = payload.gameType
    gameStartTime = Date.now()
    deductCoinsAtGameStart()
    socketStore.lastGameStartPayload.value = null // Clear after using
  }

  // Listening for game start
  socketStore.socket.on('game:start', (payload) => {
    console.log('[MultiplayerGame] Game started event received:', payload)
    gameId.value = payload.gameId
    matchId.value = payload.matchId
    gameState.value = payload.gameState
    opponentUserId.value = payload.opponentUserId
    betAmount.value = payload.betAmount
    gameType.value = payload.gameType
    gameStartTime = Date.now()
    deductCoinsAtGameStart()
    socketStore.lastGameStartPayload.value = null // Clear after using
  })

  // Listening for game state updates
  socketStore.socket.on('game:state_update', (state) => {
    console.log('Game state updated:', state)
    gameState.value = state
    selectedCard.value = null
    isPlayingCard.value = false
    updateTurnTimer()
    gameMessage.value = ''
  })

  // Listening for game finished
  socketStore.socket.on('game:finished', (payload) => {
    console.log('Game finished:', payload)
    gameFinished.value = true
    gameResult.value = payload
  })

  // Listening for match game result
  socketStore.socket.on('match:game_result', (payload) => {
    console.log('Match game result:', payload)
    match.value = payload.match
    gameMessage.value = `Game result: ${payload.winner.userId === user.value.id ? 'You won! 🎉' : 'You lost'}`
  })

  // Listening for match finished
  socketStore.socket.on('match:finished', (payload) => {
    console.log('Match finished:', payload)
    matchFinished.value = true
    matchResult.value = payload
    gameMessage.value = `${
      payload.winner === 'player1' ? 'Player 1' : 'Player 2'
    } won the match!`
    
    // Award coins to winner
    const winnerId = payload.winner === 'player1' 
      ? payload.match.player1.userId 
      : payload.match.player2.userId
    const coinsWon = payload.winner === 'player1'
      ? payload.match.player1.coinsWon
      : payload.match.player2.coinsWon
    
    awardCoinsToWinner(winnerId, coinsWon)
    
    // Salvar match na database
    saveMatchToDatabase(payload)
  })

  // Listening for timeout
  socketStore.socket.on('game:timeout', (payload) => {
    console.log('Game timeout:', payload)
    errorMessage.value = `${
      payload.winner === user.value.id ? 'You won! Opponent timed out' : 'You lost! Timed out'
    }`
    gameFinished.value = true
  })

  // Listening for opponent disconnect
  socketStore.socket.on('game:opponent_disconnected', (payload) => {
    console.log('Opponent disconnected:', payload)
    errorMessage.value = 'Opponent disconnected. You won by default.'
    gameFinished.value = true
  })

  // Listening for surrendered
  socketStore.socket.on('game:surrendered', (payload) => {
    console.log('Opponent surrendered:', payload)
    errorMessage.value = `${
      payload.winner === user.value.id
        ? 'You won! Opponent surrendered'
        : 'You surrendered'
    }`
    gameFinished.value = true
  })

  // Listening for errors
  socketStore.socket.on('game:error', (payload) => {
    console.error('Game error:', payload)
    errorMessage.value = payload.message
    isPlayingCard.value = false
    selectedCard.value = null
  })

  // Start turn timer interval
  turnTimerInterval = setInterval(updateTurnTimer, 100)

  // Timeout para esperar gameState
  setTimeout(() => {
    if (!gameState.value) {
      console.error('[MultiplayerGame] Timeout waiting for gameState')
      console.error('[MultiplayerGame] lastGameStartPayload:', socketStore.lastGameStartPayload.value)
      console.error('[MultiplayerGame] gameId:', gameId.value)
      console.error('[MultiplayerGame] socket connected:', socketStore.isConnected)
      errorMessage.value = 'Failed to load game. Please refresh.'
    }
  }, 5000)
})

// Clean up on unmount
onBeforeUnmount(() => {
  if (turnTimerInterval) {
    clearInterval(turnTimerInterval)
  }

  socketStore.socket.off('game:start')
  socketStore.socket.off('game:state_update')
  socketStore.socket.off('game:finished')
  socketStore.socket.off('match:game_result')
  socketStore.socket.off('match:finished')
  socketStore.socket.off('game:timeout')
  socketStore.socket.off('game:opponent_disconnected')
  socketStore.socket.off('game:surrendered')
  socketStore.socket.off('game:error')
})

// Handle game finish
const goHome = () => {
  router.push('/')
}

const continueToNextGame = () => {
  router.push('/')
}
</script>

<template>
  <div v-if="gameState" class="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
    <div class="w-full max-w-5xl bg-white shadow-xl rounded-2xl p-6 flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-2xl font-bold">{{ gameTitle }}</h1>
          <p class="text-sm text-gray-600">
            Trump suit:
            <span v-if="gameState" class="font-semibold">
              {{ suitSymbol(gameState.trumpCard?.suit) }}
            </span>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 rounded-lg bg-slate-200 text-sm hover:bg-slate-300"
            @click="goBack"
          >
            Back
          </button>
          <button
            v-if="isMyTurn"
            class="px-3 py-1 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
            @click="surrenderGame"
          >
            Surrender
          </button>
        </div>
      </div>

      <!-- Info Bar -->
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div class="bg-slate-50 border rounded-lg p-3">
          <div class="font-semibold mb-1">Game info</div>
          <p>Bet: <span class="font-medium">{{ betAmount }} coins</span></p>
          <p>Type: <span class="font-medium">{{ gameType }} cards</span></p>
          <p>Deck: <span class="font-medium">{{ deckRemaining }}</span> left</p>
        </div>

        <div class="bg-slate-50 border rounded-lg p-3">
          <div class="font-semibold mb-1">Your Score</div>
          <p>Points: <span class="font-medium">{{ myScore }}</span></p>
          <p>Tricks: <span class="font-medium">{{ myTricks }}</span></p>
          <p v-if="isMyTurn" class="mt-1 text-blue-600 font-bold">✓ Your turn</p>
          <p v-else class="mt-1 text-orange-600 font-bold">⏳ Opponent's turn</p>
        </div>

        <div class="bg-slate-50 border rounded-lg p-3">
          <div class="font-semibold mb-1">Opponent Score</div>
          <p>Points: <span class="font-medium">{{ opponentScore }}</span></p>
          <p>Tricks: <span class="font-medium">{{ opponentTricks }}</span></p>
          <p class="mt-1 text-gray-500">User #{{ opponentUserId }}</p>
        </div>
      </div>

      <!-- Turn Timer -->
      <div class="text-center py-3 bg-blue-50 rounded-lg">
        <div class="text-3xl font-bold text-blue-600">{{ turnTimeRemaining }}s</div>
        <div class="text-sm text-gray-600">Time remaining for current turn</div>
      </div>

      <!-- Mesa (cartas jogadas) -->
      <div
        class="flex items-center justify-between py-6 px-6 border rounded-xl bg-slate-50"
      >
        <!-- Trump Card - à esquerda com margem -->
        <div class="flex items-center justify-center w-20">
          <div v-if="gameState.trumpCard" class="w-16 h-24 overflow-hidden shadow">
            <img
              :src="getCardImagePath(gameState.trumpCard)"
              :alt="`Trump: ${gameState.trumpCard.rank} of ${gameState.trumpCard.suit}`"
              class="w-full h-full object-cover"
            />
          </div>
          <div v-else class="w-16 h-24 border rounded-lg bg-slate-200" />
        </div>

        <!-- Table Cards - centradas -->
        <div class="flex flex-col items-center justify-center gap-4 flex-1">
          <div class="text-xs uppercase tracking-wide text-slate-500">
            Table
          </div>
          <div class="flex gap-8 items-end justify-center">
            <div class="flex flex-col items-center">
              <span class="text-xs text-slate-500 mb-1">Opponent</span>
              <div
                v-if="gameState.table.find(p => p.owner === 'player2')"
                class="w-20 h-28 overflow-hidden shadow"
              >
                <img
                  :src="getCardImagePath(gameState.table.find(p => p.owner === 'player2').card)"
                  :alt="`Card`"
                  class="w-full h-full object-cover"
                />
              </div>
              <div v-else class="w-20 h-28 border rounded-lg bg-slate-200" />
            </div>

            <div class="flex flex-col items-center">
              <span class="text-xs text-slate-500 mb-1">You</span>
              <div
                v-if="gameState.table.find(p => p.owner === 'player1')"
                class="w-20 h-28 overflow-hidden shadow"
              >
                <img
                  :src="getCardImagePath(gameState.table.find(p => p.owner === 'player1').card)"
                  :alt="`Card`"
                  class="w-full h-full object-cover"
                />
              </div>
              <div v-else class="w-20 h-28 border rounded-lg bg-slate-200" />
            </div>
          </div>
        </div>

        <!-- Espaço vazio à direita para equilibrar o layout -->
        <div class="w-20"></div>
      </div>

      <!-- Mão do Oponente -->
      <div class="mt-4 flex flex-col items-center">
        <span class="text-xs text-slate-500 mb-1">Opponent hand ({{ opponentHand.length }} cards)</span>
        <div class="flex gap-2">
          <div
            v-for="n in opponentHand.length"
            :key="n"
            class="w-12 h-18 sm:w-14 sm:h-20 rounded-md shadow overflow-hidden"
          >
            <img
              :src="getCardBackImagePath()"
              alt="Card back"
              class="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {{ errorMessage }}
      </div>

      <div v-if="gameMessage" class="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
        {{ gameMessage }}
      </div>

      <!-- Mão do Jogador -->
      <div
        class="mt-6 flex flex-col items-center border-t pt-4"
      >
        <span class="text-xs text-slate-500 mb-2">Your hand</span>
        <div class="flex flex-wrap justify-center gap-3">
          <button
            v-for="card in myHand"
            :key="card.id"
            class="w-16 h-24 sm:w-18 sm:h-28 shadow flex items-center justify-center overflow-hidden hover:-translate-y-1 hover:shadow-lg transition flex-shrink-0"
            :class="[isMyTurn ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed']"
            :disabled="!isMyTurn"
            @click="playCard(card)"
          >
            <img
              :src="getCardImagePath(card)"
              :alt="`${card.rank} of ${card.suit}`"
              class="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Game Finished Modal -->
    <div
      v-if="matchFinished && matchResult"
      class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <h2 class="text-3xl font-bold text-gray-900">Match Finished! 🏆</h2>
        <p class="text-xl text-gray-600">
          {{
            matchResult.winner === 'player1'
              ? (gameState.player1.userId === user.id ? 'You won!' : 'You lost!')
              : (gameState.player2.userId === user.id ? 'You won!' : 'You lost!')
          }}
        </p>
        <p class="text-2xl font-bold text-yellow-600">
          💰 Match completed
        </p>
        <button
          @click="goBack"
          class="w-full py-3 px-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white font-bold rounded-lg hover:from-slate-700 hover:to-slate-800"
        >
          Back to Home
        </button>
      </div>
    </div>
  </div>

  <!-- Loading state -->
  <div
    v-else
    class="min-h-screen bg-slate-100 flex items-center justify-center"
  >
    <div class="text-center">
      <div class="text-6xl mb-4 animate-spin">🎮</div>
      <h2 class="text-2xl font-bold text-gray-900">Loading game...</h2>
      <p class="text-gray-600 mt-2">{{ errorMessage || 'Connecting to server...' }}</p>
    </div>
  </div>
</template>
