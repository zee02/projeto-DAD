<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">Login</h1>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="your@email.com"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="••••••"
          />
        </div>

        <!-- Login Button -->
        <button
          :disabled="isLoading"
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <!-- Register Link -->
      <p class="text-center text-gray-600 mt-6">
        Don't have an account?
        <router-link to="/register" class="text-blue-600 hover:text-blue-700 font-semibold">
          Register here
        </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'LoginPage',
  data() {
    return {
      form: {
        email: '',
        password: '',
      },
      isLoading: false,
      errorMessage: '',
    }
  },
  methods: {
    async handleLogin() {
      this.errorMessage = ''
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        await authStore.login(this.form)
        // Redirect to home
        this.$router.push('/')
      } catch (error) {
        this.errorMessage = error.response?.data?.message || error.response?.data?.errors?.email?.[0] || error.message || 'Login failed'
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>
