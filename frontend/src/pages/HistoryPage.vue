<template>
  <div class="max-w-5xl mx-auto p-6 bg-background min-h-screen">
    <h1 class="text-2xl font-bold mb-4 text-foreground">My Game History</h1>

    <div class="bg-card text-card-foreground shadow rounded-lg p-4 mb-4 border border-border">
      <div class="flex items-center justify-between mb-3">
        <div class="flex gap-3 items-center">
          <label class="text-sm text-muted-foreground">Type</label>
          <select v-model="filters.type" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
            <option value="">All</option>
            <option value="3">Bisca 3</option>
            <option value="9">Bisca 9</option>
          </select>

          <label class="text-sm text-muted-foreground ml-4">Status</label>
          <select v-model="filters.status" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none">
            <option value="">Todos</option>
            <option value="Pending">Pending</option>
            <option value="Playing">Playing</option>
            <option value="Ended">Ended</option>
            <option value="Interrupted">Interrupted</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button @click="reload" class="px-3 py-1 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/80 transition">Apply</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left table-auto border-collapse">
          <thead>
            <tr class="text-sm text-muted-foreground border-b border-border">
              <th class="p-2 text-foreground font-semibold">Date</th>
              <th class="p-2 text-foreground font-semibold">Opponent</th>
              <th class="p-2 text-foreground font-semibold">Result</th>
              <th class="p-2 text-foreground font-semibold">Points</th>
              <th class="p-2 text-foreground font-semibold">Duration</th>
              <th class="p-2 text-foreground font-semibold">Type</th>
              <th class="p-2 text-foreground font-semibold">Status</th>
              <th class="p-2 text-foreground font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in games" :key="g.id" class="border-t border-border text-sm hover:bg-muted/30 transition">
              <td class="p-2 text-foreground">{{ formatDate(g.began_at) }}</td>
              <td class="p-2 text-foreground">{{ opponentName(g) }}</td>
              <td class="p-2 text-foreground">{{ resultLabel(g) }}</td>
              <td class="p-2 text-foreground">{{ pointsLabel(g) }}</td>
              <td class="p-2 text-foreground">{{ durationLabel(g) }}</td>
              <td class="p-2 text-foreground">{{ g.type }}</td>
              <td class="p-2 text-foreground">{{ g.status }}</td>
              <td class="p-2">
                <button 
                  v-if="g.status === 'Ended'"
                  @click="viewReplay(g.id)" 
                  class="px-3 py-1 bg-primary text-primary-foreground rounded text-xs hover:bg-primary/80 transition"
                >
                  View Replay
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-muted-foreground">Page {{ meta.current_page }} of {{ meta.last_page || 1 }}</div>
        <div class="flex gap-2">
          <button class="px-3 py-1 border border-border rounded text-foreground hover:bg-muted/50 transition disabled:opacity-50" @click="prevPage" :disabled="meta.current_page <= 1">Previous</button>
          <button class="px-3 py-1 border border-border rounded text-foreground hover:bg-muted/50 transition disabled:opacity-50" @click="nextPage" :disabled="meta.current_page >= (meta.last_page || 1)">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const api = useAPIStore()
const auth = useAuthStore()

const games = ref([])
const meta = ref({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
const filters = ref({ type: '', status: '' })

const fetch = async () => {
  try {
    const params = {
      page: meta.value.current_page,
      per_page: meta.value.per_page,
      ...(filters.value.type && { type: filters.value.type }),
      ...(filters.value.status && { status: filters.value.status }),
    }
    const res = await api.getMyGames(params)
    games.value = res.data.data
    meta.value = res.data.meta
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetch)

const reload = () => {
  meta.value.current_page = 1
  fetch()
}

const prevPage = () => {
  if (meta.value.current_page > 1) {
    meta.value.current_page -= 1
    fetch()
  }
}

const nextPage = () => {
  if (meta.value.current_page < (meta.value.last_page || 1)) {
    meta.value.current_page += 1
    fetch()
  }
}

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString()
}

const opponentName = (g) => {
  const myId = auth.currentUserID || auth.user?.id
  if (!myId) return 'Anonymous'

  let opp = null
  if (g.player1_user_id === myId) opp = g.player2
  else if (g.player2_user_id === myId) opp = g.player1

  if (!opp) return 'Anonymous'
  // Prefer nickname, then name, otherwise Anonymous
  return opp.nickname || opp.name || 'Anonymous'
}

const resultLabel = (g) => {
  const myId = auth.currentUserID || auth.user?.id
  if (!myId) return '-'
  if (g.is_draw) return 'Draw'
  if (g.winner_user_id === myId) return 'Victory'
  if (g.loser_user_id === myId) return 'Defeat'
  return '-'
}

const pointsLabel = (g) => {
  const myId = auth.currentUserID || auth.user?.id
  if (g.player1_user_id === myId) return `${g.player1_points || 0}`
  if (g.player2_user_id === myId) return `${g.player2_points || 0}`
  return '-'
}

const durationLabel = (g) => {
  if (!g.total_time) return '-'
  const totalSeconds = Math.round(g.total_time)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const viewReplay = (gameId) => {
  router.push(`/game-replay/${gameId}`)
}
</script>

<style scoped>
table th, table td { white-space: nowrap }
</style>
