import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAPIStore } from './api'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const apiStore = useAPIStore()

  const currentUser = ref(undefined)
  const token = ref(localStorage.getItem('auth_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))

  // Ensure axios Authorization header is set on app reload if a token exists
  if (token.value) {
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    } catch (e) {
      // ignore header set errors
    }
  }

  const isLoggedIn = computed(() => {
    return currentUser.value !== undefined || token.value !== null
  })

  const currentUserID = computed(() => {
    return currentUser.value?.id || user.value?.id
  })

  const register = async (credentials) => {
    const response = await apiStore.postRegister(credentials)
    token.value = response.token
    currentUser.value = response.user
    user.value = response.user
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('auth_user', JSON.stringify(response.user))
    return response.user
  }

  const login = async (credentials) => {
    const response = await apiStore.postLogin(credentials)
    token.value = response.token
    currentUser.value = response.user
    user.value = response.user
    localStorage.setItem('auth_token', response.token)
    localStorage.setItem('auth_user', JSON.stringify(response.user))
    return response.user
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
    // Remove authorization header so unauthenticated users cannot call protected APIs
    try {
      delete axios.defaults.headers.common['Authorization']
    } catch (e) {
      // ignore
    }
  }

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    } catch (e) {
      // ignore
    }
  }

  const setUser = (newUser) => {
    user.value = newUser
    currentUser.value = newUser
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  const refreshUser = async () => {
    try {
      const response = await apiStore.get('/users/me')
      setUser(response)
      return response
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return {
    currentUser,
    token,
    user,
    isLoggedIn,
    currentUserID,
    register,
    login,
    logout,
    setToken,
    setUser,
    refreshUser,
  }
})

