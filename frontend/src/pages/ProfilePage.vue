<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-gray-900">My Profile</h1>
        <router-link to="/" class="text-blue-600 hover:text-blue-700 font-semibold">
          ← Back
        </router-link>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
        {{ successMessage }}
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6 border-b border-gray-200">
        <button
          @click="activeTab = 'profile'"
          :class="[
            'pb-2 px-4 font-semibold border-b-2 transition',
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          Profile Info
        </button>
        <button
          @click="activeTab = 'password'"
          :class="[
            'pb-2 px-4 font-semibold border-b-2 transition',
            activeTab === 'password'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          Change Password
        </button>
        <button
          @click="activeTab = 'delete'"
          :class="[
            'pb-2 px-4 font-semibold border-b-2 transition',
            activeTab === 'delete'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          ]"
        >
          Delete Account
        </button>
      </div>

      <!-- Profile Info Tab -->
      <div v-if="activeTab === 'profile'" class="space-y-4">
        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-sm text-yellow-800">Coins Balance</p>
          <p class="text-2xl font-bold text-yellow-900">🪙 {{ user?.coins_balance || 0 }} coins</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            v-model="profileForm.name"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
          <input
            v-model="profileForm.nickname"
            type="text"
            maxlength="20"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            v-model="profileForm.bio"
            maxlength="1000"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Tell us about yourself..."
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">{{ (profileForm.bio || '').length }}/1000 characters</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Avatar Filename</label>
          <input
            v-model="profileForm.photo_avatar_filename"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="avatar.jpg"
          />
        </div>

        <button
          @click="updateProfile"
          :disabled="isUpdating"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {{ isUpdating ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      <!-- Password Tab -->
      <div v-if="activeTab === 'password'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            v-model="passwordForm.current_password"
            type="password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            v-model="passwordForm.new_password"
            type="password"
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <p class="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            v-model="passwordForm.new_password_confirmation"
            type="password"
            minlength="6"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          @click="changePassword"
          :disabled="isChangingPassword"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
        </button>
      </div>

      <!-- Delete Account Tab -->
      <div v-if="activeTab === 'delete'" class="space-y-4">
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-900 font-semibold mb-2">⚠️ Warning: This action cannot be undone</p>
          <p class="text-red-800 text-sm">
            Deleting your account will permanently remove all your data. This includes your profile, games history, and coin balance.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Your Password</label>
          <input
            v-model="deleteForm.password"
            type="password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          @click="showDeleteConfirmation = true"
          :disabled="!deleteForm.password || isDeleting"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {{ isDeleting ? 'Deleting...' : 'Delete My Account' }}
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showDeleteConfirmation = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl p-6 max-w-sm mx-4"
        @click.stop
      >
        <h3 class="text-xl font-bold text-gray-900 mb-4">Delete Account?</h3>
        <p class="text-gray-600 mb-6">
          Are you absolutely sure you want to delete your account? This action cannot be reversed.
        </p>
        <div class="flex gap-4">
          <button
            @click="showDeleteConfirmation = false"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            @click="deleteAccount"
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { getErrorMessage, getValidationErrors } from '@/utils/errorHandler'

export default {
  name: 'ProfilePage',
  data() {
    return {
      activeTab: 'profile',
      profileForm: {
        name: '',
        nickname: '',
        bio: '',
        photo_avatar_filename: '',
      },
      passwordForm: {
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      },
      deleteForm: {
        password: '',
      },
      isUpdating: false,
      isChangingPassword: false,
      isDeleting: false,
      errorMessage: '',
      successMessage: '',
      showDeleteConfirmation: false,
      errors: {},
    }
  },
  computed: {
    user() {
      const authStore = useAuthStore()
      return authStore.user
    },
  },
  mounted() {
    const authStore = useAuthStore()
    if (!authStore.token) {
      this.$router.push('/login')
      return
    }
    this.loadProfile()
  },
  methods: {
    loadProfile() {
      if (this.user) {
        this.profileForm = {
          name: this.user.name || '',
          nickname: this.user.nickname || '',
          bio: this.user.bio || '',
          photo_avatar_filename: this.user.photo_avatar_filename || '',
        }
      }
    },
    async updateProfile() {
      this.errorMessage = ''
      this.successMessage = ''
      this.errors = {}
      this.isUpdating = true

      try {
        const apiStore = useAPIStore()
        const authStore = useAuthStore()
        
        const response = await apiStore.putUpdateProfile(this.profileForm)

        authStore.setUser(response.user)
        this.successMessage = 'Profile updated successfully!'
        setTimeout(() => (this.successMessage = ''), 3000)
      } catch (error) {
        this.errors = getValidationErrors(error)
        this.errorMessage = getErrorMessage(error)
      } finally {
        this.isUpdating = false
      }
    },

    async changePassword() {
      if (this.passwordForm.new_password !== this.passwordForm.new_password_confirmation) {
        this.errorMessage = 'Passwords do not match'
        return
      }

      this.errorMessage = ''
      this.successMessage = ''
      this.errors = {}
      this.isChangingPassword = true

      try {
        const apiStore = useAPIStore()
        const authStore = useAuthStore()
        
        const response = await apiStore.postChangePassword({
          current_password: this.passwordForm.current_password,
          new_password: this.passwordForm.new_password,
          new_password_confirmation: this.passwordForm.new_password_confirmation,
        })

        this.successMessage = response.message
        this.passwordForm = {
          current_password: '',
          new_password: '',
          new_password_confirmation: '',
        }
        setTimeout(() => {
          authStore.logout()
          this.$router.push('/login')
        }, 2000)
      } catch (error) {
        this.errors = getValidationErrors(error)
        this.errorMessage = getErrorMessage(error)
      } finally {
        this.isChangingPassword = false
      }
    },

    async deleteAccount() {
      this.errorMessage = ''
      this.isDeleting = true

      try {
        const apiStore = useAPIStore()
        const authStore = useAuthStore()
        
        await apiStore.deleteAccount(this.deleteForm.password)

        authStore.logout()
        this.$router.push('/login')
      } catch (error) {
        this.errors = getValidationErrors(error)
        this.errorMessage = getErrorMessage(error)
        this.showDeleteConfirmation = false
      } finally {
        this.isDeleting = false
      }
    },
  },
}
</script>
