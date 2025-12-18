<template>
  <div class="p-6 bg-background">
    <h1 class="text-2xl font-bold mb-4 text-foreground">Manage Users</h1>

    <table class="w-full table-auto border-collapse">
      <thead>
        <tr class="text-left">
          <th class="p-2 text-foreground">ID</th>
          <th class="p-2 text-foreground">Name</th>
          <th class="p-2 text-foreground">Email</th>
          <th class="p-2 text-foreground">Type</th>
          <th class="p-2 text-foreground">Blocked</th>
          <th class="p-2 text-foreground">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id" class="border-t border-border hover:bg-muted/30">
          <td class="p-2 text-foreground">{{ u.id }}</td>
          <td class="p-2 text-foreground">{{ u.name }}</td>
          <td class="p-2 text-muted-foreground">{{ u.email }}</td>
          <td class="p-2 text-foreground">{{ formatUserType(u.type) }}</td>
          <td class="p-2 text-foreground">{{ u.blocked ? 'Yes' : 'No' }}</td>
          <td class="p-2">
            <button class="px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition" @click="goToActions(u)">Actions</button>
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

const formatUserType = (t) => {
  if (!t) return ''
  if (t === 'A') return 'Admin'
  if (t === 'P') return 'Player'
  return t
}

const goToActions = (u) => {
  // navigate to the dedicated user editor view
  router.push({ name: 'admin-user', params: { id: u.id } })
}

onMounted(fetch)
</script>

<style scoped>
</style>
