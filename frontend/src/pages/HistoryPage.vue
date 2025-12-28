<template>
  <div class="max-w-5xl mx-auto p-6 bg-background min-h-screen">
    <h1 class="text-2xl font-bold mb-4 text-foreground">My Game History</h1>

    <div class="bg-card text-card-foreground shadow rounded-lg p-4 mb-4 border border-border">
      <div class="flex flex-col gap-3 mb-3">
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-sm text-muted-foreground">Type</label>
          <select v-model="filters.type" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none">
            <option value="">All</option>
            <option value="3">Bisca 3</option>
            <option value="9">Bisca 9</option>
          </select>

          <label class="text-sm text-muted-foreground ml-2">Status</label>
          <select v-model="filters.status" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none">
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Playing">Playing</option>
            <option value="Ended">Ended</option>
            <option value="Interrupted">Interrupted</option>
          </select>

          <label class="text-sm text-muted-foreground ml-2">Opponent</label>
          <input v-model="columnFilters.opponent" type="text" placeholder="Name or nickname" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none w-40" />

          <label class="text-sm text-muted-foreground ml-2">Result</label>
          <select v-model="columnFilters.result" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none">
            <option value="">All</option>
            <option value="Victory">Victory</option>
            <option value="Defeat">Defeat</option>
            <option value="Draw">Draw</option>
          </select>

          <label class="text-sm text-muted-foreground ml-2">Points</label>
          <input v-model.number="columnFilters.pointsMin" type="number" min="0" placeholder="min" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground w-20" />
          <span class="text-muted-foreground">–</span>
          <input v-model.number="columnFilters.pointsMax" type="number" min="0" placeholder="max" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground w-20" />

          <label class="text-sm text-muted-foreground ml-2">Date</label>
          <input v-model="columnFilters.dateFrom" type="date" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground" />
          <span class="text-muted-foreground">→</span>
          <input v-model="columnFilters.dateTo" type="date" class="border border-border rounded px-2 py-1 text-sm bg-input text-foreground" />
        </div>

        <div class="flex items-center gap-2 justify-end">
          <button @click="reload" class="px-3 py-1 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/80 transition">Apply</button>
          <button @click="resetColumnFilters" class="px-3 py-1 rounded bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition">Reset</button>
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
            <tr v-for="g in filteredGames" :key="g.id" class="border-t border-border text-sm hover:bg-muted/30 transition">
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
        <div class="text-sm text-muted-foreground">Page {{ meta.current_page }} of {{ meta.last_page || 1 }} · Showing {{ filteredGames.length }} of {{ games.length }} on this page</div>
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
const columnFilters = ref({ opponent: '', result: '', pointsMin: null, pointsMax: null, dateFrom: '', dateTo: '' })

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

const resetColumnFilters = () => {
  columnFilters.value = { opponent: '', result: '', pointsMin: null, pointsMax: null, dateFrom: '', dateTo: '' }
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

const myPointsValue = (g) => {
  const myId = auth.currentUserID || auth.user?.id
  if (!myId) return null
  if (g.player1_user_id === myId) return Number(g.player1_points || 0)
  if (g.player2_user_id === myId) return Number(g.player2_points || 0)
  return null
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

const filteredGames = computed(() => {
  const list = Array.isArray(games.value) ? games.value : []
  return list.filter(g => {
    // Opponent filter
    const oppName = opponentName(g).toLowerCase()
    const oppTerm = (columnFilters.value.opponent || '').toLowerCase().trim()
    const matchOpponent = !oppTerm || oppName.includes(oppTerm)

    // Result filter
    const res = resultLabel(g)
    const matchResult = !columnFilters.value.result || res === columnFilters.value.result

    // Points range filter (my points)
    const myPts = myPointsValue(g)
    const minOk = columnFilters.value.pointsMin == null || (myPts != null && myPts >= columnFilters.value.pointsMin)
    const maxOk = columnFilters.value.pointsMax == null || (myPts != null && myPts <= columnFilters.value.pointsMax)

    // Date range filter (began_at)
    let dateOk = true
    if (columnFilters.value.dateFrom) {
      const from = new Date(columnFilters.value.dateFrom)
      const began = g.began_at ? new Date(g.began_at) : null
      dateOk = began ? began >= from : false
    }
    if (dateOk && columnFilters.value.dateTo) {
      const to = new Date(columnFilters.value.dateTo)
      const began = g.began_at ? new Date(g.began_at) : null
      dateOk = began ? began <= to : false
    }

    return matchOpponent && matchResult && minOk && maxOk && dateOk
  })
})
</script>

<style scoped>
table th, table td { white-space: nowrap }
</style>
