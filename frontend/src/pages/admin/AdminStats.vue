<template>
  <div class="p-6 bg-background">
    <h1 class="text-2xl font-bold mb-4 text-foreground">Admin Analytics</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="col-span-full mb-4">
        <div v-if="overviewLoaded" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Players</div>
            <div class="text-lg font-bold">{{ overview.total_players }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Games</div>
            <div class="text-lg font-bold">{{ overview.total_games }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Transactions</div>
            <div class="text-lg font-bold">{{ overview.total_transactions }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Coins Purchased (EUR)</div>
            <div class="text-lg font-bold">€ {{ overview.total_sales_euros }}</div>
          </div>
        </div>
      </div>
      <div class="col-span-full" v-if="summaryLoaded">
        <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Coins Purchased last 7d</div>
            <div class="text-lg font-bold">€ {{ summary.sales_last_7_days.toFixed(2) }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Coins Purchased last 30d</div>
            <div class="text-lg font-bold">€ {{ summary.sales_last_30_days.toFixed(2) }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Avg coins purchased/day (30d)</div>
            <div class="text-lg font-bold">€ {{ summary.avg_sales_per_day_30.toFixed(2) }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Games last 7d</div>
            <div class="text-lg font-bold">{{ summary.games_last_7_days }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Games last 30d</div>
            <div class="text-lg font-bold">{{ summary.games_last_30_days }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Avg games/day (30d)</div>
            <div class="text-lg font-bold">{{ summary.avg_games_per_day_30 }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Active players (30d)</div>
            <div class="text-lg font-bold">{{ summary.active_players_last_30 }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Blocked users</div>
            <div class="text-lg font-bold">{{ summary.blocked_users }}</div>
          </div>
          <div class="p-3 bg-card text-card-foreground rounded shadow text-center border border-border">
            <div class="text-sm text-muted-foreground">Avg game duration (s)</div>
            <div class="text-lg font-bold">{{ summary.avg_game_duration_seconds }}</div>
          </div>
        </div>
      </div>
      <div class="p-4 bg-card text-card-foreground rounded shadow border border-border">
        <h2 class="font-semibold mb-2 text-foreground">Coins Purchased Over Time (EUR)</h2>
        <SimpleLineChart :labels="labels" :values="salesData" />
      </div>

      <div class="p-4 bg-card text-card-foreground rounded shadow border border-border">
        <h2 class="font-semibold mb-2 text-foreground">Games Volume Over Time</h2>
        <SimpleLineChart :labels="labels" :values="gamesData" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SimpleLineChart from '@/components/SimpleLineChart.vue'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const api = useAPIStore()
const labels = ref([])
const salesData = ref([])
const gamesData = ref([])
const overview = ref({ total_players: 0, total_games: 0, total_transactions: 0, total_sales_euros: 0 })
const overviewLoaded = ref(false)
const summary = ref({
  sales_last_7_days: 0,
  sales_last_30_days: 0,
  avg_sales_per_day_30: 0,
  games_last_7_days: 0,
  games_last_30_days: 0,
  avg_games_per_day_30: 0,
  active_players_last_30: 0,
  blocked_users: 0,
  avg_game_duration_seconds: 0,
})
const summaryLoaded = ref(false)

const fetch = async () => {
  try {
    const [sRes, gRes, summaryRes] = await Promise.all([
      api.getAdminSalesOverTime(30),
      api.getAdminGamesOverTime(30),
      api.getAdminAnalyticsSummary(),
    ])
    labels.value = sRes.data.labels
    salesData.value = sRes.data.data
    gamesData.value = gRes.data.data
    summary.value = summaryRes.data
    summaryLoaded.value = true

    // Try to load overview (aggregates)
    try {
      const ov = await api.getOverviewStats()
      overview.value = ov.data
      overviewLoaded.value = true
    } catch (err) {
      console.error('failed to fetch overview', err)
    }
  } catch (e) {
    console.error(e)
    toast.error('Failed to load analytics')
  }
}

onMounted(fetch)
</script>

<style scoped>
</style>
