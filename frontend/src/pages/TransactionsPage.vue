<template>
  <div class="max-w-5xl mx-auto p-6 bg-background min-h-screen">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Transaction History</h1>
        <p class="text-muted-foreground">All your coin purchases with payment details and status.</p>
      </div>
    </div>

    <div class="bg-card text-card-foreground rounded-lg shadow border border-border">
      <div class="px-6 py-4 border-b border-border flex items-center justify-between">
        <div class="text-sm text-muted-foreground">Showing {{ purchases.length }} transactions</div>
        <button
          @click="fetchHistory"
          class="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/80 transition"
          :disabled="loading"
        >
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <div v-if="error" class="px-6 py-4 bg-destructive/10 border-b border-destructive/30 text-destructive">
        {{ error }}
      </div>

      <div v-if="loading" class="px-6 py-8 text-center text-muted-foreground">
        Loading transactions...
      </div>

      <div v-else-if="purchases.length === 0" class="px-6 py-10 text-center text-muted-foreground">
        No transactions found yet.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-muted/30 border-b border-border">
            <tr class="text-left text-muted-foreground">
              <th class="px-4 py-2 font-semibold">Date</th>
              <th class="px-4 py-2 font-semibold">Status</th>
              <th class="px-4 py-2 font-semibold">Coins</th>
              <th class="px-4 py-2 font-semibold">Amount (€)</th>
              <th class="px-4 py-2 font-semibold">Payment Method</th>
              <th class="px-4 py-2 font-semibold">Reference</th>
              <th class="px-4 py-2 font-semibold">ID</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border text-foreground">
            <tr v-for="tx in purchases" :key="tx.id" class="hover:bg-muted/50">
              <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(tx.purchase_datetime) }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-semibold"
                  :class="statusClass(tx.status)"
                >
                  <span class="w-2 h-2 rounded-full" :class="dotClass(tx.status)"></span>
                  {{ tx.status || '—' }}
                </span>
              </td>
              <td class="px-4 py-3 font-semibold text-accent whitespace-nowrap">{{ tx.coins }} coins</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ asMoney(tx.euros) }}</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ tx.payment_type || '—' }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ tx.payment_reference || '—' }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ tx.id }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="purchases.length" class="px-6 py-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Total purchases</span>
          <span class="font-semibold text-foreground">{{ purchases.length }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Total coins</span>
          <span class="font-semibold text-accent">{{ totalCoins }} coins</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Total spent</span>
          <span class="font-semibold text-foreground">{{ totalSpent }} €</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'

const api = useAPIStore()
const purchases = ref([])
const loading = ref(false)
const error = ref('')

const fetchHistory = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await api.getCoinPurchaseHistory()
    purchases.value = response.purchases || []
  } catch (e) {
    console.error('Failed to load transactions', e)
    error.value = e.response?.data?.error || 'Unable to load transactions right now.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchHistory)

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-PT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const asMoney = (value) => {
  if (!value && value !== 0) return '—'
  return `${Number(value).toFixed(2)}€`
}

const totalCoins = computed(() => purchases.value.reduce((sum, p) => sum + (p.coins || 0), 0))
const totalSpent = computed(() => purchases.value.reduce((sum, p) => sum + Number(p.euros || 0), 0).toFixed(2))

const statusClass = (status) => {
  const map = {
    COMPLETED: 'bg-secondary/20 text-secondary border border-secondary/30',
    APPROVED: 'bg-secondary/20 text-secondary border border-secondary/30',
    PENDING: 'bg-amber-100 text-amber-900 border border-amber-200',
    FAILED: 'bg-destructive/10 text-destructive border border-destructive/30',
    ERROR: 'bg-destructive/10 text-destructive border border-destructive/30',
  }
  return map[status] || 'bg-muted/50 text-muted-foreground border border-border'
}

const dotClass = (status) => {
  const map = {
    COMPLETED: 'bg-secondary',
    APPROVED: 'bg-secondary',
    PENDING: 'bg-amber-500',
    FAILED: 'bg-destructive',
    ERROR: 'bg-destructive',
  }
  return map[status] || 'bg-border'
}
</script>
