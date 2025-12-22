<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSocketStore } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const socketStore = useSocketStore()
const authStore = useAuthStore()

// Local state
const lobbyId = ref(null)
const waitingForOpponent = ref(false)
const selectedBet = ref(3)
const gameType = ref(route.query.mode || '3')
const stakeMode = ref('preset') // 'preset' or 'custom'
const customStake = ref(null)
const customStakeError = ref('')
const betOptions = [3] // Preset: 3 coins (minimum stake)
const leftLobby = ref(false)
const coinsRefunded = ref(false) // Track if coins were already refunded
const userCanceledSearch = ref(false) // Track if user clicked cancel

// UI state
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Computed
const user = computed(() => authStore.user)
const isConnected = computed(() => socketStore.socket?.connected)

// Join lobby
const joinLobby = async () => {
  if (!user.value?.id) {
    errorMessage.value = 'You must be logged in to play'
    return
  }

  // Validate custom stake if in custom mode
  if (stakeMode.value === 'custom') {
    if (!customStake.value || customStake.value === '') {
      customStakeError.value = 'Please enter a stake amount'
      return
    }
    if (!Number.isInteger(Number(customStake.value))) {
      customStakeError.value = 'Stake must be a whole number'
      return
    }
    const stake = Number(customStake.value)
    if (stake < 3) {
      customStakeError.value = 'Minimum stake is 3 coins'
      return
    }
    if (stake > 100) {
      customStakeError.value = 'Maximum stake is 100 coins'
      return
    }
    selectedBet.value = stake
  }

  // Check if user has enough coins
  const currentCoins = Number(user.value.coins_balance || 0)
  const betAmount = Number(selectedBet.value || 0)
  
  if (currentCoins < betAmount) {
    errorMessage.value = `Insufficient coins! You need ${betAmount} coins but only have ${currentCoins}.`
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  customStakeError.value = ''

  try {
    // Reset refund flag for new lobby session
    coinsRefunded.value = false
    
    // Immediately deduct coins from player's balance (optimistic update)
    const newCoins = Math.max(0, currentCoins - betAmount)
    authStore.setUser({ ...user.value, coins_balance: newCoins })

    socketStore.socket.emit('lobby:join', {
      userId: user.value.id,
      name: user.value.name,
      gameType: gameType.value,
      betAmount: selectedBet.value,
    })

    // reset and show immediate feedback
    waitingForOpponent.value = true
    lobbyId.value = 'matching...'
    successMessage.value = `Waiting for opponent... (Bet: ${selectedBet.value} coins)`
    // Store bet amount for MultiplayerGame to access
    sessionStorage.setItem('matchBetAmount', String(selectedBet.value))
  } catch (error) {
    errorMessage.value = error.message || 'Failed to join lobby'
  } finally {
    isLoading.value = false
  }
}

// Cancel waiting
const cancelWaiting = () => {
  userCanceledSearch.value = true
  socketStore.socket.emit('lobby:leave', { userCanceled: true })
  
  // Refund coins since game hasn't started (only once)
  if (!coinsRefunded.value) {
    const currentCoins = Number(user.value?.coins_balance || 0)
    const refundCoins = Number(selectedBet.value || 0)
    const newCoins = currentCoins + refundCoins
    authStore.setUser({ ...user.value, coins_balance: newCoins })
    coinsRefunded.value = true
  }
  
  waitingForOpponent.value = false
  lobbyId.value = null
  successMessage.value = ''
  // Inform user locally; no redirect
  errorMessage.value = 'Game canceled'
  setTimeout(() => {
    errorMessage.value = ''
  }, 1000)
}

// Set up socket listeners
onMounted(() => {
  if (!isConnected.value) {
    socketStore.connect()
  }

  // Listening for game start
    socketStore.socket.on('game:start', (payload) => {
    console.log('Game started:', payload)
    // Store the game state in socket store before routing (guarded)
    if (socketStore.lastGameStartPayload) {
      socketStore.lastGameStartPayload.value = payload
    }
    leftLobby.value = true
    waitingForOpponent.value = false
    lobbyId.value = payload.gameId || lobbyId.value
    router.push({
      name: 'multiplayer-game',
      params: { gameId: payload.gameId },
      query: { matchId: payload.matchId },
    })
  })

  // Listening for errors
  socketStore.socket.on('error', (payload) => {
    errorMessage.value = payload.message
    if (waitingForOpponent.value && !coinsRefunded.value) {
      // Refund coins on error (only once)
      const currentCoins = Number(user.value?.coins_balance || 0)
      const refundCoins = Number(selectedBet.value || 0)
      const newCoins = currentCoins + refundCoins
      authStore.setUser({ ...user.value, coins_balance: newCoins })
      coinsRefunded.value = true
    }
    waitingForOpponent.value = false
  })

  // Listening for lobby status
  socketStore.socket.on('lobby:waiting', (payload) => {
    lobbyId.value = payload.lobbyId || lobbyId.value
    waitingForOpponent.value = true
    successMessage.value = `Waiting for opponent... (Bet: ${selectedBet.value} coins)`
    console.log('Waiting in lobby:', payload.lobbyId)
  })

  // Listening for opponent leaving lobby
  socketStore.socket.on('lobby:player_left', (payload) => {
    console.log('Opponent left lobby:', payload)
    // Show different message based on who left
    if (userCanceledSearch.value) {
      errorMessage.value = 'Game canceled'
    } else {
      errorMessage.value = payload.message || 'Opponent left the lobby'
    }
    waitingForOpponent.value = false
    
    // Refund coins since game didn't start (only once)
    if (!coinsRefunded.value) {
      const currentCoins = Number(user.value?.coins_balance || 0)
      const refundCoins = Number(selectedBet.value || 0)
      const newCoins = currentCoins + refundCoins
      authStore.setUser({ ...user.value, coins_balance: newCoins })
      coinsRefunded.value = true
    }
    
    // Auto close after 3 seconds
    setTimeout(() => {
      errorMessage.value = ''
      router.push('/')
    }, 3000)
  })
})

// Clean up on unmount
onBeforeUnmount(() => {
  if (
    waitingForOpponent.value &&
    !leftLobby.value &&
    !socketStore.lastGameStartPayload.value
  ) {
    cancelWaiting()
  }

  // Note: Don't remove game:start listener - it's managed by the socket store and needed by other components
  socketStore.socket.off('error')
  socketStore.socket.off('lobby:waiting')
  socketStore.socket.off('lobby:player_left')
})
</script>

<template>
  <div class="min-h-screen bg-white p-4">
    <div class="max-w-md mx-auto">
      <!-- Header -->
      <div class="text-center mb-8 pt-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Multiplayer Lobby</h1>
        <p class="text-gray-600">Find an opponent and play Bisca!</p>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <!-- Connection Status -->
        <div
          :class="[
            'flex items-center gap-3 p-3 rounded-lg text-sm font-semibold',
            isConnected
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800',
          ]"
        >
          <div
            :class="[
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-green-600' : 'bg-red-600',
            ]"
          ></div>
          {{ isConnected ? 'Connected to server' : 'Connecting...' }}
        </div>

        <!-- Game Type Selection (if not waiting) -->
        <div v-if="!waitingForOpponent" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">
              Game Type
            </label>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="type in ['3', '9']"
                :key="type"
                @click="gameType = type"
                :class="[
                  'py-3 px-4 rounded-lg font-semibold transition',
                  gameType === type
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ]"
              >
                Bisca {{ type }} Cards
              </button>
            </div>
          </div>

          <!-- Bet Amount -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-3">
              Stake (coins)
            </label>
            
            <!-- Mode Selection -->
            <div class="grid grid-cols-2 gap-3 mb-4">
              <button
                @click="stakeMode = 'preset'"
                :class="[
                  'py-2 px-3 rounded-lg font-semibold text-sm transition',
                  stakeMode === 'preset'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ]"
              >
                3 Coins (Quick)
              </button>
              <button
                @click="stakeMode = 'custom'"
                :class="[
                  'py-2 px-3 rounded-lg font-semibold text-sm transition',
                  stakeMode === 'custom'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ]"
              >
                Custom (3-100)
              </button>
            </div>

            <!-- Preset Display / Custom Input -->
            <div v-if="stakeMode === 'preset'" class="space-y-2">

            </div>

            <div v-else class="space-y-2">
              <input
                v-model.number="customStake"
                type="number"
                min="3"
                max="100"
                placeholder="Enter stake (3-100)"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                @keyup.enter="joinLobby"
              />
              <p v-if="customStake" class="text-sm text-gray-600 text-center">
                Your stake: {{ customStake }} coins
              </p>
              <p v-if="customStakeError" class="text-sm text-red-600 text-center">
                {{ customStakeError }}
              </p>
            </div>
          </div>

          <!-- Messages -->
          <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <!-- Join Button -->
          <button
            @click="joinLobby"
            :disabled="isLoading || !isConnected"
            class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ isLoading ? 'Joining...' : 'Find Opponent' }}
          </button>

          <!-- Back Button -->
          <button
            @click="router.push('/')"
            class="w-full py-3 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Back to Home
          </button>
        </div>

        <!-- Waiting State -->
        <div v-else class="space-y-6 text-center">
          <div>
            <div class="mb-4">
              <div class="inline-block">
                <div class="animate-spin">
                  <div class="text-4xl">🔄</div>
                </div>
              </div>
            </div>
            <h2 class="text-xl font-bold text-gray-900 mb-2">
              Waiting for opponent...
            </h2>
            <p class="text-gray-600 mb-4">
              {{ successMessage }}
            </p>
            <p class="text-sm text-gray-500">
              Lobby: {{ lobbyId }}
            </p>
          </div>

          <!-- Cancel Button -->
          <button
            @click="cancelWaiting"
            class="w-full py-3 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>

    </div>
  </div>
</template>
