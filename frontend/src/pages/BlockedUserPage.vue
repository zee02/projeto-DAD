<template>
  <div class="min-h-screen flex items-center justify-center bg-white px-4">
    <div class="max-w-md w-full">
      <div class="bg-white shadow-2xl rounded-2xl p-8 text-center">
        <div class="mb-6">
          <div class="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <svg class="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
        </div>

        <h1 class="text-3xl font-bold text-gray-900 mb-3">Conta Bloqueada</h1>
        <p class="text-gray-600 mb-6">
          A sua conta foi bloqueada por um administrador. Não pode aceder à plataforma neste momento.
        </p>

        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-red-800">
            Se acha que isto é um erro, contacte o suporte ou um administrador da plataforma.
          </p>
        </div>

        <button @click="handleLogout" 
          class="w-full bg-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-700 transition-colors">
          Terminar Sessão
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
