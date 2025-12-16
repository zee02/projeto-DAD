<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4 md:p-8">
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-4xl font-bold text-slate-900">🏆 Complete Leaderboards</h1>
          <p class="text-slate-600 text-sm mt-2">View all player rankings across all stats</p>
        </div>
        <button 
          @click="fetchAll"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 w-fit">
          <span>↻</span> Refresh
        </button>
      </div>
    </div>

    <!-- Leaderboards Card -->
    <div class="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <!-- Card Header -->
      <div class="px-6 py-4 border-b border-slate-200 bg-linear-to-r from-slate-50 to-slate-100">
        <h2 class="text-lg font-semibold text-slate-900">Player Rankings</h2>
        <p class="text-sm text-slate-600 mt-1">Click column headers to sort</p>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
              <th :class="headerClass('total')" @click="setSort('total')" class="text-left">
                <div class="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  Rank
                  <span v-if="sortBy==='total'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('name')" @click="setSort('name')" class="text-left">
                <div class="flex items-center gap-2 cursor-pointer hover:text-slate-900">
                  Player
                  <span v-if="sortBy==='name'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('wins')" @click="setSort('wins')" class="text-center">
                <div class="flex items-center justify-center gap-2 cursor-pointer hover:text-slate-900">
                  ⭐ Wins
                  <span v-if="sortBy==='wins'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('capotes')" @click="setSort('capotes')" class="text-center">
                <div class="flex items-center justify-center gap-2 cursor-pointer hover:text-slate-900">
                  🎯 Capotes
                  <span v-if="sortBy==='capotes'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('flags')" @click="setSort('flags')" class="text-center">
                <div class="flex items-center justify-center gap-2 cursor-pointer hover:text-slate-900">
                  🏴 Flags
                  <span v-if="sortBy==='flags'" class="text-xs">{{ sortDir==='desc' ? '▼' : '▲' }}</span>
                </div>
              </th>
              <th :class="headerClass('total')" class="text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, idx) in pageItems" :key="p.user_id" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white text-sm"
                    :class="{
                      'bg-yellow-500': displayRank(p, idx) === 1,
                      'bg-gray-400': displayRank(p, idx) === 2,
                      'bg-orange-500': displayRank(p, idx) === 3,
                      'bg-slate-400': displayRank(p, idx) > 3
                    }">
                    {{ displayRank(p, idx) }}
                  </div>
                  <span class="font-semibold text-slate-900">{{ displayRank(p, idx) === 1 ? '👑' : displayRank(p, idx) === 2 ? '🥈' : displayRank(p, idx) === 3 ? '🥉' : '' }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="font-medium text-slate-900">{{ p.nickname || p.name || ('#' + p.user_id) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-semibold text-indigo-600">{{ p.wins || 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-semibold text-indigo-600">{{ p.capotes || 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-semibold text-indigo-600">{{ p.flags || 0 }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full text-sm">{{ (p.wins || 0) + (p.capotes || 0) + (p.flags || 0) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div class="text-sm text-slate-600">
          Page <span class="font-semibold">{{ currentPage }}</span> of <span class="font-semibold">{{ totalPages }}</span> 
          <span class="text-xs text-slate-500 ml-4">({{ combined.length }} total players)</span>
        </div>
        <div class="flex gap-2">
          <button 
            @click="prevPage" 
            :disabled="currentPage <= 1"
            class="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-sm transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
            ← Previous
          </button>
          <button 
            @click="nextPage" 
            :disabled="currentPage >= totalPages"
            class="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-sm transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const api = useAPIStore()
const allMap = ref({})
const combined = ref([])
const sortBy = ref('wins')
const sortDir = ref('desc')
const perPage = ref(25)
const currentPage = ref(1)

const totalPages = computed(() => Math.max(1, Math.ceil(combined.value.length / perPage.value)))

const pageItems = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
  return combined.value.slice(start, start + perPage.value)
})

const rankMaps = ref({ wins: {}, capotes: {}, flags: {}, total: {} })

const computeRankMaps = () => {
  const keys = ['wins', 'capotes', 'flags', 'total']
  keys.forEach((k) => {
    const arr = [...combined.value]
    if (k === 'total') {
      arr.sort((a, b) => (b.total || 0) - (a.total || 0))
    } else {
      arr.sort((a, b) => (b[k] || 0) - (a[k] || 0))
    }
    const map = {}
    let prevVal = null
    let prevRank = 0
    arr.forEach((it, idx) => {
      const val = k === 'total' ? (it.total || 0) : (it[k] || 0)
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
    const [wRes, cRes, fRes] = await Promise.all([
      api.getLeaderboards('wins', 1, per),
      api.getLeaderboards('capotes', 1, per),
      api.getLeaderboards('flags', 1, per),
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

    // compute totals and convert to array
    const arr = Object.values(map)
    arr.forEach((it) => {
      it.wins = it.wins || 0
      it.capotes = it.capotes || 0
      it.flags = it.flags || 0
      it.total = it.wins + it.capotes + it.flags
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
  if (['wins', 'capotes', 'flags', 'total'].includes(key)) {
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
