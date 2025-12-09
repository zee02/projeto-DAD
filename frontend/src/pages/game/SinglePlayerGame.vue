<!-- src/pages/game/SinglePlayerGame.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BiscaEngine, SUIT_SYMBOL } from '@/stores/biscaEngine'

const route = useRoute()
const router = useRouter()

// '3' ou '9'
const mode = computed(() => (route.query.mode === '9' ? '9' : '3'))

const engine = ref(null)
const state = ref(null)
const message = ref('')

// inicia o jogo
const initGame = () => {
  engine.value = new BiscaEngine(mode.value)
  state.value = engine.value.getState()
  message.value = 'Your turn'
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
  state.value = engine.value.getState()

  if (state.value.gameOver) {
    showEndMessage()
  } else if (state.value.currentPlayer === 'player') {
    message.value = 'Your turn'
  } else {
    message.value = "Bot is playing..."
    // o bot já joga automaticamente dentro da engine; apenas refrescamos o estado
    state.value = engine.value.getState()
    if (state.value.gameOver) {
      showEndMessage()
    } else if (state.value.currentPlayer === 'player') {
      message.value = 'Your turn'
    }
  }
}

const showEndMessage = () => {
  if (!state.value) return
  const { scores, winner } = state.value
  if (winner === 'player') {
    message.value = `You win! (${scores.player} vs ${scores.bot})`
  } else if (winner === 'bot') {
    message.value = `You lose. (${scores.player} vs ${scores.bot})`
  } else {
    message.value = `Draw. (${scores.player} vs ${scores.bot})`
  }
}

// restart
const restart = () => {
  initGame()
}

// voltar ao home
const goBack = () => {
  router.push({ name: 'home' }) // ajusta se o nome da tua rota inicial for outro
}

const suitSymbol = suit => SUIT_SYMBOL[suit] || '?'
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
    <div class="w-full max-w-5xl bg-white shadow-xl rounded-2xl p-6 flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-2">
        <div>
          <h1 class="text-2xl font-bold">{{ gameTitle }}</h1>
          <p class="text-sm text-gray-600">
            Trump suit:
            <span v-if="state" class="font-semibold">
              {{ suitSymbol(state.trumpSuit) }}
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
            class="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
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
        class="flex flex-col items-center justify-center py-6 gap-4 border rounded-xl bg-slate-50"
      >
        <div class="text-xs uppercase tracking-wide text-slate-500">
          Table
        </div>
        <div class="flex gap-8">
          <div class="flex flex-col items-center">
            <span class="text-xs text-slate-500 mb-1">Bot</span>
            <div
              v-if="state.table.find(p => p.owner === 'bot')"
              class="w-20 h-28 border rounded-lg flex items-center justify-center text-xl bg-white shadow"
            >
              <span>
                {{
                  state.table.find(p => p.owner === 'bot').card.rank
                }}
                {{
                  suitSymbol(
                    state.table.find(p => p.owner === 'bot').card.suit
                  )
                }}
              </span>
            </div>
            <div v-else class="w-20 h-28 border rounded-lg bg-slate-200" />
          </div>

          <div class="flex flex-col items-center">
            <span class="text-xs text-slate-500 mb-1">You</span>
            <div
              v-if="state.table.find(p => p.owner === 'player')"
              class="w-20 h-28 border rounded-lg flex items-center justify-center text-xl bg-white shadow"
            >
              <span>
                {{
                  state.table.find(p => p.owner === 'player').card.rank
                }}
                {{
                  suitSymbol(
                    state.table.find(p => p.owner === 'player').card.suit
                  )
                }}
              </span>
            </div>
            <div v-else class="w-20 h-28 border rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>

      <!-- Mão do Bot -->
      <div v-if="state" class="mt-4 flex flex-col items-center">
        <span class="text-xs text-slate-500 mb-1">Bot hand</span>
        <div class="flex gap-2">
          <div
            v-for="n in state.botHandCount"
            :key="n"
            class="w-12 h-18 sm:w-14 sm:h-20 bg-slate-400 rounded-md shadow"
          />
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
            class="w-16 h-24 sm:w-20 sm:h-28 bg-white border rounded-xl shadow flex items-center justify-center text-xl hover:-translate-y-1 hover:shadow-lg transition"
            @click="onCardClick(card)"
          >
            <span
              :class="[
                card.suit === 'H' || card.suit === 'D'
                  ? 'text-red-600'
                  : 'text-slate-800'
              ]"
            >
              {{ card.rank }} {{ suitSymbol(card.suit) }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* pequeno fix para altura dos "rectângulos" da mão do bot */
.h-18 {
  height: 4.5rem;
}
</style>
