<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Admin Analytics</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="col-span-full mb-4">
        <div v-if="overviewLoaded" class="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-white rounded shadow text-center">
            <div class="text-sm text-gray-500">Players</div>
            <div class="text-lg font-bold">{{ overview.total_players }}</div>
          </div>
          <div class="p-3 bg-white rounded shadow text-center">
            <div class="text-sm text-gray-500">Games</div>
            <div class="text-lg font-bold">{{ overview.total_games }}</div>
          </div>
          <div class="p-3 bg-white rounded shadow text-center">
            <div class="text-sm text-gray-500">Transactions</div>
            <div class="text-lg font-bold">{{ overview.total_transactions }}</div>
          </div>
          <div class="p-3 bg-white rounded shadow text-center">
            <div class="text-sm text-gray-500">Sales (EUR)</div>
            <div class="text-lg font-bold">€ {{ overview.total_sales_euros }}</div>
          </div>
        </div>
      </div>
      <div class="p-4 bg-white rounded shadow">
        <h2 class="font-semibold mb-2">Sales Over Time (EUR)</h2>
        <SimpleLineChart :labels="labels" :values="salesData" />
      </div>

      <div class="p-4 bg-white rounded shadow">
        <h2 class="font-semibold mb-2">Games Volume Over Time</h2>
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

const fetch = async () => {
  try {
    const [sRes, gRes] = await Promise.all([
      api.getAdminSalesOverTime(30),
      api.getAdminGamesOverTime(30),
    ])
    labels.value = sRes.data.labels
    salesData.value = sRes.data.data
    gamesData.value = gRes.data.data

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
