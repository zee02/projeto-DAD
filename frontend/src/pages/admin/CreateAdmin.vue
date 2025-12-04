<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="p-6 w-full max-w-xl bg-white rounded shadow">
      <h1 class="text-2xl font-bold mb-4 text-center">Create Administrator</h1>

      <form @submit.prevent="submit">
        <div class="mb-3">
          <label class="block mb-1">Name</label>
          <input v-model="form.name" class="w-full p-2 border rounded" />
        </div>

        <div class="mb-3">
          <label class="block mb-1">Email</label>
          <input v-model="form.email" type="email" class="w-full p-2 border rounded" />
        </div>

        <div class="mb-3">
          <label class="block mb-1">Password</label>
          <input v-model="form.password" type="password" class="w-full p-2 border rounded" />
        </div>

        <div class="flex gap-3 justify-end mt-4">
          <button class="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Create Admin</button>
          <button class="px-4 py-2 bg-gray-300 text-black rounded" type="button" @click="$router.push('/admin')">Cancel</button>
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
