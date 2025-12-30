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

// UI/local state
const selectedCard = ref(null)
const isPlayingCard = ref(false)
const gameFinished = ref(false)
const gameResult = ref(null)
const matchFinished = ref(false)
const matchResult = ref(null)
const showSurrenderConfirm = ref(false)
const showTimeoutModal = ref(false)
const timeoutResult = ref(null)
const showEndModal = ref(false) // Added showEndModal as a ref
// Fallback-aware effective bet amount for UI messages (e.g., surrender)
const effectiveBetAmount = computed(() => {
  // Priority: betAmount (set from game:start) > sessionStorage > match.betPerGame > payload
  const direct = Number(betAmount.value || 0)
  if (direct > 0) return direct
  const fromSession = Number(sessionStorage.getItem('matchBetAmount') || 0)
  if (fromSession > 0) return fromSession
  const fromMatch = Number(match.value?.betPerGame || 0)
  if (fromMatch > 0) return fromMatch
  const fromPayload = Number(socketStore.lastGameStartPayload?.value?.betAmount || 0)
  return fromPayload
})

// Notification system
const notifications = ref([]) // Array of {id, type, message, icon, duration}
let notificationIdCounter = 0

// Flags to avoid duplicate notifications/payouts on surrender/disconnect
const suppressRoundNotifs = ref(false)
const suppressMatchNotifs = ref(false)

// Guard to avoid double coin awards per game
const coinsAwarded = ref(false)

const addNotification = (message, type = 'info', icon = '', duration = 3000) => {
  const id = notificationIdCounter++
  notifications.value.push({ id, type, message, icon, duration })
  
  if (duration > 0) {
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }, duration)
  }
  
  return id
}

  // Store socket event handlers for proper cleanup
  const socketHandlers = {
    onGameStart: null,
    onGameStateUpdate: null,
    onGameFinished: null,
    onMatchGameResult: null,
    onMatchFinished: null,
    onGameTimeout: null,
    onOpponentDisconnected: null,
    onGameSurrendered: null,
    onGameError: null,
  }

const myOwner = computed(() => {
  if (!gameState.value || !user.value) return 'player1'
  return gameState.value.player1.userId === user.value.id ? 'player1' : 'player2'
})

const oppOwner = computed(() => (myOwner.value === 'player1' ? 'player2' : 'player1'))

// Helper to map server owner ('player1'/'player2') to local perspective
const localOwner = (serverOwner) => {
  if (myOwner.value === 'player1') {
    return serverOwner === 'player1' ? 'me' : 'opponent'
  } else {
    return serverOwner === 'player2' ? 'me' : 'opponent'
  }
}

// Timer styling based on warning state
const timerClasses = computed(() => {
  if (timeWarning.value === 'critical') {
    return 'text-red-600 animate-pulse'
  } else if (timeWarning.value === 'warning') {
    return 'text-orange-600'
  }
  return 'text-blue-600'
})

// Timer
let turnTimerInterval = null
let countdownInterval = null
let gameStartTime = null
let lastUpdateTime = null
const localCountdown = ref(20)
const timeWarning = ref(null)
const previousTurnTimeRemaining = ref(20000)

// Local timer updater - counts down from server time
const updateTurnTimer = () => {
  if (!gameState.value) return
  
  const now = Date.now()
  const serverTime = gameState.value.turnTimeRemaining
  
  // Reset local countdown when server time changes significantly
  if (Math.abs(serverTime - previousTurnTimeRemaining.value) > 100) {
    localCountdown.value = Math.ceil(serverTime / 1000)
    previousTurnTimeRemaining.value = serverTime
  }
  
  // Update warning based on remaining time
  if (serverTime <= 3000) {
    timeWarning.value = 'critical'
  } else if (serverTime <= 5000) {
    timeWarning.value = 'warning'
  } else {
    timeWarning.value = null
  }
}

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
  showSurrenderConfirm.value = true
}

const confirmSurrender = () => {
  socketStore.socket.emit('game:surrender', {
    gameId: gameId.value,
  })
  showSurrenderConfirm.value = false
}

const cancelSurrender = () => {
  showSurrenderConfirm.value = false
}

// Go back to home
const goBack = () => {
  router.push('/')
}

// Go back from timeout modal and close lobby
const goBackFromTimeout = () => {
  showTimeoutModal.value = false
  // Emit event to close lobby (if we're still connected)
  socketStore.socket.emit('lobby:leave', {})
  // Redirect to home
  setTimeout(() => {
    router.push('/')
  }, 300)
}

// Continue to next game after round finishes
const continueToNextGame = () => {
  gameFinished.value = false
  gameResult.value = null
  // Game will continue automatically as the server sends next round game state
}

// Go home after opponent disconnects
const goHomeAfterDisconnect = () => {
  // Emit lobby leave to notify server
  socketStore.socket.emit('lobby:leave', {})
  // Redirect to home
  setTimeout(() => {
    router.push('/')
  }, 300)
}

// Track if we already deducted coins for this game
const coinsAlreadyDeducted = ref(false)

// Deduct coins locally at game start (reflect immediately in navbar)
const deductCoinsAtGameStart = () => {
  if (coinsAlreadyDeducted.value || !user.value) return
  const current = Number(user.value.coins_balance || 0)
  const next = Math.max(0, current - Number(betAmount.value || 0))
  authStore.setUser({ ...user.value, coins_balance: next })
  deductedGamesCount.value = 1
  coinsAlreadyDeducted.value = true
}

// Award coins locally to winner (reflect immediately in navbar)
const awardCoinsToWinner = (winnerId, amount) => {
  if (!user.value) return
  if (winnerId !== user.value.id) return
  const current = Number(user.value.coins_balance || 0)
  const next = current + Number(amount || 0)
  authStore.setUser({ ...user.value, coins_balance: next })
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
  console.log('[MultiplayerGame] Last game:start payload:', socketStore.lastGameStartPayload?.value)
  
  gameStartTime = Date.now()

  // Check if game:start payload already received (race condition handling)
  if (socketStore.lastGameStartPayload?.value) {
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

  // Se não temos gameState ainda, pedir ao servidor o estado atual
  if (!gameState.value && gameId.value) {
    socketStore.socket.emit('game:request_state', { gameId: gameId.value })
  }

  // Listening for game start
  socketHandlers.onGameStart = (payload) => {
    console.log('[MultiplayerGame] Game started event received:', payload)
    gameId.value = payload.gameId
    matchId.value = payload.matchId
    gameState.value = payload.gameState
    opponentUserId.value = payload.opponentUserId
    betAmount.value = payload.betAmount
    gameType.value = payload.gameType
    gameStartTime = Date.now()
    deductCoinsAtGameStart()
    if (socketStore.lastGameStartPayload) {
      socketStore.lastGameStartPayload.value = null // Clear after using
    }
  }
  socketStore.socket.on('game:start', socketHandlers.onGameStart)

  // Listening for game state updates
  socketHandlers.onGameStateUpdate = (state) => {
    console.log('Game state updated:', state)
    
    gameState.value = state
    previousTurnTimeRemaining.value = state.turnTimeRemaining
    selectedCard.value = null
    isPlayingCard.value = false
    updateTurnTimer()
    gameMessage.value = ''
  }
  socketStore.socket.on('game:state_update', socketHandlers.onGameStateUpdate)

  // Listening for game finished
  socketHandlers.onMatchGameResult = (payload) => {
    console.log('Game finished:', payload)
    gameFinished.value = true
    gameResult.value = {
      winner: payload.winner.userId === user.value.id ? myOwner.value : oppOwner.value,
      myScore: myOwner.value === 'player1' ? payload.scores.player1 : payload.scores.player2,
      oppScore: myOwner.value === 'player1' ? payload.scores.player2 : payload.scores.player1,
    }
    
    // Show notification only if not suppressed (e.g., surrender already notified)
    if (!suppressRoundNotifs.value) {
      const isWinner = payload.winner.userId === user.value.id
      if (isWinner) {
        addNotification('🎉 You won this round!', 'success', '🏆', 3000)
      } else {
        addNotification('❌ You lost this round', 'info', '😔', 3000)
      }
    }
    
    match.value = payload.match
    gameMessage.value = `Game result: ${payload.winner.userId === user.value.id ? 'You won! 🎉' : 'You lost'}`
    // Deduct additional bet(s) for completed games beyond the first
    const gamesPlayed = Array.isArray(payload.match?.games) ? payload.match.games.length : 0
    const betPerGame = Number(payload.match?.betPerGame || betAmount.value || 0)
    if (gamesPlayed > deductedGamesCount.value && betPerGame > 0 && user.value) {
      const additional = gamesPlayed - deductedGamesCount.value
      const totalDeduct = additional * betPerGame
      const current = Number(user.value.coins_balance || 0)
      const next = Math.max(0, current - totalDeduct)
      authStore.setUser({ ...user.value, coins_balance: next })
      deductedGamesCount.value = gamesPlayed
    }
  }
  socketStore.socket.on('match:game_result', socketHandlers.onMatchGameResult)

  // Listening for old game:finished (for compatibility)
  socketHandlers.onGameFinished = (payload) => {
    console.log('Game finished (old format):', payload)
    gameFinished.value = true
    gameResult.value = payload
    
    // Show notification only if not suppressed (e.g., surrender already notified)
    if (!suppressRoundNotifs.value) {
      const isWinner = payload.winner === myOwner.value
      if (isWinner) {
        addNotification('🎉 You won this round!', 'success', '🏆', 3000)
      } else {
        addNotification('❌ You lost this round', 'info', '😔', 3000)
      }
    }
  }
  socketStore.socket.on('game:finished', socketHandlers.onGameFinished)

  // Listening for match finished
  socketHandlers.onMatchFinished = (payload) => {
    console.log('Match finished:', payload)
    matchFinished.value = true
    matchResult.value = payload
    // Modal igual ao singleplayer
    if (payload.winner === myOwner.value) {
      endSummary.value = { text: 'You win!', winner: 'player' }
      addNotification('🎉 You won the match!', 'success', '🏆', 4000)
    } else {
      endSummary.value = { text: 'You lose.', winner: 'opponent' }
      addNotification('❌ You lost the match.', 'error', '😔', 4000)
    }
    showEndModal.value = true
    // Award coins to winner
    const winnerId = payload.winner === 'player1' 
      ? payload.match.player1.userId 
      : payload.match.player2.userId
    const totalPot = Number(payload.totalBet || 0)
    awardCoinsToWinner(winnerId, totalPot)
    deductedGamesCount.value = 0
    // Salvar match na database
    saveMatchToDatabase(payload)
    // Guardar o último jogo na base de dados de cada jogador
    if (payload.lastGame) {
      saveGameToDatabase(payload.lastGame)
    }
  }
  socketStore.socket.on('match:finished', socketHandlers.onMatchFinished)

  // Listening for timeout
  socketHandlers.onGameTimeout = (payload) => {
    console.log('Game timeout:', payload)
    const isWinner = payload.winner === user.value.id
    timeoutResult.value = {
      isWinner,
      winner: payload.winner,
      loser: payload.loser,
    }
    showTimeoutModal.value = true
    gameFinished.value = true
  }
  socketStore.socket.on('game:timeout', socketHandlers.onGameTimeout)

  // Listening for opponent disconnect
  socketHandlers.onOpponentDisconnected = (payload) => {
    console.log('Opponent disconnected:', payload)
    
    const isWinner = payload.winner === user.value.id
    const payout = Number(effectiveBetAmount.value || betAmount.value || 0) * 2
    addNotification(`Opponent disconnected. You won by default! +${payout} coins`, 'success', '✅', 4000)
    
    // Populate game result for display
    gameFinished.value = true
    gameResult.value = {
      winner: isWinner ? myOwner.value : oppOwner.value,
      myScore: isWinner ? 10 : 0,  // Placeholder - actual scores from game state
      oppScore: isWinner ? 0 : 10,
      reason: 'Opponent disconnected'
    }

    // Award coins to winner (betAmount per player => winner gets 2x stake)
    if (!coinsAwarded.value) {
      awardCoinsToWinner(payload.winner, payout)
      coinsAwarded.value = true
    }
    
    // Auto-redirect to home after 5 seconds if user doesn't click button
    setTimeout(() => {
      if (gameFinished.value && gameResult.value?.reason === 'Opponent disconnected') {
        goHomeAfterDisconnect()
      }
    }, 5000)
  }
  socketStore.socket.on('game:opponent_disconnected', socketHandlers.onOpponentDisconnected)

  // Listening for surrendered
  socketHandlers.onGameSurrendered = (payload) => {
    console.log('Opponent surrendered:', payload)
    const isWinner = payload.winner === user.value.id
    const payout = Number(effectiveBetAmount.value || betAmount.value || 0) * 2
    if (isWinner) {
      addNotification(`🏁 Opponent surrendered! You won! +${payout} coins`, 'success', '✅', 4000)
    } else {
      addNotification('Game ended', 'info', '🏁', 3000)
    }
    gameFinished.value = true
    suppressRoundNotifs.value = true
    suppressMatchNotifs.value = true

    // Award coins to winner (surrender win)
    if (!coinsAwarded.value) {
      awardCoinsToWinner(payload.winner, payout)
      coinsAwarded.value = true
    }
  }
  socketStore.socket.on('game:surrendered', socketHandlers.onGameSurrendered)

  // Listening for errors
  socketHandlers.onGameError = (payload) => {
    console.error('Game error:', payload)
    errorMessage.value = payload.message
    isPlayingCard.value = false
    selectedCard.value = null
  }
  socketStore.socket.on('game:error', socketHandlers.onGameError)

  // Start turn timer interval - update timer every 100ms
  turnTimerInterval = setInterval(updateTurnTimer, 100)
  
  // Local countdown interval - decrement visible countdown every second
  countdownInterval = setInterval(() => {
    if (gameState.value && gameState.value.turnTimeRemaining > 0) {
      localCountdown.value = Math.ceil(gameState.value.turnTimeRemaining / 1000)
    }
  }, 1000)

  // Timeout para esperar gameState
  setTimeout(() => {
    if (!gameState.value && socketStore.lastGameStartPayload?.value) {
      // usar payload guardado se por alguma razão não foi aplicado
      const payload = socketStore.lastGameStartPayload.value
      gameId.value = payload.gameId
      matchId.value = payload.matchId
      gameState.value = payload.gameState
      opponentUserId.value = payload.opponentUserId
      betAmount.value = payload.betAmount
      gameType.value = payload.gameType
      gameStartTime = Date.now()
      deductCoinsAtGameStart()
      socketStore.lastGameStartPayload.value = null
    }

    if (!gameState.value) {
      // Tentar de novo pedir estado
      if (gameId.value) {
        socketStore.socket.emit('game:request_state', { gameId: gameId.value })
      }
      console.error('[MultiplayerGame] Timeout waiting for gameState')
      console.error('[MultiplayerGame] lastGameStartPayload:', socketStore.lastGameStartPayload?.value)
      console.error('[MultiplayerGame] gameId:', gameId.value)
      console.error('[MultiplayerGame] socket connected:', socketStore.isConnected)
      errorMessage.value = 'Failed to load game. Please refresh.'
    }
  }, 5000)
})

// Clean up on unmount
onBeforeUnmount(() => {
  // If user leaves mid-game (e.g., back navigation), forfeit the game
  if (socketStore?.socket && socketStore.socket.connected && gameId.value && !gameFinished.value && !matchFinished.value) {
    socketStore.socket.emit('game:surrender', { gameId: gameId.value })
  }

  if (turnTimerInterval) {
    clearInterval(turnTimerInterval)
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }

  // Remove socket listeners using stored references for proper cleanup
  if (socketHandlers.onGameStart) {
    socketStore.socket.off('game:start', socketHandlers.onGameStart)
  }
  if (socketHandlers.onGameStateUpdate) {
    socketStore.socket.off('game:state_update', socketHandlers.onGameStateUpdate)
  }
  if (socketHandlers.onGameFinished) {
    socketStore.socket.off('game:finished', socketHandlers.onGameFinished)
  }
  if (socketHandlers.onMatchGameResult) {
    socketStore.socket.off('match:game_result', socketHandlers.onMatchGameResult)
  }
  if (socketHandlers.onMatchFinished) {
    socketStore.socket.off('match:finished', socketHandlers.onMatchFinished)
  }
  if (socketHandlers.onGameTimeout) {
    socketStore.socket.off('game:timeout', socketHandlers.onGameTimeout)
  }
  if (socketHandlers.onOpponentDisconnected) {
    socketStore.socket.off('game:opponent_disconnected', socketHandlers.onOpponentDisconnected)
  }
  if (socketHandlers.onGameSurrendered) {
    socketStore.socket.off('game:surrendered', socketHandlers.onGameSurrendered)
  }
  if (socketHandlers.onGameError) {
    socketStore.socket.off('game:error', socketHandlers.onGameError)
  }
  
  // Reset game state to prevent stale data in next game
  gameState.value = null
  gameId.value = null
  matchId.value = null
  gameResult.value = null
    matchFinished.value = true
    matchResult.value = payload
    // Modal igual ao singleplayer
    if (payload.winner === myOwner.value) {
      endSummary.value = { text: 'You win!', winner: 'player' }
      addNotification('🎉 You won the match!', 'success', '🏆', 4000)
    } else {
      endSummary.value = { text: 'You lose.', winner: 'opponent' }
      addNotification('❌ You lost the match.', 'error', '😔', 4000)
    }
    showEndModal.value = true
    // Award coins to winner
    const winnerId = payload.winner === 'player1' 
      ? payload.match.player1.userId 
      : payload.match.player2.userId
    const totalPot = Number(payload.totalBet || 0)
    awardCoinsToWinner(winnerId, totalPot)
    deductedGamesCount.value = 0
    // Salvar match na database
    saveMatchToDatabase(payload)
    // Guardar o último jogo na base de dados de cada jogador
    if (payload.lastGame) {
      saveGameToDatabase(payload.lastGame)
    }

    // Auto-redirect to home after 6 seconds for both winner and loser
    setTimeout(() => {
    if (showEndModal.value) {
      goBack()
    }
  }, 6000)
}
</script>

<template>
  <div v-if="gameState" class="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
    <!-- Notification System -->
    <div class="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 max-w-md">
      <transition-group name="notification" tag="div" class="flex flex-col gap-3">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          :class="[
            'px-6 py-4 rounded-xl shadow-2xl backdrop-blur-sm text-white font-semibold text-center cursor-pointer hover:shadow-3xl transition-all',
            notif.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
            notif.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
            notif.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-600' :
            'bg-gradient-to-r from-blue-500 to-indigo-600'
          ]"
          @click="removeNotification(notif.id)"
        >
          <div class="flex items-center gap-3 justify-center">
            <span class="text-2xl">{{ notif.icon }}</span>
            <span>{{ notif.message }}</span>
          </div>
        </div>
      </transition-group>
    </div>

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
          <p class="mt-1 text-gray-500">{{ opponentInfo?.name || `User #${opponentInfo?.userId}` }}</p>
        </div>
      </div>

      <!-- Turn Timer -->
      <div class="text-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 relative overflow-hidden">
        <div :class="['text-5xl font-black transition-all duration-300', timerClasses]">
          {{ localCountdown }}s
        </div>
        <div :class="['text-sm font-semibold transition-colors', timeWarning === 'critical' ? 'text-red-600' : timeWarning === 'warning' ? 'text-orange-600' : 'text-gray-600']">
          {{ timeWarning === 'critical' ? '⏰ Time running out!' : timeWarning === 'warning' ? '⚠️ Hurry up!' : 'Time remaining for current turn' }}
        </div>
        <!-- Progress bar -->
        <div class="mt-2 h-1 bg-gray-300 rounded-full overflow-hidden">
          <div
            class="h-full transition-all"
            :class="timeWarning === 'critical' ? 'bg-red-500' : timeWarning === 'warning' ? 'bg-orange-500' : 'bg-blue-500'"
            :style="{
              width: `${Math.max(0, Math.min(100, (gameState?.turnTimeRemaining / 20000) * 100))}%`
            }"
          ></div>
        </div>
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
                v-if="gameState.table.find(p => localOwner(p.owner) === 'opponent')"
                class="w-20 h-28 overflow-hidden shadow"
              >
                <img
                  :src="getCardImagePath(gameState.table.find(p => localOwner(p.owner) === 'opponent').card)"
                  :alt="`Card`"
                  class="w-full h-full object-cover"
                />
              </div>
              <div v-else class="w-20 h-28 border rounded-lg bg-slate-200" />
            </div>

            <div class="flex flex-col items-center">
              <span class="text-xs text-slate-500 mb-1">You</span>
              <div
                v-if="gameState.table.find(p => localOwner(p.owner) === 'me')"
                class="w-20 h-28 overflow-hidden shadow"
              >
                <img
                  :src="getCardImagePath(gameState.table.find(p => localOwner(p.owner) === 'me').card)"
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

    <!-- Timeout Modal -->
    <div
      v-if="showTimeoutModal && timeoutResult"
      class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <h2 class="text-3xl font-bold text-gray-900">⏰ Time Expired!</h2>
        <p class="text-xl text-gray-600">
          {{
            timeoutResult.isWinner
              ? '🎉 Opponent timed out! You won!'
              : '❌ You lost this round!'
          }}
        </p>
        <button
          @click="goBackFromTimeout"
          class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800"
        >
          Okay
        </button>
      </div>
    </div>

    <!-- Round Finished Modal -->
    <div
      v-if="gameFinished && gameResult && !matchFinished"
      class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <h2 class="text-3xl font-bold text-gray-900">Round Finished! 🎯</h2>
        <p class="text-xl text-gray-600">
          {{
            gameResult.winner === myOwner.value
              ? '🎉 You won this round!'
              : '❌ You lost this round'
          }}
        </p>
        <div class="text-lg text-gray-700">
          <p>Opponent's score: <span class="font-bold">{{ gameResult.oppScore }}</span></p>
          <p>Your score: <span class="font-bold">{{ gameResult.myScore }}</span></p>
        </div>
        <!-- Show different button based on whether opponent disconnected -->
        <button
          v-if="gameResult.reason === 'Opponent disconnected'"
          @click="goHomeAfterDisconnect"
          class="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:from-green-700 hover:to-green-800"
        >
          🏠 Back to Home
        </button>
        <button
          v-else
          @click="continueToNextGame"
          class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800"
        >
          Next Round
        </button>
      </div>
    </div>

    <!-- Game Finished Modal -->
    <div
      v-if="showEndModal && endSummary"
      class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <h2 class="text-3xl font-bold text-gray-900">Match Finished! 🏆</h2>
        <p class="text-xl text-gray-600">
          {{ endSummary.text }}
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

    <!-- Surrender Confirmation Modal -->
    <div
      v-if="showSurrenderConfirm"
      class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <h2 class="text-3xl font-bold text-gray-900">Surrender Game?</h2>
        <div class="text-lg text-gray-700 space-y-2">
          <p>Are you sure you want to surrender?</p>
          <p class="text-red-600 font-bold text-2xl">You will lose {{ effectiveBetAmount }} coins 💰</p>
        </div>
        <div class="flex gap-3">
          <button
            @click="cancelSurrender"
            class="flex-1 py-3 px-4 bg-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
          <button
            @click="confirmSurrender"
            class="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-lg hover:from-red-600 hover:to-red-700 transition"
          >
            Surrender
          </button>
        </div>
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

<style scoped>
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
