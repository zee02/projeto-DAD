<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Manage Users</h1>

    <table class="w-full table-auto border-collapse">
      <thead>
        <tr class="text-left">
          <th class="p-2">ID</th>
          <th class="p-2">Name</th>
          <th class="p-2">Email</th>
          <th class="p-2">Type</th>
          <th class="p-2">Blocked</th>
          <th class="p-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id" class="border-t">
          <td class="p-2">{{ u.id }}</td>
          <td class="p-2">{{ u.name }}</td>
          <td class="p-2">{{ u.email }}</td>
          <td class="p-2">{{ u.type }}</td>
          <td class="p-2">{{ u.blocked ? 'Yes' : 'No' }}</td>
          <td class="p-2">
            <button class="px-3 py-1 rounded bg-indigo-600 text-white" @click="goToActions(u)">Actions</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'

const users = ref([])
const api = useAPIStore()
const router = useRouter()

const fetch = async () => {
  try {
    const res = await api.getAdminUsers()
    users.value = res.data.data
  } catch (e) {
    console.error(e)
    toast.error('Failed to load users')
  }
}

const toggleBlock = async (u) => {
  try {
    const newBlocked = !u.blocked
    await api.patchUserBlock(u.id, newBlocked)
    u.blocked = newBlocked
  } catch (e) {
    console.error(e)
    alert('Failed to update user')
  }
}

const goToActions = (u) => {
  // navigate to the dedicated user editor view
  router.push({ name: 'admin-user', params: { id: u.id } })
}

onMounted(fetch)
</script>

<style scoped>
</style>
