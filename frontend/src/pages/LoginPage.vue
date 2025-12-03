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
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none',
              errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
            ]"
            placeholder="your@email.com"
          />
          <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email[0] }}</p>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none',
              errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300'
            ]"
            placeholder="••••••"
          />
          <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password[0] }}</p>
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
      <div class="mt-6 p-4 border border-gray-200 rounded-lg text-center">
        <p class="text-gray-600">Don't have an account?</p>
        <router-link to="/register" class="inline-block mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
          Create Account
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage, getValidationErrors } from '@/utils/errorHandler'

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
      errors: {},
    }
  },
  methods: {
    async handleLogin() {
      this.errorMessage = ''
      this.errors = {}
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        await authStore.login(this.form)
        // Redirect to home
        this.$router.push('/')
      } catch (error) {
        this.errors = getValidationErrors(error)
        this.errorMessage = getErrorMessage(error)
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>
