<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-4">
    <div class="w-full max-w-md bg-card text-card-foreground rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-foreground mb-6 text-center">Create Account</h1>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground',
              errors.name ? 'border-destructive bg-destructive/5' : 'border-border'
            ]"
            placeholder="John Doe"
          />
          <p v-if="errors.name" class="text-xs text-destructive mt-1">{{ errors.name[0] }}</p>
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-foreground mb-1">Email Address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground',
              errors.email ? 'border-destructive bg-destructive/5' : 'border-border'
            ]"
            placeholder="your@email.com"
          />
          <p v-if="errors.email" class="text-xs text-destructive mt-1">{{ errors.email[0] }}</p>
        </div>

        <!-- Nickname (Optional) -->
        <div>
          <label for="nickname" class="block text-sm font-medium text-foreground mb-1">Nickname (Optional)</label>
          <input
            id="nickname"
            v-model="form.nickname"
            type="text"
            maxlength="20"
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground',
              errors.nickname ? 'border-destructive bg-destructive/5' : 'border-border'
            ]"
            placeholder="MyNickname"
          />
          <p v-if="errors.nickname" class="text-xs text-destructive mt-1">{{ errors.nickname[0] }}</p>
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-foreground mb-1">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="3"
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground',
              errors.password ? 'border-destructive bg-destructive/5' : 'border-border'
            ]"
            placeholder="••••••"
          />
          <p class="text-xs text-muted-foreground mt-1">Minimum 3 characters</p>
          <p v-if="errors.password" class="text-xs text-destructive mt-1">{{ errors.password[0] }}</p>
        </div>

        <!-- Password Confirmation -->
        <div>
          <label for="password_confirmation" class="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
          <input
            id="password_confirmation"
            v-model="form.password_confirmation"
            type="password"
            required
            minlength="3"
            :class="[
              'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground',
              errors.password_confirmation ? 'border-destructive bg-destructive/5' : 'border-border'
            ]"
            placeholder="••••••"
          />
          <p v-if="errors.password_confirmation" class="text-xs text-destructive mt-1">{{ errors.password_confirmation[0] }}</p>
        </div>

        <!-- Register Button -->
        <button
          :disabled="isLoading"
          type="submit"
          class="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <!-- Login Link -->
      <p class="text-center text-muted-foreground mt-6">
        Already have an account?
        <router-link to="/login" class="text-primary hover:text-primary/80 font-semibold">
          Login here
        </router-link>
      </p>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage, getValidationErrors } from '@/utils/errorHandler'

export default {
  name: 'RegisterPage',
  data() {
    return {
      form: {
        name: '',
        email: '',
        nickname: '',
        password: '',
        password_confirmation: '',
      },
      isLoading: false,
      errorMessage: '',
      errors: {},
    }
  },
  methods: {
    async handleRegister() {
      this.errorMessage = ''
      this.errors = {}
      this.isLoading = true

      try {
        const authStore = useAuthStore()
        await authStore.register(this.form)
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
