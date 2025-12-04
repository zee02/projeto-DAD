<template>
  <div class="min-h-[60vh] flex items-center justify-center">
    <div class="p-6 w-full max-w-xl bg-white rounded shadow">
      <h1 class="text-2xl font-bold mb-4 text-center">Edit User</h1>

      <div v-if="loading" class="text-center">Loading...</div>

      <form v-else @submit.prevent="save">
        <div class="mb-4 flex items-center gap-4">
          <div class="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            <img v-if="form.photo_avatar_url" :src="form.photo_avatar_url" alt="avatar" class="w-full h-full object-cover" />
            <div v-else class="text-sm text-gray-500">No image</div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="block text-sm">Avatar</label>
            <div class="flex items-center gap-3">
              <label class="px-3 py-1 bg-blue-600 text-white rounded cursor-pointer inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4v8z" />
                </svg>
                Choose file
                <input type="file" accept="image/*" @change="uploadAvatar" class="hidden" />
              </label>
              <div class="text-sm text-gray-600">
                <span v-if="selectedFileName">{{ selectedFileName }}</span>
                <span v-else-if="form.photo_avatar_url">Current avatar</span>
                <span v-else>No file selected</span>
              </div>
            </div>
          </div>
        </div>
      <div class="mb-3">
        <label class="block mb-1">Name</label>
        <input v-model="form.name" class="w-full p-2 border rounded" />
      </div>

      <div class="mb-3">
        <label class="block mb-1">Nickname</label>
        <input v-model="form.nickname" class="w-full p-2 border rounded" />
      </div>

      <div class="mb-3">
        <label class="block mb-1">Email</label>
        <input v-model="form.email" type="email" class="w-full p-2 border rounded" />
      </div>

      <div class="mb-3">
        <label class="block mb-1">Type</label>
        <select v-model="form.type" class="w-full p-2 border rounded">
          <option value="P">Player</option>
          <option value="A">Administrator</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="inline-flex items-center gap-2">
          <input type="checkbox" v-model="form.blocked" />
          <span>Blocked</span>
        </label>
      </div>

      <div class="mb-3">
        <label class="block mb-1">Coins Balance</label>
        <input v-model.number="form.coins_balance" type="number" class="w-full p-2 border rounded" />
      </div>

      <div class="mb-3">
        <label class="block mb-1">Bio</label>
        <textarea v-model="form.bio" class="w-full p-2 border rounded" rows="4"></textarea>
      </div>

      <div class="mb-3">
        <label class="block mb-1">Password (leave empty to keep)</label>
        <input v-model="form.password" type="password" class="w-full p-2 border rounded" />
      </div>

        <div class="flex gap-3 justify-end mt-4">
          <button class="px-4 py-2 bg-green-600 text-white rounded" type="submit">Save</button>
          <button class="px-4 py-2 bg-red-600 text-white rounded" type="button" @click="confirmDelete">Delete</button>
          <button class="px-4 py-2 bg-gray-300 text-black rounded" type="button" @click="$router.push('/admin/users')">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAPIStore } from '@/stores/api'
import { toast } from 'vue-sonner'
import { getErrorMessage } from '@/utils/errorHandler'

const route = useRoute()
const router = useRouter()
const api = useAPIStore()

const id = route.params.id
  const loading = ref(true)
  const form = ref({ name: '', nickname: '', email: '', type: 'P', blocked: false, password: '', bio: '', coins_balance: 0, photo_avatar_url: null })
  const selectedFileName = ref(null)
  const avatarFile = ref(null)

const load = async () => {
  loading.value = true
  try {
    const res = await api.getAdminUser(id)
    const u = res.data.user
    form.value.name = u.name
    form.value.nickname = u.nickname ?? ''
    form.value.email = u.email
    form.value.type = u.type
    form.value.blocked = !!u.blocked
    form.value.bio = u.bio ?? ''
    form.value.coins_balance = u.coins_balance ?? 0
    form.value.photo_avatar_url = u.photo_avatar_url || null
  } catch (e) {
    console.error(e)
    toast.error('Failed to load user')
    router.push('/admin/users')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  try {
    // Upload avatar first if a new one was selected
    if (avatarFile.value) {
      try {
        console.log('Uploading avatar:', avatarFile.value.name)
        const res = await api.postUploadUserAvatar(id, avatarFile.value)
        console.log('Avatar upload response:', res)
        
        if (res.data && res.data.photo_avatar_url) {
          form.value.photo_avatar_url = res.data.photo_avatar_url
          avatarFile.value = null // Clear the stored file
          toast.success('Avatar uploaded successfully')
        } else {
          throw new Error('No URL returned from server')
        }
      } catch (err) {
        console.error('Avatar upload error:', err)
        toast.error('Avatar upload failed: ' + getErrorMessage(err))
        return
      }
    }

    const payload = {
      name: form.value.name,
      nickname: form.value.nickname,
      email: form.value.email,
      type: form.value.type,
      blocked: form.value.blocked,
      bio: form.value.bio,
      coins_balance: form.value.coins_balance,
    }
    if (form.value.password) payload.password = form.value.password
    
    console.log('Saving user data:', payload)
    await api.putUpdateUser(id, payload)
    toast.success('User updated')
    router.push('/admin/users')
  } catch (e) {
    console.error('Save error:', e)
    toast.error(getErrorMessage(e))
  }
}

const confirmDelete = async () => {
  if (!confirm('Delete this user? This is a soft-delete.')) return
  try {
    await api.deleteUser(id)
    toast.success('User deleted')
    router.push('/admin/users')
  } catch (e) {
    console.error(e)
    toast.error(getErrorMessage(e))
  }
}

onMounted(load)

const uploadAvatar = (e) => {
  const file = e.target.files && e.target.files[0]
  if (!file) return
  
  // Validate file
  if (!file.type.startsWith('image/')) {
    toast.error('Please select a valid image file')
    return
  }
  
  // Store file for later upload when Save is clicked
  avatarFile.value = file
  selectedFileName.value = file.name
  
  // Show preview immediately
  const reader = new FileReader()
  reader.onload = (event) => {
    form.value.photo_avatar_url = event.target.result
  }
  reader.readAsDataURL(file)
  
  toast.success('Image selected - click Save to upload')
}
</script>

<style scoped></style>
