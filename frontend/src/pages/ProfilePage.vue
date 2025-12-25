<template>
  <div class="min-h-screen bg-background py-12 px-4">
    <div class="max-w-2xl mx-auto bg-card text-card-foreground rounded-lg shadow-lg p-8 border border-border">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold text-foreground">My Profile</h1>
        <router-link to="/" class="text-primary hover:text-primary/80 font-semibold">
          ← Back
        </router-link>
      </div>

      <!-- Error/Success Messages -->
      <div v-if="errorMessage" class="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-4 p-3 bg-secondary/10 border border-secondary/30 text-secondary rounded">
        {{ successMessage }}
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6 border-b border-border">
        <button
          @click="activeTab = 'profile'"
          :class="[
            'pb-2 px-4 font-semibold border-b-2 transition',
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          Profile Info
        </button>
        <button
          @click="activeTab = 'password'"
          :class="[
            'pb-2 px-4 font-semibold border-b-2 transition',
            activeTab === 'password'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          Change Password
        </button>
        <button
          v-if="user?.type !== 'A'"
          @click="activeTab = 'delete'"
          :class="[
            'pb-2 px-4 font-semibold border-b-2 transition',
            activeTab === 'delete'
              ? 'border-destructive text-destructive'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          ]"
        >
          Delete Account
        </button>
      </div>

      <!-- Profile Info Tab -->
      <div v-if="activeTab === 'profile'" class="space-y-4">
        <!-- User Header Card -->
        <div class="p-6 bg-primary/5 border border-primary/20 rounded-lg text-center">
          <div class="flex justify-center mb-4">
            <div class="w-32 h-32 rounded-full border-4 border-primary/30 bg-background flex items-center justify-center overflow-hidden">
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

        <div class="p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <p class="text-sm text-muted-foreground">Coins Balance</p>
          <p class="text-2xl font-bold text-accent">🪙 {{ user?.coins_balance || 0 }} coins</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <input
            v-model="profileForm.name"
            type="text"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Nickname</label>
          <input
            v-model="profileForm.nickname"
            type="text"
            maxlength="20"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Bio</label>
          <textarea
            v-model="profileForm.bio"
            maxlength="1000"
            rows="4"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none bg-input text-foreground"
            placeholder="Tell us about yourself..."
          ></textarea>
          <p class="text-xs text-muted-foreground mt-1">{{ (profileForm.bio || '').length }}/1000 characters</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-3">Avatar</label>
          <div class="flex items-center gap-4">
            <!-- Avatar Preview -->
            <div 
              @click="$refs.avatarInput.click()"
              class="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
            >
              <img 
                v-if="avatarPreview"
                :src="avatarPreview" 
                :alt="profileForm.photo_avatar_filename"
                class="w-full h-full object-cover rounded-lg"
              />
              <div v-else class="text-center">
                <p class="text-2xl mb-1">📷</p>
                <p class="text-xs text-muted-foreground">Click to upload</p>
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
              <p v-if="profileForm.photo_avatar_filename" class="text-sm text-foreground">
                <strong>Current:</strong> {{ profileForm.photo_avatar_filename }}
              </p>
              <p class="text-xs text-muted-foreground mt-2">
                Click the image to select a new avatar (JPG, PNG, GIF)
              </p>
            </div>
          </div>
        </div>

        <button
          @click="updateProfile"
          :disabled="isUpdating"
          class="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {{ isUpdating ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>

      <!-- Password Tab -->
      <div v-if="activeTab === 'password'" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Current Password</label>
          <input
            v-model="passwordForm.current_password"
            type="password"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">New Password</label>
          <input
            v-model="passwordForm.new_password"
            type="password"
            minlength="3"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground"
          />
          <p class="text-xs text-muted-foreground mt-1">Minimum 3 characters</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Confirm New Password</label>
          <input
            v-model="passwordForm.new_password_confirmation"
            type="password"
            minlength="6"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-input text-foreground"
          />
        </div>

        <button
          @click="changePassword"
          :disabled="isChangingPassword"
          class="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {{ isChangingPassword ? 'Changing...' : 'Change Password' }}
        </button>
      </div>

      <!-- Delete Account Tab -->
      <div v-if="activeTab === 'delete' && user?.type !== 'A'" class="space-y-4">
        <div class="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p class="text-destructive font-semibold mb-2">⚠️ Warning: This action cannot be undone</p>
          <p class="text-destructive text-sm">
            Deleting your account will permanently remove all your data. This includes your profile, games history, and coin balance.
          </p>
        </div>

        <!-- Confirmation Method Selector -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">Choose confirmation method:</label>
          <div class="space-y-2">
            <label class="flex items-center cursor-pointer text-foreground">
              <input
                type="radio"
                v-model="deleteForm.confirmationType"
                value="password"
                class="mr-2"
              />
              <span>Confirm with password</span>
            </label>
            <label class="flex items-center cursor-pointer text-foreground">
              <input
                type="radio"
                v-model="deleteForm.confirmationType"
                value="username"
                class="mr-2"
              />
              <span>Confirm with username</span>
            </label>
            <label class="flex items-center cursor-pointer text-foreground">
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
          <label class="block text-sm font-medium text-foreground mb-1">Enter Your Password</label>
          <input
            v-model="deleteForm.password"
            type="password"
            placeholder="Enter your password"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-destructive focus:border-transparent outline-none bg-input text-foreground"
          />
        </div>

        <!-- Username Confirmation -->
        <div v-if="deleteForm.confirmationType === 'username'">
          <label class="block text-sm font-medium text-foreground mb-1">Type your username to confirm</label>
          <input
            v-model="deleteForm.username"
            type="text"
            :placeholder="`Enter your username`"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-destructive focus:border-transparent outline-none bg-input text-foreground"
          />
        </div>

        <!-- Phrase Confirmation -->
        <div v-if="deleteForm.confirmationType === 'phrase'">
          <label class="block text-sm font-medium text-foreground mb-1">
            Type the phrase "<code class="bg-muted px-1 rounded text-destructive">{{ confirmationPhrase }}</code>" to confirm
          </label>
          <input
            v-model="deleteForm.phrase"
            type="text"
            :placeholder="confirmationPhrase"
            class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-destructive focus:border-transparent outline-none bg-input text-foreground"
          />
        </div>

        <button
          @click="showDeleteConfirmation = true"
          :disabled="!isDeleteConfirmationValid || isDeleting"
          class="w-full bg-destructive hover:bg-destructive/80 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        class="bg-card text-card-foreground rounded-lg shadow-xl p-6 max-w-sm mx-4 border border-border"
        @click.stop
      >
        <h3 class="text-xl font-bold text-foreground mb-4">Delete Account?</h3>
        <p class="text-muted-foreground mb-6">
          Are you absolutely sure you want to delete your account? This action cannot be reversed.
        </p>
        <div class="flex gap-4">
          <button
            @click="showDeleteConfirmation = false"
            class="flex-1 px-4 py-2 border border-border rounded-lg text-foreground font-semibold hover:bg-muted/50 transition"
          >
            Cancel
          </button>
          <button
            @click="deleteAccount"
            class="flex-1 px-4 py-2 bg-destructive hover:bg-destructive/80 text-white font-semibold rounded-lg transition"
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
