<template>
  <div class="min-h-screen bg-white py-12 px-4">
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
        <!-- User Header Card -->
        <div class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg text-center">
          <div class="flex justify-center mb-4">
            <div class="w-32 h-32 rounded-full border-4 border-blue-300 bg-white flex items-center justify-center overflow-hidden">
              <img 
                v-if="avatarPreview || user?.photo_avatar_filename"
                :src="avatarPreview || getAvatarUrl(user?.photo_avatar_filename)" 
                :alt="user?.nickname"
                class="w-full h-full object-cover"
              />
              <div v-else class="text-6xl">👤</div>
            </div>
          </div>
        </div>

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
          <label class="block text-sm font-medium text-gray-700 mb-3">Avatar</label>
          <div class="flex items-center gap-4">
            <!-- Avatar Preview -->
            <div 
              @click="$refs.avatarInput.click()"
              class="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <img 
                v-if="avatarPreview"
                :src="avatarPreview" 
                :alt="profileForm.photo_avatar_filename"
                class="w-full h-full object-cover rounded-lg"
              />
              <div v-else class="text-center">
                <p class="text-2xl mb-1">📷</p>
                <p class="text-xs text-gray-500">Click to upload</p>
              </div>
            </div>
            <!-- Hidden File Input -->
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleAvatarUpload"
            />
            <!-- File Info -->
            <div class="flex-1">
              <p v-if="profileForm.photo_avatar_filename" class="text-sm text-gray-700">
                <strong>Current:</strong> {{ profileForm.photo_avatar_filename }}
              </p>
              <p class="text-xs text-gray-500 mt-2">
                Click the image to select a new avatar (JPG, PNG, GIF)
              </p>
            </div>
          </div>
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

        <!-- Confirmation Method Selector -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Choose confirmation method:</label>
          <div class="space-y-2">
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="deleteForm.confirmationType"
                value="password"
                class="mr-2"
              />
              <span>Confirm with password</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="deleteForm.confirmationType"
                value="username"
                class="mr-2"
              />
              <span>Confirm with username</span>
            </label>
            <label class="flex items-center cursor-pointer">
              <input
                type="radio"
                v-model="deleteForm.confirmationType"
                value="phrase"
                class="mr-2"
              />
              <span>Confirm with phrase</span>
            </label>
          </div>
        </div>

        <!-- Password Confirmation -->
        <div v-if="deleteForm.confirmationType === 'password'">
          <label class="block text-sm font-medium text-gray-700 mb-1">Enter Your Password</label>
          <input
            v-model="deleteForm.password"
            type="password"
            placeholder="Enter your password"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
        </div>

        <!-- Username Confirmation -->
        <div v-if="deleteForm.confirmationType === 'username'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Type your username "<code class="bg-gray-100 px-1 rounded">{{ user?.username }}</code>" to confirm
          </label>
          <input
            v-model="deleteForm.username"
            type="text"
            :placeholder="user?.username"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
        </div>

        <!-- Phrase Confirmation -->
        <div v-if="deleteForm.confirmationType === 'phrase'">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Type the phrase "<code class="bg-gray-100 px-1 rounded text-red-600">{{ confirmationPhrase }}</code>" to confirm
          </label>
          <input
            v-model="deleteForm.phrase"
            type="text"
            :placeholder="confirmationPhrase"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          @click="showDeleteConfirmation = true"
          :disabled="!isDeleteConfirmationValid || isDeleting"
          class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        confirmationType: 'password',
        password: '',
        username: '',
        phrase: '',
      },
      confirmationPhrase: 'DELETE MY ACCOUNT',
      isUpdating: false,
      isChangingPassword: false,
      isDeleting: false,
      errorMessage: '',
      successMessage: '',
      showDeleteConfirmation: false,
      errors: {},
      avatarPreview: null,
      avatarFile: null,
    }
  },
  computed: {
    user() {
      const authStore = useAuthStore()
      return authStore.user
    },
    isDeleteConfirmationValid() {
      const { confirmationType, password, username, phrase } = this.deleteForm
      
      if (confirmationType === 'password') {
        return password.length > 0
      }
      if (confirmationType === 'username') {
        return username === this.user?.username
      }
      if (confirmationType === 'phrase') {
        return phrase === this.confirmationPhrase
      }
      return false
    },
  },
  watch: {
    activeTab(newTab) {
      // Reload profile data when switching to profile tab
      if (newTab === 'profile') {
        this.loadProfile()
      }
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
        // Load avatar from storage (BD)
        if (this.user.photo_avatar_filename) {
          this.avatarPreview = this.getAvatarUrl(this.user.photo_avatar_filename)
        } else {
          this.avatarPreview = null
        }
        // Reset avatar file
        this.avatarFile = null
      }
    },
    handleAvatarUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      // Store file for later upload
      this.avatarFile = file

      // Show preview immediately
      const reader = new FileReader()
      reader.onload = (e) => {
        this.avatarPreview = e.target.result
      }
      reader.readAsDataURL(file)
    },

    async uploadAvatarToServer(file) {
      try {
        const apiStore = useAPIStore()
        const authStore = useAuthStore()
        
        const response = await apiStore.postUploadAvatar(file)
        
        // Update user with the response from server
        authStore.setUser(response.user)
        this.profileForm.photo_avatar_filename = response.photo_avatar_filename
        this.avatarPreview = response.photo_avatar_url
        
        return true
      } catch (error) {
        this.errorMessage = getErrorMessage(error)
        console.error('Avatar upload failed:', error)
        return false
      }
    },
    getAvatarUrl(filename) {
      // Return the actual storage URL
      if (!filename) return null
      return `http://127.0.0.1:8000/storage/avatars/${filename}`
    },
    async updateProfile() {
      this.errorMessage = ''
      this.successMessage = ''
      this.errors = {}
      this.isUpdating = true

      try {
        const apiStore = useAPIStore()
        const authStore = useAuthStore()
        
        // Upload avatar first if a new one was selected
        if (this.avatarFile) {
          const uploadSuccess = await this.uploadAvatarToServer(this.avatarFile)
          if (!uploadSuccess) {
            this.isUpdating = false
            return
          }
          this.avatarFile = null // Clear the stored file
        }
        
        // Build data object only with non-empty fields
        const dataToUpdate = {}
        
        if (this.profileForm.name && this.profileForm.name.trim()) {
          dataToUpdate.name = this.profileForm.name.trim()
        }
        if (this.profileForm.nickname && this.profileForm.nickname.trim()) {
          dataToUpdate.nickname = this.profileForm.nickname.trim()
        }
        if (this.profileForm.bio && this.profileForm.bio.trim()) {
          dataToUpdate.bio = this.profileForm.bio.trim()
        }
        
        // Only call updateProfile if there's data to update
        if (Object.keys(dataToUpdate).length > 0) {
          const response = await apiStore.putUpdateProfile(dataToUpdate)
          authStore.setUser(response.user)
        }
        
        this.successMessage = 'Profile updated successfully!'
        this.loadProfile() // Reload to show the saved data
        
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
      this.successMessage = ''
      this.isDeleting = true

      try {
        const apiStore = useAPIStore()
        const authStore = useAuthStore()
        
        // Only send password if password confirmation was used
        const password = this.deleteForm.confirmationType === 'password' ? this.deleteForm.password : null
        await apiStore.deleteAccount(password)

        // Show success message before logout
        this.successMessage = 'Account deleted successfully. Your account is now deactivated. Redirecting...'
        this.showDeleteConfirmation = false
        
        setTimeout(() => {
          authStore.logout()
          this.$router.push('/login')
        }, 3000)
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
