<template>
  <div class="min-h-screen bg-background p-4 md:p-8">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold text-foreground">🏆 Complete Leaderboards</h1>
          <p class="text-muted-foreground text-sm mt-2">View all player rankings across all stats</p>
        </div>
        <button 
          @click="() => { fetchAll(); searchQuery = '' }"
          class="px-4 py-2 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center gap-2 w-fit">
          <span>↻</span> Refresh
        </button>
      </div>
    </div>

    <!-- Leaderboards Card -->
    <div class="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
      <!-- Card Header -->
      <div class="px-6 py-4 border-b border-border bg-muted/30">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-card-foreground">Player Rankings</h2>
            <p class="text-sm text-muted-foreground mt-1">Click column headers to sort</p>
          </div>
          <!-- Search Box -->
          <div class="relative">
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search player name..."
              class="pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64 bg-input text-foreground"
            />
            <span class="absolute left-3 top-2.5 text-muted-foreground">🔍</span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-muted/50 border-b border-border">
              <th :class="headerClass('total')" @click="setSort('total')" class="text-left">
                <div class="flex items-center gap-2 cursor-pointer hover:text-foreground">
                  Rank
                  <span v-if="sortBy==='total'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('name')" @click="setSort('name')" class="text-left">
                <div class="flex items-center gap-2 cursor-pointer hover:text-foreground">
                  Player
                  <span v-if="sortBy==='name'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('wins')" @click="setSort('wins')" class="text-center">
                <div class="flex items-center justify-center gap-2 cursor-pointer hover:text-foreground">
                  ⭐ Wins
                  <span v-if="sortBy==='wins'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('capotes')" @click="setSort('capotes')" class="text-center">
                <div class="flex items-center justify-center gap-2 cursor-pointer hover:text-foreground">
                  🎯 Capotes
                  <span v-if="sortBy==='capotes'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('flags')" @click="setSort('flags')" class="text-center">
                <div class="flex items-center justify-center gap-2 cursor-pointer hover:text-foreground">
                  🏴 Flags
                  <span v-if="sortBy==='flags'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('gamesPlayed')" @click="setSort('gamesPlayed')" class="text-center">
                <div class="flex items-center justify-center gap-2 cursor-pointer hover:text-foreground">
                  🎮 Games Played
                  <span v-if="sortBy==='gamesPlayed'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, idx) in pageItems" :key="p.user_id" class="border-b border-border hover:bg-muted/50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white text-sm"
                    :class="{
                      'bg-yellow-500': displayRank(p, idx) === 1,
                      'bg-gray-400': displayRank(p, idx) === 2,
                      'bg-orange-500': displayRank(p, idx) === 3,
                      'bg-muted-foreground/60': displayRank(p, idx) > 3
                    }">
                    {{ displayRank(p, idx) }}
                  </div>
                  <span class="font-semibold text-foreground">{{ displayRank(p, idx) === 1 ? '👑' : displayRank(p, idx) === 2 ? '🥈' : displayRank(p, idx) === 3 ? '🥉' : '' }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="font-medium text-foreground">{{ p.nickname || p.name || ('#' + p.user_id) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-semibold text-primary">{{ p.wins || 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-semibold text-primary">{{ p.capotes || 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-semibold text-primary">{{ p.flags || 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-bold text-foreground bg-muted px-3 py-1 rounded-full text-sm">{{ p.gamesPlayed || 0 }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          Page <span class="font-semibold">{{ currentPage }}</span> of <span class="font-semibold">{{ totalPages }}</span> 
          <span class="text-xs text-muted-foreground/70 ml-4">({{ filteredCombined.length }} {{ searchQuery ? 'filtered' : 'total' }} players)</span>
        </div>
        <div class="flex gap-2">
          <button 
            @click="prevPage" 
            :disabled="currentPage <= 1"
            class="px-4 py-2 border border-border rounded-lg font-semibold text-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground">
            ← Previous
          </button>
          <button 
            @click="nextPage" 
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 border border-border rounded-lg font-semibold text-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground">
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const api = useAPIStore()
const allMap = ref({})
const combined = ref([])
const sortBy = ref('gamesPlayed')
const sortDir = ref('desc')
const perPage = ref(25)
const currentPage = ref(1)
const searchQuery = ref('')

const filteredCombined = computed(() => {
  if (!searchQuery.value.trim()) {
    return combined.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return combined.value.filter((player) => {
    const name = (player.nickname || player.name || '').toLowerCase()
    return name.includes(query)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredCombined.value.length / perPage.value)))

const pageItems = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredCombined.value.slice(start, start + perPage.value)
})

// Reset to page 1 when search changes
watch(searchQuery, () => {
  currentPage.value = 1
})

const rankMaps = ref({ wins: {}, capotes: {}, flags: {}, gamesPlayed: {} })

const computeRankMaps = () => {
  const keys = ['wins', 'capotes', 'flags', 'gamesPlayed']
  keys.forEach((k) => {
    const arr = [...combined.value]
    arr.sort((a, b) => (b[k] || 0) - (a[k] || 0))
    const map = {}
    let prevVal = null
    let prevRank = 0
    arr.forEach((it, idx) => {
      const val = it[k] || 0
      if (prevVal !== null && val === prevVal) {
        // tie: same rank as previous
        map[it.user_id] = prevRank
      } else {
        // competition ranking: rank = index + 1 (skips when ties)
        const rank = idx + 1
        map[it.user_id] = rank
        prevRank = rank
        prevVal = val
      }
    })
    rankMaps.value[k] = map
  })
}

const fetchAll = async () => {
  try {
    // fetch top N from each leaderboard and merge locally
    const per = 200
    const [wRes, cRes, fRes, gRes] = await Promise.all([
      api.getLeaderboards('wins', 1, per),
      api.getLeaderboards('capotes', 1, per),
      api.getLeaderboards('flags', 1, per),
      api.getLeaderboards('games-played', 1, per),
    ])

    const map = {}

    const ingest = (arr, key) => {
      (arr || []).forEach((r) => {
        const id = r.user_id || r.userId || r.id
        if (!id) return
        if (!map[id]) map[id] = { user_id: id, name: r.name, nickname: r.nickname }
        map[id][key] = (map[id][key] || 0) + (r.count || 0)
      })
    }

    ingest(wRes.data.data, 'wins')
    ingest(cRes.data.data, 'capotes')
    ingest(fRes.data.data, 'flags')
    ingest(gRes.data.data, 'gamesPlayed')

    // compute totals and convert to array
    const arr = Object.values(map)
    arr.forEach((it) => {
      it.wins = it.wins || 0
      it.capotes = it.capotes || 0
      it.flags = it.flags || 0
      it.gamesPlayed = it.gamesPlayed || 0
    })
    combined.value = arr
    // compute rank mappings (1 = most)
    computeRankMaps()
    sortCombined()
    currentPage.value = 1
  } catch (e) {
    console.error(e)
    toast.error('Failed to load leaderboards')
  }
}

onMounted(fetchAll)

const sortCombined = () => {
  const key = sortBy.value
  combined.value.sort((a, b) => {
    // name/player sorting uses string compare
    if (key === 'name' || key === 'player') {
      const an = (a.nickname || a.name || '')
      const bn = (b.nickname || b.name || '')
      const cmp = an.localeCompare(bn, undefined, { sensitivity: 'base' })
      return sortDir.value === 'desc' ? -cmp : cmp
    }
    const av = a[key] || 0
    const bv = b[key] || 0
    return sortDir.value === 'desc' ? bv - av : av - bv
  })
}

const setSort = (s) => {
  if (s === sortBy.value) {
    // toggle direction
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = s
    sortDir.value = 'desc'
  }
  sortCombined()
  currentPage.value = 1
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const displayRank = (user, idx) => {
  const key = sortBy.value
  if (['wins', 'capotes', 'flags', 'gamesPlayed'].includes(key)) {
    const map = rankMaps.value[key] || {}
    return map[user.user_id] || ((currentPage.value - 1) * perPage.value + idx + 1)
  }
  // otherwise show current row position
  return (currentPage.value - 1) * perPage.value + idx + 1
}

const headerClass = (s) => ['p-2 cursor-pointer select-none', sortBy.value === s ? 'font-semibold text-gray-900' : 'text-gray-700']
</script>

<style scoped>
button { outline: none }
</style>
