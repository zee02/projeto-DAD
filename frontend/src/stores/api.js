import { defineStore } from 'pinia'
import axios from 'axios'
import { inject, ref } from 'vue'

export const useAPIStore = defineStore('api', () => {
  const API_BASE_URL = inject('apiBaseURL')

  const token = ref()
  const gameQueryParameters = ref({
    page: 1,
    filters: {
      type: '',
      status: '',
      sort_by: 'began_at',
      sort_direction: 'desc',
    },
  })

  // AUTH
  const postRegister = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, credentials)
    return response.data
  }
  
  const postLogin = async (credentials) => {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)
    token.value = response.data.token
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    return response.data
  }
  
  const postLogout = async () => {
    await axios.post(`${API_BASE_URL}/auth/logout`)
    token.value = undefined
    delete axios.defaults.headers.common['Authorization']
  }

  // Users
  const getAuthUser = () => {
    return axios.get(`${API_BASE_URL}/users/me`)
  }

  const putUpdateProfile = async (profileData) => {
    const response = await axios.put(`${API_BASE_URL}/user/profile`, profileData)
    return response.data
  }

  const postChangePassword = async (passwordData) => {
    const response = await axios.post(`${API_BASE_URL}/user/change-password`, passwordData)
    return response.data
  }

  const deleteAccount = async (password) => {
    const data = password ? { password } : {}
    const response = await axios.delete(`${API_BASE_URL}/user/account`, {
      data
    })
    return response.data
  }

  const postUploadAvatar = async (file) => {
    const formData = new FormData()
    formData.append('photo', file)
    const response = await axios.post(`${API_BASE_URL}/user/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  // Coin Shop
  const postBuyCoin = async (purchaseData) => {
    const response = await axios.post(`${API_BASE_URL}/coin-purchase/buy`, purchaseData)
    return response.data
  }

  const getCoinPurchaseHistory = async () => {
    const response = await axios.get(`${API_BASE_URL}/coin-purchase/history`)
    return response.data
  }

  //Games
  const getGames = (resetPagination = false) => {
    if (resetPagination) {
      gameQueryParameters.value.page = 1
    }

    const queryParams = new URLSearchParams({
      page: gameQueryParameters.value.page,
      ...(gameQueryParameters.value.filters.type && {
        type: gameQueryParameters.value.filters.type,
      }),
      ...(gameQueryParameters.value.filters.status && {
        status: gameQueryParameters.value.filters.status,
      }),
      sort_by: gameQueryParameters.value.filters.sort_by,
      sort_direction: gameQueryParameters.value.filters.sort_direction,
    }).toString()
    return axios.get(`${API_BASE_URL}/games?${queryParams}`)
  }

  // Admin
  const getAdminUsers = (page = 1, per_page = 25) => {
    return axios.get(`${API_BASE_URL}/admin/users`, { params: { page, per_page } })
  }

  const patchUserBlock = (id, blocked) => {
    return axios.patch(`${API_BASE_URL}/admin/users/${id}/block`, { blocked })
  }

  const putUpdateUser = (id, payload) => {
    return axios.put(`${API_BASE_URL}/admin/users/${id}`, payload)
  }

  const deleteUser = (id) => {
    return axios.delete(`${API_BASE_URL}/admin/users/${id}`)
  }

  const postCreateAdmin = (payload) => {
    return axios.post(`${API_BASE_URL}/admin/admins`, payload)
  }

  const getAdminTransactions = (page = 1, per_page = 25) => {
    return axios.get(`${API_BASE_URL}/admin/transactions`, { params: { page, per_page } })
  }

  const getAdminUser = (id) => {
    return axios.get(`${API_BASE_URL}/admin/users/${id}`)
  }

  const postUploadUserAvatar = (id, file) => {
    const formData = new FormData()
    formData.append('photo', file)
    return axios.post(`${API_BASE_URL}/admin/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  // Leaderboards & Stats (public)
  const getLeaderboards = (type = 'wins', page = 1, per_page = 25) => {
    return axios.get(`${API_BASE_URL}/leaderboards/${type}`, { params: { page, per_page } })
  }

  const getOverviewStats = () => {
    return axios.get(`${API_BASE_URL}/stats/overview`)
  }

  const getAnonymousStats = (days = 30) => {
    return axios.get(`${API_BASE_URL}/stats/anonymous`, { params: { days } })
  }

  // Admin analytics
  const getAdminSalesOverTime = (days = 30) => {
    return axios.get(`${API_BASE_URL}/admin/analytics/sales`, { params: { days } })
  }

  const getAdminGamesOverTime = (days = 30) => {
    return axios.get(`${API_BASE_URL}/admin/analytics/games`, { params: { days } })
  }

  return {
    postRegister,
    postLogin,
    postLogout,
    getAuthUser,
    putUpdateProfile,
    postChangePassword,
    deleteAccount,
    postUploadAvatar,
    postBuyCoin,
    getCoinPurchaseHistory,
    getGames,
    gameQueryParameters,
    // Admin exports
    getAdminUsers,
    patchUserBlock,
    postCreateAdmin,
    getAdminTransactions,
    putUpdateUser,
    deleteUser,
    getAdminUser,
    postUploadUserAvatar,
    // Leaderboards & stats
    getLeaderboards,
    getOverviewStats,
    getAnonymousStats,
    // Admin analytics
    getAdminSalesOverTime,
    getAdminGamesOverTime,
  }
})
