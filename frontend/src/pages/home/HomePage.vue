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

// Coins
const coins = ref(0)

// Leaderboard preview
const leaderboard = ref([])

// Load initial data
onMounted(async () => {
  try {
    // Get coins balance
    const res = await apiStore.getCoinBalance()
    coins.value = res.data.balance

    // Get leaderboard top 3
    const lead = await apiStore.getLeaderboard()
    leaderboard.value = lead.data.slice(0, 3)

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
  <div class="flex flex-row justify-center items-stretch gap-5 mt-10">

    <!-- LEFT CARD - PLAYER ACTIONS -->
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-3xl font-bold text-center">
          Bisca — Jogar
        </CardTitle>
        <CardDescription class="text-center">
          Escolhe o modo para começar a jogar
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-6">


        <!-- SINGLEPLAYER -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Modo Singleplayer</label>

          <div class="grid grid-cols-2 gap-2">
            <Button @click="startSingleplayer('3')" variant="outline">
              Bisca 3 Cartas
            </Button>

            <Button @click="startSingleplayer('9')" variant="outline">
              Bisca 9 Cartas
            </Button>
          </div>
        </div>

        <!-- MULTIPLAYER -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Modo Multiplayer</label>

          <Button @click="goToMultiplayer" size="lg" variant="secondary"
            class="w-full hover:bg-purple-500 hover:text-white">
            Entrar no Multiplayer
          </Button>
        </div>

        <!-- HISTORY -->
        <div class="space-y-2">
          <Button @click="goToHistory" class="w-full" variant="outline">
            Ver Histórico
          </Button>
        </div>

      </CardContent>
    </Card>

    <!-- RIGHT CARD - LEADERBOARD / ADMIN -->
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="text-3xl font-bold text-center">
          Plataforma
        </CardTitle>
        <CardDescription class="text-center">
          Leaderboards e ferramentas
        </CardDescription>
      </CardHeader>

      <CardContent class="space-y-8">

        <!-- LEADERBOARD PREVIEW -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Leaderboard (Top 3)</label>

          <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div class="max-h-64 overflow-y-auto">

              <div v-if="leaderboard.length === 0" class="p-6 text-center text-sm text-muted-foreground">
                Sem dados ainda.
              </div>

              <div v-else class="divide-y">
                <div v-for="(p, index) in leaderboard" :key="index"
                  class="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">

                  <div class="flex items-center gap-3">

                    <!-- RANK NUMBER -->
                    <div class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                      :class="{
                        'bg-yellow-300 text-black': index === 0,
                        'bg-gray-300 text-black': index === 1,
                        'bg-orange-300 text-black': index === 2
                      }">
                      {{ index + 1 }}
                    </div>

                    <div>
                      <div class="font-medium text-sm">{{ p.nickname }}</div>
                      <div class="text-xs text-muted-foreground">{{ p.score }} pontos</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- NAV BUTTONS -->
        <div class="grid grid-cols-1 gap-2">
          <Button @click="goToLeaderboards" class="w-full" variant="outline">View Leaderboards</Button>
          <Button @click="goToStats" class="w-full" variant="outline">View Site Statistics</Button>
        </div>

        <!-- Admin analytics removed from main screen; accessible via nav for admins -->

        <!-- ADMIN PANEL removed from main screen -->

      </CardContent>
    </Card>

  </div>
</template>
