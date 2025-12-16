import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import io from 'socket.io-client'

const WS_URL = import.meta.env.VITE_WS_CONNECTION || 'http://localhost:3000'

export const useSocketStore = defineStore('socket', () => {
  const socket = ref(null)
  const isConnected = computed(() => socket.value?.connected || false)
  const lastGameStartPayload = ref(null) // Store game:start for late listeners

  const connect = () => {
    if (socket.value?.connected) {
      console.log('[Socket] Already connected')
      return
    }

    console.log(`[Socket] Connecting to ${WS_URL}`)

    socket.value = io(WS_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    })

    socket.value.on('connect', () => {
      console.log('[Socket] Connected:', socket.value.id)
    })

    socket.value.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    socket.value.on('error', (error) => {
      console.error('[Socket] Error:', error)
    })

    socket.value.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  return {
    socket,
    isConnected,
    lastGameStartPayload,
    connect,
    disconnect,
  }
})
