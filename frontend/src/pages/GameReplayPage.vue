<template>
  <div class="max-w-6xl mx-auto p-6 bg-background min-h-screen">
    <div class="flex items-center gap-4 mb-6">
      <button @click="goBack" class="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition">
        ← Back
      </button>
      <h1 class="text-2xl font-bold text-foreground">Game Replay #{{ gameId }}</h1>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="text-muted-foreground">Loading replay...</div>
    </div>

    <div v-else-if="error" class="bg-destructive/10 border border-destructive/30 rounded p-4 text-destructive">
      {{ error }}
    </div>

    <div v-else-if="game" class="space-y-6">
      <!-- Game Info Header -->
      <div class="bg-card text-card-foreground shadow rounded-lg p-6 border border-border">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div class="text-sm text-muted-foreground">Date</div>
            <div class="font-semibold text-foreground">{{ formatDate(game.began_at) }}</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">Duration</div>
            <div class="font-semibold text-foreground">{{ formatDuration(game.total_time) }}</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">Type</div>
            <div class="font-semibold text-foreground">Bisca {{ game.type }}</div>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-4">
          <div class="text-center p-4 rounded" :class="game.winner_user_id === game.player1_user_id ? 'bg-secondary/10 border border-secondary/30' : 'bg-muted/30 border border-border'">
            <div class="text-sm text-muted-foreground">Player 1</div>
            <div class="font-bold text-lg text-foreground">{{ game.player1?.nickname || 'Player 1' }}</div>
            <div class="text-2xl font-bold mt-2 text-foreground">{{ game.player1_points }} points</div>
            <div v-if="game.winner_user_id === game.player1_user_id" class="text-secondary font-semibold mt-1">
              🏆 Winner
            </div>
          </div>

          <div class="text-center p-4 rounded" :class="game.winner_user_id === game.player2_user_id ? 'bg-secondary/10 border border-secondary/30' : 'bg-muted/30 border border-border'">
            <div class="text-sm text-muted-foreground">Player 2</div>
            <div class="font-bold text-lg text-foreground">{{ game.player2?.nickname || 'Player 2' }}</div>
            <div class="text-2xl font-bold mt-2 text-foreground">{{ game.player2_points }} points</div>
            <div v-if="game.winner_user_id === game.player2_user_id" class="text-secondary font-semibold mt-1">
              🏆 Winner
            </div>
          </div>
        </div>
      </div>

      <!-- Tricks/Turns List -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-bold mb-4">Tricks ({{ tricks.length }} tricks)</h2>

        <div v-if="tricks.length === 0" class="text-center py-8 text-gray-500">
          No tricks recorded for this game.
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="trick in tricks" 
            :key="trick.id" 
            class="border rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="font-bold text-lg">Trick #{{ trick.trick_number }}</div>
              <div 
                class="px-3 py-1 rounded font-semibold"
                :class="trick.points_won > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ trick.points_won > 0 ? `+${trick.points_won}` : '0' }} points
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
              <!-- Card 1 -->
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div class="shrink-0">
                  <div class="w-16 h-24 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                    <div class="text-center">
                      <div class="text-2xl" :class="getSuitColor(trick.card1_suit)">
                        {{ getSuitSymbol(trick.card1_suit) }}
                      </div>
                      <div class="text-xl font-bold">{{ trick.card1_rank }}</div>
                    </div>
                  </div>
                </div>
                <div class="grow">
                  <div class="text-sm text-gray-600">Played by</div>
                  <div class="font-semibold">{{ trick.card1_player?.nickname || 'Player' }}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    Value: {{ trick.card1_value }} points
                  </div>
                </div>
              </div>

              <!-- Card 2 -->
              <div class="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <div class="shrink-0">
                  <div class="w-16 h-24 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                    <div class="text-center">
                      <div class="text-2xl" :class="getSuitColor(trick.card2_suit)">
                        {{ getSuitSymbol(trick.card2_suit) }}
                      </div>
                      <div class="text-xl font-bold">{{ trick.card2_rank }}</div>
                    </div>
                  </div>
                </div>
                <div class="grow">
                  <div class="text-sm text-gray-600">Played by</div>
                  <div class="font-semibold">{{ trick.card2_player?.nickname || 'Player' }}</div>
                  <div class="text-sm text-gray-500 mt-1">
                    Value: {{ trick.card2_value }} points
                  </div>
                </div>
              </div>
            </div>

            <!-- Winner -->
            <div class="flex items-center justify-between pt-3 border-t">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">Trick winner:</span>
                <span class="font-bold">{{ trick.winner?.nickname || 'Player' }}</span>
              </div>
              <div v-if="trick.trump_suit" class="text-sm text-gray-600">
                Trump: <span class="font-semibold" :class="getSuitColor(trick.trump_suit)">
                  {{ getSuitSymbol(trick.trump_suit) }} {{ getSuitName(trick.trump_suit) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'

const route = useRoute()
const router = useRouter()
const api = useAPIStore()

const gameId = computed(() => route.params.id)
const game = ref(null)
const tricks = ref([])
const loading = ref(true)
const error = ref(null)

const fetchGameReplay = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.getGameReplay(gameId.value)
    game.value = response.data.data.game
    tricks.value = response.data.data.tricks || []
  } catch (e) {
    console.error('Error fetching game replay:', e)
    error.value = e.response?.data?.error || 'Error loading game replay'
  } finally {
    loading.value = false
  }
}

onMounted(fetchGameReplay)

const goBack = () => {
  router.push('/history')
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return 'N/A'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}

const getSuitSymbol = (suit) => {
  const symbols = {
    'H': '♥',
    'D': '♦',
    'C': '♣',
    'S': '♠'
  }
  return symbols[suit] || suit
}

const getSuitColor = (suit) => {
  return (suit === 'H' || suit === 'D') ? 'text-red-600' : 'text-gray-800'
}

const getSuitName = (suit) => {
  const names = {
    'H': 'Copas',
    'D': 'Ouros',
    'C': 'Paus',
    'S': 'Espadas'
  }
  return names[suit] || suit
}
</script>
