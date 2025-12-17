<template>
  <div class="max-w-5xl mx-auto p-6">
    <h1 class="text-2xl font-bold mb-4">My Game History</h1>

    <div class="bg-white shadow rounded-lg p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex gap-3 items-center">
          <label class="text-sm text-gray-600">Type</label>
          <select v-model="filters.type" class="border rounded px-2 py-1 text-sm">
            <option value="">All</option>
            <option value="3">Bisca 3</option>
            <option value="9">Bisca 9</option>
          </select>

          <label class="text-sm text-gray-600 ml-4">Status</label>
          <select v-model="filters.status" class="border rounded px-2 py-1 text-sm">
            <option value="">Todos</option>
            <option value="Pending">Pending</option>
            <option value="Playing">Playing</option>
            <option value="Ended">Ended</option>
            <option value="Interrupted">Interrupted</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button @click="reload" class="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Apply</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left table-auto border-collapse">
          <thead>
            <tr class="text-sm text-gray-600">
              <th class="p-2">Date</th>
              <th class="p-2">Opponent</th>
              <th class="p-2">Result</th>
              <th class="p-2">Points</th>
              <th class="p-2">Duration</th>
              <th class="p-2">Type</th>
              <th class="p-2">Status</th>
              <th class="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="g in games" :key="g.id" class="border-t text-sm hover:bg-gray-50">
              <td class="p-2">{{ formatDate(g.began_at) }}</td>
              <td class="p-2">{{ opponentName(g) }}</td>
              <td class="p-2">{{ resultLabel(g) }}</td>
              <td class="p-2">{{ pointsLabel(g) }}</td>
              <td class="p-2">{{ durationLabel(g) }}</td>
              <td class="p-2">{{ g.type }}</td>
              <td class="p-2">{{ g.status }}</td>
              <td class="p-2">
                <button 
                  v-if="g.status === 'Ended'"
                  @click="viewReplay(g.id)" 
                  class="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                >
                  View Replay
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm text-gray-600">Page {{ meta.current_page }} of {{ meta.last_page || 1 }}</div>
        <div class="flex gap-2">
          <button class="px-3 py-1 border rounded" @click="prevPage" :disabled="meta.current_page <= 1">Previous</button>
          <button class="px-3 py-1 border rounded" @click="nextPage" :disabled="meta.current_page >= (meta.last_page || 1)">Next</button>
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
