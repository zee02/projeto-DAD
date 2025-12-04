<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Games</h1>

    <table class="w-full table-auto border-collapse">
      <thead>
        <tr class="text-left">
          <th class="p-2">ID</th>
          <th class="p-2">Type</th>
          <th class="p-2">Status</th>
          <th class="p-2">Began At</th>
          <th class="p-2">Ended At</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="g in games" :key="g.id" class="border-t">
          <td class="p-2">{{ g.id }}</td>
          <td class="p-2">{{ g.type }}</td>
          <td class="p-2">{{ g.status }}</td>
          <td class="p-2">{{ g.began_at }}</td>
          <td class="p-2">{{ g.ended_at }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const games = ref([])
const api = useAPIStore()

const fetch = async () => {
  try {
    const res = await api.getGames(true)
    games.value = res.data.data
  } catch (e) {
    console.error(e)
    toast.error('Failed to load games')
  }
}

onMounted(fetch)
</script>

<style scoped>
</style>
