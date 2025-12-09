<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import SinglePlayerGame from '@/pages/game/SinglePlayerGame.vue'

const gameMode = ref(null) // null | '3' | '9'
const router = useRouter()
const apiStore = useAPIStore()
const authStore = useAuthStore()

// User data
const user = computed(() => authStore.user)

// Leaderboard preview
const leaderboard = ref([])
const leaderboardMode = ref('overall') // 'overall', 'multiplayer', 'singleplayer'
const isLoadingLeaderboard = ref(false)

// Load leaderboard data based on mode
const loadLeaderboard = async (mode = 'overall') => {
  isLoadingLeaderboard.value = true
  try {
    // Get wins leaderboard
    const winsResponse = await apiStore.getLeaderboards('wins', 1, 3)
    const winsData = winsResponse.data.data || winsResponse.data.slice(0, 3)
    
    // Get capotes leaderboard
    const capotesResponse = await apiStore.getLeaderboards('capotes', 1, 100)
    const capotesData = capotesResponse.data.data || capotesResponse.data
    const capotesByUser = {}
    capotesData.forEach(item => {
      capotesByUser[item.user_id] = item.count
    })
    
    // Get flags leaderboard
    const flagsResponse = await apiStore.getLeaderboards('flags', 1, 100)
    const flagsData = flagsResponse.data.data || flagsResponse.data
    const flagsByUser = {}
    flagsData.forEach(item => {
      flagsByUser[item.user_id] = item.count
    })
    
    // Combine data with extra stats
    // Note: API currently doesn't filter by game type (multiplayer/singleplayer)
    // All modes show overall rankings for now
    leaderboard.value = winsData.map(player => ({
      ...player,
      capotes: capotesByUser[player.user_id] || 0,
      flags: flagsByUser[player.user_id] || 0
    }))
    
  } catch (e) {
    console.error(e)
  } finally {
    isLoadingLeaderboard.value = false
  }
}

// Switch leaderboard mode
const switchLeaderboardMode = (mode) => {
  leaderboardMode.value = mode
  loadLeaderboard(mode)
}

// Load initial data
onMounted(async () => {
  await loadLeaderboard('overall')
})

// Navigation functions
const startSingleplayer = (mode) => {
  router.push({ name: 'singleplayer', query: { mode } })
}



const goToMultiplayer = () => {
  router.push({ name: 'multiplayer' })
}

const goToHistory = () => {
  router.push({ name: 'history' })
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
       <!-- Play Card -->
<div v-if="user?.type !== 'A'" class="bg-white shadow-lg rounded-2xl p-8">
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-900">Play</h2>
    <p class="mt-1 text-gray-600">Choose a mode and start a match</p>
  </div>

  <!-- 4 Game Mode Buttons -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

    <!-- Bisca 3 - Singleplayer -->
    <button @click="startSingleplayer('3')"
      class="group bg-blue-50 border-2 border-blue-200 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-lg bg-blue-500 text-white group-hover:scale-110 transition">🎮</div>
        <div>
          <div class="font-semibold text-gray-900">Bisca 3 Cards</div>
          <div class="text-sm text-gray-600">Singleplayer</div>
        </div>
      </div>
    </button>

    <!-- Bisca 9 - Singleplayer -->
    <button @click="startSingleplayer('9')"
      class="group bg-purple-50 border-2 border-purple-200 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-lg bg-purple-500 text-white group-hover:scale-110 transition">🧩</div>
        <div>
          <div class="font-semibold text-gray-900">Bisca 9 Cards</div>
          <div class="text-sm text-gray-600">Singleplayer</div>
        </div>
      </div>
    </button>

    <!-- Bisca 3 - Multiplayer -->
    <button @click="startMultiplayer('3')"
      class="group bg-green-50 border-2 border-green-200 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-lg bg-green-500 text-white group-hover:scale-110 transition">⚔️</div>
        <div>
          <div class="font-semibold text-gray-900">Bisca 3 Cards</div>
          <div class="text-sm text-gray-600">Multiplayer</div>
        </div>
      </div>
    </button>

    <!-- Bisca 9 - Multiplayer -->
    <button @click="startMultiplayer('9')"
      class="group bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5 hover:shadow-xl hover:-translate-y-1 transition">
      <div class="flex items-center gap-4">
        <div class="p-3 rounded-lg bg-yellow-500 text-white group-hover:scale-110 transition">🏆</div>
        <div>
          <div class="font-semibold text-gray-900">Bisca 9 Cards</div>
          <div class="text-sm text-gray-600">Multiplayer</div>
        </div>
      </div>
    </button>

  </div>
</div>


        <!-- Highlights Card -->
        <div class="bg-white shadow-lg rounded-2xl p-8">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-2xl font-bold text-gray-900">Top Players</h3>
          </div>
          <p class="text-gray-600 mb-6">Check out the best players and stand out in leaderboards.</p>

          <!-- Mode Switcher Buttons -->
          <div class="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button 
              @click="switchLeaderboardMode('overall')"
              :class="[
                'flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all duration-300',
                leaderboardMode === 'overall' 
                  ? 'bg-white text-indigo-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              ]">
              Overall
            </button>
            <button 
              @click="switchLeaderboardMode('multiplayer')"
              :class="[
                'flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all duration-300',
                leaderboardMode === 'multiplayer' 
                  ? 'bg-white text-indigo-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              ]">
              Multiplayer
            </button>
            <button 
              @click="switchLeaderboardMode('singleplayer')"
              :class="[
                'flex-1 py-2.5 px-4 rounded-md font-semibold text-sm transition-all duration-300',
                leaderboardMode === 'singleplayer' 
                  ? 'bg-white text-indigo-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-900'
              ]">
              Singleplayer
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="isLoadingLeaderboard" class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p class="text-gray-500 text-sm mt-3">Loading rankings...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="leaderboard.length === 0" class="text-center py-8">
            <div class="text-gray-400 text-sm">No data yet.</div>
          </div>

          <!-- Leaderboard List -->
          <div v-else class="space-y-3">
            <div 
              v-for="(p, index) in leaderboard" 
              :key="p.user_id" 
              class="relative group"
            >
              <!-- Main Player Card -->
              <div class="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 border-2"
                :class="{
                  'border-yellow-300 bg-yellow-50': index === 0,
                  'border-gray-300 bg-gray-50': index === 1,
                  'border-orange-300 bg-orange-50': index === 2,
                }">
                <div class="flex items-center gap-4">
                  <!-- Rank Badge -->
                  <div class="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white shadow-lg transform group-hover:scale-110 transition-transform"
                    :class="{
                      'bg-linear-to-br from-yellow-400 to-yellow-600': index === 0,
                      'bg-linear-to-br from-gray-400 to-gray-600': index === 1,
                      'bg-linear-to-br from-orange-400 to-orange-600': index === 2
                    }">
                    <span class="text-lg">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</span>
                  </div>
                  
                  <!-- Player Info -->
                  <div>
                    <div class="font-bold text-gray-900 text-lg">{{ p.nickname || p.name }}</div>
                    <div class="flex items-center gap-3 mt-1">
                      <span class="text-sm font-semibold text-indigo-600 flex items-center gap-1">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        {{ p.count }}
                      </span>
                      <span class="text-xs text-gray-500">|</span>
                      <span class="text-xs text-gray-600 flex items-center gap-1">
                        <span class="font-semibold">🎯</span> {{ p.capotes }} capotes
                      </span>
                      <span class="text-xs text-gray-600 flex items-center gap-1">
                        <span class="font-semibold">🏴</span> {{ p.flags }} flags
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Trophy Icon -->
                <div class="text-3xl opacity-70 group-hover:opacity-100 transition-opacity">
                  {{ index === 0 ? '👑' : '🏆' }}
                </div>
              </div>
            </div>
          </div>

          <button @click="goToLeaderboards" class="w-full mt-6 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors flex items-center justify-center gap-2 group">
            View Full Leaderboard 
            <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
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
