<template>
  <Toaster richColors />
  <nav v-if="$route.path !== '/blocked'" class="fixed top-0 left-0 right-0 z-50 w-full bg-white shadow-md p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink to="/"> {{ pageTitle }} </RouterLink>
    </div>
    <div class="flex items-center gap-6">
      <div v-if="authStore.isLoggedIn && authStore.user?.type !== 'A'" class="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg cursor-pointer hover:bg-yellow-200 transition relative" @click="$router.push('/coin-shop')">
        <span class="text-sm font-semibold text-yellow-900">{{ authStore.user?.coins_balance || 0 }} 🪙</span>
        <span class="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">+</span>
      </div>
      <NavBar @logout="logout" :userLoggedIn="authStore.isLoggedIn" :user="authStore.user" />
    </div>
  </nav>
  <div :class="$route.path !== '/blocked' ? 'pt-20' : ''">
    <main class="container m-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { toast } from 'vue-sonner';
import 'vue-sonner/style.css'
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import NavBar from './components/layout/NavBar.vue';
import { useAuthStore } from './stores/auth';
import { useSocketStore } from './stores/socket';

const authStore = useAuthStore()
const socketStore = useSocketStore()


const year = new Date().getFullYear()
const pageTitle = ref(`DAD ${year}/${String(year + 1).slice(-2)}`)



const router = useRouter()

const logout = () => {
  const p = authStore.logout()

  toast.promise(p, {
    loading: 'Calling API',
    success: () => 'Logout Successful',
    error: (data) => `[API] Error - ${data?.response?.data?.message}`,
  })

  p.then(() => {
    // After logout, redirect to home and clear any route-sensitive state
    router.push('/login')
  })
}

onMounted(() => {
  socketStore.handleConnection()
})


</script>

<style></style>`