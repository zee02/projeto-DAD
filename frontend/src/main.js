import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { io } from 'socket.io-client'
import axios from 'axios'

import App from './App.vue'
import router from './router'

// Read Vite env variables. Prefer a full base URL if provided.
const viteApiBase = import.meta.env.VITE_API_BASE_URL
const viteApiDomain = import.meta.env.VITE_API_DOMAIN
const viteWsConnection = import.meta.env.VITE_WS_CONNECTION

// Determine server base URL. Priority:
// 1. VITE_API_BASE_URL (full URL)
// 2. VITE_API_DOMAIN (host or origin-like string)
// 3. window.location.origin (use current origin when env not set)
let serverBaseURL = undefined
if (viteApiBase) {
  serverBaseURL = viteApiBase.replace(/\/$/, '')
} else if (viteApiDomain) {
  serverBaseURL = (viteApiDomain.startsWith('http://') || viteApiDomain.startsWith('https://'))
    ? viteApiDomain.replace(/\/$/, '')
    : `http://${viteApiDomain}`
} else {
  console.warn('[main.js] VITE_API_DOMAIN not set; using window.location.origin')
  serverBaseURL = window.location.origin.replace(/\/$/, '')
}

// API base is serverBaseURL + '/api' (avoid double slashes)
const apiBaseURL = serverBaseURL.endsWith('/api') ? serverBaseURL : `${serverBaseURL}/api`

// Determine WS connection string: use VITE_WS_CONNECTION when provided,
// otherwise derive from current origin using ws/wss.
let wsConnection = viteWsConnection
if (!wsConnection) {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  wsConnection = `${scheme}://${window.location.host}`
  console.warn('[main.js] VITE_WS_CONNECTION not set; derived from window.location')
}

console.log('[main.js] serverBaseURL', serverBaseURL)
console.log('[main.js] apiBaseURL', apiBaseURL)
console.log('[main.js] ws connection', wsConnection)

const app = createApp(App)

// Setup axios interceptor to include token from localStorage
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Ensure axios uses the configured API base URL by default
axios.defaults.baseURL = apiBaseURL

app.provide('socket', io(wsConnection))
app.provide('serverBaseURL', serverBaseURL)
app.provide('apiBaseURL', apiBaseURL)

app.use(createPinia())
app.use(router)

app.mount('#app')
