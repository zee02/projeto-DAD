<!-- src/pages/game/SinglePlayerGame.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BiscaEngine, SUIT_SYMBOL } from '@/stores/biscaEngine'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const apiStore = useAPIStore()
const authStore = useAuthStore()

// '3' ou '9'
const mode = computed(() => (route.query.mode === '9' ? '9' : '3'))

const engine = ref(null)
const state = ref(null)
const message = ref('')
let botPlayTimeout = null // flag para evitar múltiplos triggers
let gameStartTime = null

// inicia o jogo
const initGame = () => {
  engine.value = new BiscaEngine(mode.value)
  state.value = engine.value.getState()
  message.value = state.value.currentPlayer === 'player' ? 'Your turn' : 'Bot is thinking...'
  gameStartTime = new Date()
  
  // se for a vez do bot no início, faz ele jogar
  if (state.value.currentPlayer === 'bot') {
    scheduleBotPlay()
  }
}

onMounted(() => {
  initGame()
})

// helpers para UI
const isPlayerTurn = computed(
  () => state.value && state.value.currentPlayer === 'player'
)

const gameTitle = computed(() =>
  mode.value === '9' ? 'Bisca – 9 Cards (Singleplayer)' : 'Bisca – 3 Cards (Singleplayer)'
)

// clique na carta do jogador
const onCardClick = card => {
  if (!engine.value || state.value.gameOver) return
  if (!isPlayerTurn.value) {
    message.value = "Wait for the bot's move."
    return
  }

  engine.value.playerPlayCard(card.id)
  // force reactivity - show player card immediately
  state.value = { ...engine.value.getState() }
  
  // se há 2 cartas na mesa (jogador jogou em segundo), resolver após delay
  if (state.value.table.length === 2) {
    message.value = 'Resolving...'
    setTimeout(() => {
      engine.value.resolveTrick()
      state.value = { ...engine.value.getState() }
      
      if (state.value.gameOver) {
        showEndMessage()
      } else if (state.value.currentPlayer === 'player') {
        message.value = 'Your turn'
      } else if (state.value.currentPlayer === 'bot') {
        message.value = 'Bot is thinking...'
        scheduleBotPlay()
      }
    }, 1500)
  } else if (state.value.currentPlayer === 'bot') {
    // bot vai jogar em segundo
    scheduleBotPlay()
  }
}

const scheduleBotPlay = () => {
  if (botPlayTimeout) return // evita múltiplos triggers
  
  botPlayTimeout = setTimeout(() => {
    botPlayTimeout = null
    
    if (!engine.value || state.value.gameOver || state.value.currentPlayer !== 'bot') {
      return
    }

    engine.value.botAutoPlay()
    state.value = { ...engine.value.getState() }
    message.value = 'Waiting...'

    // delay para ver as 2 cartas antes de resolver a vaza
    setTimeout(() => {
      // resolver a vaza se houver 2 cartas
      if (state.value.table.length === 2) {
        engine.value.resolveTrick()
      }
      
      state.value = { ...engine.value.getState() }

      if (state.value.gameOver) {
        showEndMessage()
      } else if (state.value.currentPlayer === 'player') {
        message.value = 'Your turn'
      } else if (state.value.currentPlayer === 'bot') {
        message.value = 'Bot is thinking...'
        scheduleBotPlay()
      }
    }, 1500)
  }, 1500)
}

const showEndModal = ref(false)
const endSummary = ref({ text: '', winner: null })

const showEndMessage = async () => {
  if (!state.value) return
  const { scores, winner } = state.value
  if (winner === 'player') {
    endSummary.value = { text: `You win! (${scores.player} vs ${scores.bot})`, winner: 'player' }
  } else if (winner === 'bot') {
    endSummary.value = { text: `You lose. (${scores.player} vs ${scores.bot})`, winner: 'bot' }
  } else {
    endSummary.value = { text: `Draw. (${scores.player} vs ${scores.bot})`, winner: null }
  }
  // Show confirmation modal; save occurs on confirmation
  showEndModal.value = true
}

const saveGameToDatabase = async () => {
  if (!authStore.user) {
    console.log('User not authenticated, game not saved')
    return
  }

  const gameEndTime = new Date()
  const totalTimeSeconds = (gameEndTime - gameStartTime) / 1000

  // Verificar se foi capote ou flag
  const playerMarks = state.value.marks.player || 0
  const isCapote = playerMarks === 2
  const isFlag = playerMarks === 3

  const gameData = {
    type: mode.value,
    player1_user_id: authStore.user.id,
    player2_user_id: null, // bot não tem user_id
    is_draw: state.value.winner === null,
    winner_user_id: state.value.winner === 'player' ? authStore.user.id : null,
    loser_user_id: state.value.winner === 'bot' ? authStore.user.id : null,
    began_at: gameStartTime.toISOString(),
    ended_at: gameEndTime.toISOString(),
    total_time: totalTimeSeconds,
    player1_points: state.value.scores.player,
    player2_points: state.value.scores.bot,
    custom: {
      mode: 'singleplayer',
      opponent: 'bot',
      capote: isCapote,
      flag: isFlag,
      player_marks: playerMarks,
      bot_marks: state.value.marks.bot || 0
    }
  }

  try {
    console.log('Sending gameData:', gameData)
    await apiStore.postSaveGame(gameData)
    console.log('Game saved successfully')
  } catch (error) {
    console.error('Failed to save game:', error)
    if (error.response?.data) {
      console.error('API error details:', error.response.data)
    }
  }
}

// restart
const restart = () => {
  initGame()
}

// voltar ao home
const goBack = () => {
  router.push('/')
}

const confirmEnd = async () => {
  try {
    await saveGameToDatabase()
  } finally {
    showEndModal.value = false
    router.push('/')
  }
}

const suitSymbol = suit => SUIT_SYMBOL[suit] || '?'

// map suits to card filename prefix (c=hearts, e=spades, o=diamonds, p=clubs)
const getSuitPrefix = suit => {
  const suitMap = { H: 'c', S: 'e', D: 'o', C: 'p' }
  return suitMap[suit] || 'c'
}

// map rank to card filename number
const getRankNumber = rank => {
  const rankMap = { A: '1', J: '11', Q: '12', K: '13' }
  return rankMap[rank] || rank
}

// get card image path
const getCardImagePath = card => {
  const prefix = getSuitPrefix(card.suit)
  const number = getRankNumber(card.rank)
  return `/cards/${prefix}${number}.png`
}

// get back of card image (used for bot hand)
const getCardBackImagePath = () => '/cards/semFace.png'
</script>

<template>
  <div class="min-h-screen bg-background flex flex-col items-center py-8 px-4">
    <div class="w-full max-w-5xl bg-card text-card-foreground shadow-xl rounded-2xl p-6 flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-2xl font-bold text-foreground">{{ gameTitle }}</h1>
          <p class="text-sm text-muted-foreground">
            Trump suit:
            <span v-if="state" class="font-semibold text-foreground">
              {{ suitSymbol(state.trumpSuit) }}
            </span>
          </p>
        </div>
        <div class="flex gap-2">
          <button
            class="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition"
            @click="goBack"
          >
            Back
          </button>
          <button
            class="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/80 transition"
            @click="restart"
          >
            Restart
          </button>
        </div>
      </div>

      <!-- Info Bar -->
      <div v-if="state" class="grid grid-cols-2 gap-4 text-sm">
        <div class="bg-slate-50 border rounded-lg p-3">
          <div class="font-semibold mb-1">Game info</div>
          <p>Phase: <span class="font-medium">{{ state.phase }}</span></p>
          <p>Deck: <span class="font-medium">{{ state.deckCount }}</span> cards left</p>
          <p>
            Tricks - You:
            <span class="font-medium">{{ state.playerTricksCount }}</span> |
            Bot:
            <span class="font-medium">{{ state.botTricksCount }}</span>
          </p>
        </div>

        <div class="bg-slate-50 border rounded-lg p-3">
          <div class="font-semibold mb-1">Scores</div>
          <p>
            You:
            <span class="font-medium">{{ state.scores.player }}</span>
          </p>
          <p>
            Bot:
            <span class="font-medium">{{ state.scores.bot }}</span>
          </p>
          <p v-if="state.gameOver" class="mt-1">
            Winner:
            <span class="font-bold">
              {{
                state.winner === 'player'
                  ? 'You'
                  : state.winner === 'bot'
                  ? 'Bot'
                  : 'Draw'
              }}
            </span>
          </p>
        </div>
      </div>

      <!-- Mensagem -->
      <div class="mt-1 text-center text-base font-medium text-indigo-700">
        {{ message }}
      </div>

      <!-- Mesa (cartas jogadas) -->
      <div
        v-if="state"
        class="flex items-center justify-between py-6 px-6 border rounded-xl bg-slate-50"
      >
        <!-- Trump Card - à esquerda com margem -->
        <div class="flex items-center justify-center w-20">
          <div v-if="state.trumpCard" class="w-16 h-24 overflow-hidden shadow">
            <img
              :src="getCardImagePath(state.trumpCard)"
              :alt="`Trump: ${state.trumpCard.rank} of ${state.trumpCard.suit}`"
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
              <span class="text-xs text-slate-500 mb-1">Bot</span>
              <div
                v-if="state.table.find(p => p.owner === 'bot')"
                class="w-20 h-28 overflow-hidden shadow"
              >
                <img
                  :src="getCardImagePath(state.table.find(p => p.owner === 'bot').card)"
                  :alt="`${state.table.find(p => p.owner === 'bot').card.rank} of ${state.table.find(p => p.owner === 'bot').card.suit}`"
                  class="w-full h-full object-cover"
                />
              </div>
              <div v-else class="w-20 h-28 border rounded-lg bg-slate-200" />
            </div>

            <div class="flex flex-col items-center">
              <span class="text-xs text-slate-500 mb-1">You</span>
              <div
                v-if="state.table.find(p => p.owner === 'player')"
                class="w-20 h-28 overflow-hidden shadow"
              >
                <img
                  :src="getCardImagePath(state.table.find(p => p.owner === 'player').card)"
                  :alt="`${state.table.find(p => p.owner === 'player').card.rank} of ${state.table.find(p => p.owner === 'player').card.suit}`"
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

      <!-- Mão do Bot -->
      <div v-if="state" class="mt-4 flex flex-col items-center">
        <span class="text-xs text-slate-500 mb-1">Bot hand</span>
        <div class="flex gap-2">
          <div
            v-for="n in state.botHandCount"
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

      <!-- Mão do Jogador -->
      <div
        v-if="state"
        class="mt-6 flex flex-col items-center border-t pt-4"
      >
        <span class="text-xs text-slate-500 mb-2">Your hand</span>
        <div class="flex flex-wrap justify-center gap-3">
          <button
            v-for="card in state.playerHand"
            :key="card.id"
            class="w-16 h-24 sm:w-18 sm:h-28 shadow flex items-center justify-center overflow-hidden hover:-translate-y-1 hover:shadow-lg transition flex-shrink-0"
            @click="onCardClick(card)"
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
  </div>

  <!-- End-of-game modal -->
  <div v-if="showEndModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
      <h2 class="text-xl font-semibold mb-2">Game Over</h2>
      <p class="text-sm text-slate-700 mb-4">{{ endSummary.text }}</p>
      <div class="flex justify-end gap-2">
        <button class="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80" @click="restart">Restart</button>
        <button class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80" @click="confirmEnd">OK</button>
      </div>
      <p v-if="!authStore.user" class="mt-3 text-xs text-red-600">Login required to save game.</p>
    </div>
  </div>
</template>

<style scoped>
/* pequeno fix para altura dos "rectângulos" da mão do bot */
.h-18 {
  height: 4.5rem;
}
</style>
