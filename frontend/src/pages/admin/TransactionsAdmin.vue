<template>
  <div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4 md:p-8">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">Transactions</h1>
          <p class="text-slate-600 text-sm mt-1">Monitor all coin transactions and balances</p>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatCard 
        label="Total Transactions" 
        :value="transactions.length" 
        icon="💱"
        class="bg-blue-50 border-blue-200"
      />
      <StatCard 
        label="Total Coins" 
        :value="calculateTotalCoins()" 
        icon="🪙"
        class="bg-yellow-50 border-yellow-200"
      />
      <StatCard 
        label="Transaction Types" 
        :value="getUniqueTransactionTypes()" 
        icon="🏷️"
        class="bg-purple-50 border-purple-200"
      />
    </div>

    <!-- Filters and Controls -->
    <div class="mb-6 flex flex-col sm:flex-row gap-3">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Search by email or user ID..."
        class="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <select
        v-model="filterType"
        class="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
      >
        <option value="">All Types</option>
        <option value="Bonus">Bonus</option>
        <option value="Game">Game</option>
        <option value="Purchase">Purchase</option>
      </select>
    </div>

    <!-- Transactions Table Card -->
    <Card class="bg-white border border-slate-200 shadow-lg">
      <div class="px-6 py-4 border-b border-slate-200">
        <h2 class="text-lg font-semibold text-slate-900">Transactions List</h2>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <Table v-if="filteredTransactions.length > 0">
          <TableHeader>
            <TableRow class="hover:bg-slate-50">
              <TableHead class="w-40">Datetime</TableHead>
              <TableHead>User</TableHead>
              <TableHead class="w-24">Type</TableHead>
              <TableHead class="w-20 text-right">Coins</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="t in filteredTransactions" 
              :key="t.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <TableCell class="text-sm text-slate-600">
                {{ formatDate(t.transaction_datetime) }}
              </TableCell>
              <TableCell>
                <div>
                  <p class="font-medium text-slate-900">{{ t.user?.name || 'Unknown' }}</p>
                  <p class="text-xs text-slate-500">{{ t.user?.email || `User #${t.user_id}` }}</p>
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getTypeVariant(t.transaction_type?.name)" class="font-medium">
                  {{ t.transaction_type?.name || 'Unknown' }}
                </Badge>
              </TableCell>
              <TableCell class="text-right">
                <span :class="['font-semibold', t.coins > 0 ? 'text-green-600' : 'text-red-600']">
                  {{ t.coins > 0 ? '+' : '' }}{{ t.coins }}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- Empty State -->
        <div v-else class="p-12 text-center">
          <div class="text-4xl mb-3">💱</div>
          <h3 class="text-lg font-semibold text-slate-900 mb-2">No transactions found</h3>
          <p class="text-slate-600">Try adjusting your search or filters</p>
        </div>
      </div>

      <!-- Pagination Info -->
      <div v-if="filteredTransactions.length > 0" class="px-6 py-4 border-t border-slate-200 text-sm text-slate-600">
        Showing {{ filteredTransactions.length }} of {{ transactions.length }} transactions
      </div>
    </Card>

    <!-- Loading State -->
    <div v-if="isLoading" class="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div class="bg-white rounded-lg p-6">
        <div class="text-center">
          <div class="text-4xl animate-spin mb-3">⏳</div>
          <p class="text-slate-600">Loading transactions...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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

const transactions = ref([])
const api = useAPIStore()
const isLoading = ref(false)
const searchTerm = ref('')
const filterType = ref('')

const formatDate = (date) => {
  if (!date) return ''
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

const getTypeVariant = (type) => {
  const variants = {
    'Bonus': 'default',
    'Game': 'secondary',
    'Purchase': 'outline'
  }
  return variants[type] || 'secondary'
}

const calculateTotalCoins = () => {
  return transactions.value.reduce((sum, t) => sum + (t.coins || 0), 0)
}

const getUniqueTransactionTypes = () => {
  const types = new Set()
  transactions.value.forEach(t => {
    if (t.transaction_type?.name) {
      types.add(t.transaction_type.name)
    }
  })
  return types.size
}

const filteredTransactions = computed(() => {
  return transactions.value.filter(transaction => {
    const matchesSearch = 
      !searchTerm.value ||
      transaction.user?.email.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      transaction.user?.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      transaction.user_id.toString().includes(searchTerm.value)
    
    const matchesType = !filterType.value || transaction.transaction_type?.name === filterType.value
    
    return matchesSearch && matchesType
  })
})

const fetch = async () => {
  isLoading.value = true
  try {
    const res = await api.getAdminTransactions()
    transactions.value = res.data.data
    toast.success('Transactions loaded successfully')
  } catch (e) {
    console.error(e)
    toast.error('Failed to load transactions')
  } finally {
    isLoading.value = false
  }
}

onMounted(fetch)
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
