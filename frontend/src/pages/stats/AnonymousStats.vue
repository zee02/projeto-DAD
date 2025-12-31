<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Platform Statistics (Anonymous)</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="p-4 bg-white rounded shadow text-center">
        <div class="text-sm text-gray-500">Total Games Played</div>
        <div class="text-2xl font-bold">{{ stats.total_games }}</div>
      </div>

      <div class="p-4 bg-white rounded shadow text-center">
        <div class="text-sm text-gray-500">Active Players (last {{ days }} days)</div>
        <div class="text-2xl font-bold">{{ stats.active_players_last_days }}</div>
      </div>

      <div class="p-4 bg-white rounded shadow text-center">
        <div class="text-sm text-gray-500">Avg Points / Game</div>
        <div class="text-2xl font-bold">{{ stats.average_statistics.avg_points_per_game.toFixed(2) }}</div>
      </div>

      <div class="p-4 bg-white rounded shadow text-center">
        <div class="text-sm text-gray-500">Avg Game Duration (s)</div>
        <div class="text-2xl font-bold">{{ stats.average_statistics.avg_game_duration_seconds.toFixed(1) }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="p-4 bg-white rounded shadow">
        <div class="text-sm text-gray-500 mb-2">Common Victories (aggregated)</div>
        <ul class="space-y-1">
          <li class="flex justify-between"><span>Wins</span><span class="font-bold">{{ stats.common_victories.wins }}</span></li>
          <li class="flex justify-between"><span>Capotes</span><span class="font-bold">{{ stats.common_victories.capotes }}</span></li>
          <li class="flex justify-between"><span>Flags</span><span class="font-bold">{{ stats.common_victories.flags }}</span></li>
        </ul>
      </div>

      <div class="p-4 bg-white rounded shadow">
        <div class="text-sm text-gray-500 mb-2">Game Type Distribution</div>
        <ul class="space-y-1">
          <li v-for="(count, type) in stats.game_type_distribution" :key="type" class="flex justify-between">
            <span>{{ type || 'unknown' }}</span>
            <span class="font-bold">{{ count }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="p-4 bg-white rounded shadow mb-6">
      <div class="text-sm text-gray-500 mb-4">Global Records (anonymous)</div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div class="text-xs text-gray-500 font-semibold mb-3">Top Single-Game Scores</div>
          <ul class="space-y-1">
            <li v-for="rec in stats.global_records.top_scores" :key="rec.game_id" class="flex justify-between">
              <span>{{ rec.player || 'Player #?' }}</span>
              <span class="font-bold">{{ rec.points }}</span>
            </li>
          </ul>
        </div>

        <div>
          <div class="text-xs text-gray-500 font-semibold mb-3">Top Winners (by total wins)</div>
          <ul class="space-y-1">
            <li v-for="(rec, idx) in stats.global_records.top_winners" :key="idx" class="flex justify-between">
              <span>{{ rec.player }}</span>
              <span class="font-bold">{{ rec.wins }}</span>
            </li>
          </ul>
        </div>

        <div>
          <div class="text-xs text-gray-500 font-semibold mb-3">Longest Games (s)</div>
          <ul class="space-y-1">
            <li v-for="rec in stats.global_records.longest_games" :key="rec.game_id" class="flex justify-between">
              <span>Game #{{ rec.game_id }}</span>
              <span class="font-bold">{{ Math.round(rec.duration_seconds) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="p-4 bg-white rounded shadow">
      <div class="text-sm text-gray-500 mb-2">Trends (games per day)</div>
      <div class="w-full overflow-auto">
        <svg :width="chartWidth" :height="120" viewBox="0 0 600 120" preserveAspectRatio="none" class="w-full">
          <polyline
            :points="chartPoints"
            fill="none"
            stroke="#3b82f6"
            stroke-width="2"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const api = useAPIStore()
const days = ref(30)
const stats = ref({
  total_games: 0,
  active_players_last_days: 0,
  common_victories: { wins: 0, capotes: 0, flags: 0 },
  global_records: { top_scores: [], top_winners: [], longest_games: [] },
  game_type_distribution: {},
  average_statistics: { avg_points_per_game: 0, avg_game_duration_seconds: 0 },
  trends: { labels: [], data: [] },
})

const fetch = async () => {
  try {
    const res = await api.getAnonymousStats(days.value)
    stats.value = res.data
  } catch (e) {
    console.error(e)
    toast.error('Failed to load anonymous statistics')
  }
}

onMounted(fetch)

// Chart helpers
const chartWidth = computed(() => Math.max(600, (stats.value.trends.labels || []).length * 12))
const chartPoints = computed(() => {
  const data = stats.value.trends.data || []
  const max = Math.max(...data, 1)
  const w = 600
  const h = 120
  if (data.length === 0) return ''
  return data.map((v, i) => {
    const x = Math.round((i / (data.length - 1)) * w)
    const y = Math.round(h - (v / max) * (h - 10))
    return `${x},${y}`
  }).join(' ')
})
</script>
