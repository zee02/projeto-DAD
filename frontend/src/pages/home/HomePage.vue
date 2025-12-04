<script setup>
import { ref, onMounted, computed } from 'vue'
import { Button } from '@/components/ui/button'

import { useRouter } from 'vue-router'

import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const apiStore = useAPIStore()
const authStore = useAuthStore()

// User data
const user = computed(() => authStore.user)

// Coins - use user's coins_balance from auth store
const coins = computed(() => user.value?.coins_balance || 0)

// Leaderboard preview
const leaderboard = ref([])

// Load initial data
onMounted(async () => {
  try {
    // Get leaderboard top 3
    const lead = await apiStore.getLeaderboards('wins', 1, 3)
    leaderboard.value = lead.data.data || lead.data.slice(0, 3)

  } catch (e) {
    console.error(e)
  }
})

// Navigation functions
const startSingleplayer = (mode) => {
  router.push({ name: 'singleplayer', query: { mode } })
}

const goToMultiplayer = () => {
  router.push({ name: 'multiplayer' })
}

const goToCoins = () => {
  router.push({ name: 'coins' })
}

const goToHistory = () => {
  router.push({ name: 'history' })
}

const goToAdmin = () => {
  router.push({ name: 'admin' })
}

const goToLeaderboards = () => {
  router.push('/leaderboards')
}

const goToStats = () => {
  router.push('/stats')
}

// admin analytics navigation removed from main page (nav-only)
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-4xl font-extrabold text-gray-900">Bisca</h1>
        <p class="mt-2 text-base text-gray-600">Play, compete in rankings and earn coins!</p>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left Section - Game Actions (2 cols on large screens) -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Play Card -->
        <div class="bg-white shadow-lg rounded-2xl p-8">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Play</h2>
            <p class="mt-1 text-gray-600">Choose a mode and start a match quickly</p>
          </div>

          <!-- Game Mode Buttons -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button @click="startSingleplayer('3')" 
              class="group relative overflow-hidden bg-linear-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-lg bg-blue-500 text-white group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div class="text-left">
                  <div class="font-semibold text-gray-900">Bisca 3 Cards</div>
                  <div class="text-sm text-gray-600">Quick match</div>
                </div>
              </div>
            </button>

            <button @click="startSingleplayer('9')" 
              class="group relative overflow-hidden bg-linear-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div class="flex items-center gap-4">
                <div class="p-3 rounded-lg bg-purple-500 text-white group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/></svg>
                </div>
                <div class="text-left">
                  <div class="font-semibold text-gray-900">Bisca 9 Cards</div>
                  <div class="text-sm text-gray-600">Full match</div>
                </div>
              </div>
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button @click="goToMultiplayer" 
              class="col-span-2 bg-linear-to-r from-indigo-600 to-indigo-700 text-white font-semibold rounded-lg py-3 px-4 hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg">
              Enter Multiplayer
            </button>
            <button @click="goToHistory" 
              class="bg-white border-2 border-gray-200 text-gray-900 font-semibold rounded-lg py-3 px-4 hover:bg-gray-50 transition-all duration-200">
              View History
            </button>
          </div>
        </div>

        <!-- Highlights Card -->
        <div class="bg-white shadow-lg rounded-2xl p-8">
          <h3 class="text-2xl font-bold text-gray-900 mb-2">Top Players</h3>
          <p class="text-gray-600 mb-6">Check out the best players and stand out in leaderboards.</p>

          <div v-if="leaderboard.length === 0" class="text-center py-8">
            <div class="text-gray-400 text-sm">No data yet.</div>
          </div>

          <div v-else class="space-y-3">
            <div v-for="(p, index) in leaderboard" :key="index" 
              class="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <div class="flex items-center gap-4">
                <div class="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                  :class="{
                    'bg-yellow-400': index === 0,
                    'bg-gray-400': index === 1,
                    'bg-orange-400': index === 2
                  }">
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="font-semibold text-gray-900">{{ p.nickname }}</div>
                </div>
              </div>
              <div class="text-sm font-semibold text-gray-900">{{ p.count }} 🏆</div>
            </div>
          </div>

          <button @click="goToLeaderboards" class="w-full mt-6 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
            View Full Leaderboard →
          </button>
        </div>
      </div>

      <!-- Right Sidebar -->
      <aside class="space-y-6">
        <!-- Quick Links Card -->
        <div class="bg-white shadow-lg rounded-2xl p-6">
          <h4 class="text-lg font-bold text-gray-900 mb-4">Quick Links</h4>
          <div class="space-y-2">
            <button @click="goToLeaderboards" 
              class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 flex items-center gap-3 group">
              <svg class="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <div>
                <div class="font-semibold text-gray-900">Leaderboards</div>
                <div class="text-xs text-gray-600">View rankings</div>
              </div>
            </button>

            <button @click="goToStats" 
              class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 flex items-center gap-3 group">
              <svg class="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <div>
                <div class="font-semibold text-gray-900">Statistics</div>
                <div class="text-xs text-gray-600">Anonymous overview</div>
              </div>
            </button>
          </div>
        </div>



        <!-- Info Card -->
        <div class="bg-linear-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl p-6">
          <h4 class="text-lg font-bold text-indigo-900 mb-2">Welcome!</h4>
          <p class="text-indigo-800 text-sm">Compete in leaderboards, earn coins and climb the rankings.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
button {
  outline: none;
}

/* Smooth transitions */
* {
  transition: all 0.3s ease-in-out;
}
</style>
