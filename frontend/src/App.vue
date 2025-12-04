<template>
  <Toaster richColors />
  <nav class="max-w-full p-5 flex flex-row justify-between align-middle">
    <div class="align-middle text-xl">
      <RouterLink to="/"> {{ pageTitle }} </RouterLink>
      <span class="text-xs" v-if="authStore.currentUser">&nbsp;&nbsp;&nbsp;
        ({{ authStore.currentUser?.name }})
      </span>
    </div>
    <div class="flex items-center gap-6">
      <div v-if="authStore.isLoggedIn" class="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg cursor-pointer hover:bg-yellow-200 transition relative" @click="$router.push('/coin-shop')">
        <span class="text-sm font-semibold text-yellow-900">{{ authStore.user?.coins_balance || 0 }} 🪙</span>
        <span class="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">+</span>
      </div>
      <NavBar @logout="logout" :userLoggedIn="authStore.isLoggedIn" :user="authStore.user" />
    </div>
  </nav>
  <div>
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
import { Toaster } from '@/components/ui/sonner'
import NavBar from './components/layout/NavBar.vue';
import { useAuthStore } from './stores/auth';
import { useSocketStore } from './stores/socket';

const authStore = useAuthStore()
const socketStore = useSocketStore()


const year = new Date().getFullYear()
const pageTitle = ref(`DAD ${year}/${String(year + 1).slice(-2)}`)



const logout = () => {

  toast.promise(authStore.logout(), {
    loading: 'Calling API',
    success: () => {
      return 'Logout Sucessfull '
    },
    error: (data) => `[API] Error saving game - ${data?.response?.data?.message}`,
  })

}

onMounted(() => {
  socketStore.handleConnection()
})


</script>

<style></style>`