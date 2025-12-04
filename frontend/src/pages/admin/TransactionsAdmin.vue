<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Transactions</h1>

    <table class="w-full table-auto border-collapse">
      <thead>
        <tr class="text-left">
          <th class="p-2">Datetime</th>
          <th class="p-2">User</th>
          <th class="p-2">Type</th>
          <th class="p-2">Coins</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in transactions" :key="t.id" class="border-t">
          <td class="p-2">{{ t.transaction_datetime }}</td>
          <td class="p-2">{{ t.user?.email || t.user_id }}</td>
          <td class="p-2">{{ t.transaction_type?.name || t.coin_transaction_type_id }}</td>
          <td class="p-2">{{ t.coins }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const transactions = ref([])
const api = useAPIStore()

const fetch = async () => {
  try {
    const res = await api.getAdminTransactions()
    transactions.value = res.data.data
  } catch (e) {
    console.error(e)
    toast.error('Failed to load transactions')
  }
}

onMounted(fetch)
</script>

<style scoped>
</style>
