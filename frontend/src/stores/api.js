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
    const response = await axios.delete(`${API_BASE_URL}/user/account`, {
      data: { password }
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

  return {
    postRegister,
    postLogin,
    postLogout,
    getAuthUser,
    putUpdateProfile,
    postChangePassword,
    deleteAccount,
    postUploadAvatar,
    getGames,
    gameQueryParameters,
  }
})
