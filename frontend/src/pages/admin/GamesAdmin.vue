<template>
  <div class="min-h-screen bg-background p-4 md:p-8">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-foreground">Games</h1>
          <p class="text-muted-foreground text-sm mt-1">Manage and monitor all games</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" class="hidden sm:inline-flex">
            <span>↻</span> Refresh
          </Button>
          <Button size="sm" class="hidden sm:inline-flex">
            <span>+</span> Add Game
          </Button>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard 
        label="Total Games" 
        :value="games.length" 
        icon="🎮"
        class="bg-primary/5 border-primary/20"
      />
      <StatCard 
        label="Pending" 
        :value="games.filter(g => g.status === 'Pending').length" 
        icon="⏳"
        class="bg-accent/5 border-accent/20"
      />
      <StatCard 
        label="Playing" 
        :value="games.filter(g => g.status === 'Playing').length" 
        icon="▶️"
        class="bg-secondary/5 border-secondary/20"
      />
      <StatCard 
        label="Ended" 
        :value="games.filter(g => g.status === 'Ended').length" 
        icon="✓"
        class="bg-muted/50 border-border"
      />
    </div>

    <!-- Filters and Controls -->
    <div class="mb-6 flex flex-col sm:flex-row gap-3">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search by game ID..."
        class="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-input text-foreground"
      />
      <select
        v-model="filterStatus"
        class="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-input text-foreground"
      >
        <option value="">All Status</option>
        <option value="Pending">Pending</option>
        <option value="Playing">Playing</option>
        <option value="Ended">Ended</option>
        <option value="Interrupted">Interrupted</option>
      </select>
    </div>

    <!-- Games Table Card -->
    <Card class="bg-card border border-border shadow-lg">
      <div class="px-6 py-4 border-b border-border">
        <h2 class="text-lg font-semibold text-card-foreground">Games List</h2>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <Table v-if="filteredGames.length > 0">
          <TableHeader>
            <TableRow class="hover:bg-muted/50">
              <TableHead class="w-12">ID</TableHead>
              <TableHead class="w-16">Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Ended</TableHead>
              <TableHead class="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="g in filteredGames" 
              :key="g.id"
              class="hover:bg-muted/50 transition-colors"
            >
              <TableCell class="font-mono text-sm font-medium text-foreground">{{ g.id }}</TableCell>
              <TableCell>
                <Badge :variant="g.type === '9' ? 'default' : 'secondary'" class="font-medium">
                  {{ g.type === '9' ? '9-Card' : '3-Card' }}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(g.status)" class="font-medium">
                  {{ g.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                <div class="flex flex-col">
                  <span>{{ formatDate(g.began_at) }}</span>
                </div>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground">
                {{ g.ended_at ? formatDate(g.ended_at) : '—' }}
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end gap-1">
                  <Button 
                    v-if="g.status === 'Ended'"
                    size="sm" 
                    variant="ghost" 
                    class="h-8 px-2 text-xs"
                    @click="viewReplay(g.id)"
                    title="View Replay"
                  >
                    🎬 Replay
                  </Button>
                  <Button size="sm" variant="ghost" class="h-8 w-8 p-0" @click="viewGame(g)">
                    👁
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- Empty State -->
        <div v-else class="p-12 text-center">
          <div class="text-4xl mb-3">🎮</div>
          <h3 class="text-lg font-semibold text-foreground mb-2">No games found</h3>
          <p class="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      </div>

      <!-- Pagination Info -->
      <div v-if="filteredGames.length > 0" class="px-6 py-4 border-t border-border text-sm text-muted-foreground">
        Showing {{ filteredGames.length }} of {{ games.length }} games
      </div>
    </Card>

    <!-- Loading State -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div class="bg-card rounded-lg p-6">
        <div class="text-center">
          <div class="text-4xl animate-spin mb-3">⏳</div>
          <p class="text-muted-foreground">Loading games...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'
import { format } from 'date-fns'
import Card from '@/components/ui/card/Card.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import Button from '@/components/ui/button/Button.vue'
import Table from '@/components/ui/table/Table.vue'
import TableHeader from '@/components/ui/table/TableHeader.vue'
import TableBody from '@/components/ui/table/TableBody.vue'
import TableRow from '@/components/ui/table/TableRow.vue'
import TableHead from '@/components/ui/table/TableHead.vue'
import TableCell from '@/components/ui/table/TableCell.vue'
import StatCard from '@/components/admin/StatCard.vue'

const router = useRouter()
const games = ref([])
const api = useAPIStore()
const isLoading = ref(false)
const searchTerm = ref('')
const filterStatus = ref('')

const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

const getStatusVariant = (status) => {
  const variants = {
    'Pending': 'secondary',
    'Playing': 'default',
    'Ended': 'outline',
    'Interrupted': 'destructive'
  }
  return variants[status] || 'secondary'
}

const filteredGames = computed(() => {
  return games.value.filter(game => {
    const matchesSearch = game.id.toString().includes(searchTerm.value)
    const matchesStatus = !filterStatus.value || game.status === filterStatus.value
    return matchesSearch && matchesStatus
  })
})

const viewGame = (game) => {
  toast.info(`Viewing game #${game.id}`)
  // TODO: Open game detail modal
}

const viewReplay = (gameId) => {
  router.push(`/game-replay/${gameId}`)
}

const fetchGames = async () => {
  isLoading.value = true
  try {
    const res = await api.getGames(true)
    games.value = res.data.data
    toast.success('Games loaded successfully')
  } catch (e) {
    console.error(e)
    toast.error('Failed to load games')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchGames)
</script>

<style scoped>
/* Smooth transitions for interactive elements */
:deep(.hover\:bg-slate-50:hover) {
  transition: background-color 0.15s ease-in-out;
}

/* Badge styling consistency */
:deep([data-slot='badge']) {
  font-weight: 500;
  padding: 0.25rem 0.75rem;
}

/* Table header background */
:deep(thead) {
  background-color: rgba(15, 23, 42, 0.03);
}

/* Input focus styling */
input:focus,
select:focus {
  transition: all 0.2s ease;
}
</style>
