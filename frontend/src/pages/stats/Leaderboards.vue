<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Leaderboards</h1>

    <!-- Sort by clicking the column headers -->

    <table class="w-full table-auto border-collapse">
      <thead>
        <tr class="text-left">
          <th :class="headerClass('total')" @click="setSort('total')">Rank <span v-if="sortBy==='total'">{{ sortDir==='desc' ? '▼' : '▲' }}</span></th>
          <th :class="headerClass('name')" @click="setSort('name')">Player <span v-if="sortBy==='name'">{{ sortDir==='desc' ? '▼' : '▲' }}</span></th>
          <th :class="headerClass('wins')" @click="setSort('wins')">Wins <span v-if="sortBy==='wins'">{{ sortDir==='desc' ? '▼' : '▲' }}</span></th>
          <th :class="headerClass('capotes')" @click="setSort('capotes')">Capotes <span v-if="sortBy==='capotes'">{{ sortDir==='desc' ? '▼' : '▲' }}</span></th>
          <th :class="headerClass('flags')" @click="setSort('flags')">Flags <span v-if="sortBy==='flags'">{{ sortDir==='desc' ? '▼' : '▲' }}</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, idx) in pageItems" :key="p.user_id" class="border-t">
          <td class="p-2">{{ displayRank(p, idx) }}</td>
          <td class="p-2">{{ p.nickname || p.name || ('#' + p.user_id) }}</td>
          <td class="p-2">{{ p.wins || 0 }}</td>
          <td class="p-2">{{ p.capotes || 0 }}</td>
          <td class="p-2">{{ p.flags || 0 }}</td>
        </tr>
      </tbody>
    </table>

    <div class="mt-4 flex items-center justify-between">
      <div>Page {{ currentPage }} of {{ totalPages }}</div>
      <div class="flex gap-2">
        <button class="px-3 py-1 border rounded" @click="prevPage" :disabled="currentPage <= 1">Prev</button>
        <button class="px-3 py-1 border rounded" @click="nextPage" :disabled="currentPage >= totalPages">Next</button>
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
