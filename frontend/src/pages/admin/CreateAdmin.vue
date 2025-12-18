<template>
  <div class="min-h-[60vh] flex items-center justify-center bg-background">
    <div class="p-6 w-full max-w-xl bg-card text-card-foreground rounded shadow border border-border">
      <h1 class="text-2xl font-bold mb-4 text-center text-foreground">Create Administrator</h1>

      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="block mb-1 text-foreground font-medium">Name</label>
          <input v-model="form.name" class="w-full p-2 border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
        </div>

        <div class="mb-3">
          <label class="block mb-1 text-foreground font-medium">Email</label>
          <input v-model="form.email" type="email" class="w-full p-2 border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
        </div>

        <div class="mb-3">
          <label class="block mb-1 text-foreground font-medium">Password</label>
          <input v-model="form.password" type="password" class="w-full p-2 border border-border rounded bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none" />
        </div>

        <div class="flex gap-3 justify-end mt-4">
          <button class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/80 transition" type="submit">Create Admin</button>
          <button class="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition" type="button" @click="$router.push('/admin')">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useAPIStore } from '@/stores/api'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/utils/errorHandler'

const api = useAPIStore()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '' })

const submit = async () => {
  try {
    await api.postCreateAdmin({ ...form })
    toast.success('Administrator created')
    router.push('/admin')
  } catch (e) {
    console.error(e)
    toast.error(getErrorMessage(e))
  }
}
</script>

<style scoped>
</style>
