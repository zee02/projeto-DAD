import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(undefined)
  const token = ref(localStorage.getItem('auth_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined || token.value !== null
  })

  const currentUserID = computed(() => {
    return currentUser.value?.id || user.value?.id
  })

  const login = async (credentials) => {
    await apiStore.postLogin(credentials)
    const response = await apiStore.getAuthUser()
    currentUser.value = response.data
    return response.data
  }

  const logout = async () => {
    try {
      await apiStore.postLogout()
    } catch (e) {
      // Silently fail on logout
    }
    currentUser.value = undefined
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
  }

  const setUser = (newUser) => {
    user.value = newUser
    currentUser.value = newUser
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  return {
    currentUser,
    token,
    user,
    isLoggedIn,
    currentUserID,
    login,
    logout,
    setToken,
    setUser,
  }
})

