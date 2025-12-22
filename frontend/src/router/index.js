// Eager load only the home page for instant initial render
import HomePage from '@/pages/home/HomePage.vue'
import { createRouter, createWebHistory } from 'vue-router'

// Lazy load all other pages to reduce initial bundle size
const LoginPage = () => import('@/pages/LoginPage.vue')
const RegisterPage = () => import('@/pages/RegisterPage.vue')
const ProfilePage = () => import('@/pages/ProfilePage.vue')
const CoinShopPage = () => import('@/pages/CoinShopPage.vue')
const AdminDashboard = () => import('@/pages/admin/AdminDashboard.vue')
const AdminUsers = () => import('@/pages/admin/UsersAdmin.vue')
const AdminCreate = () => import('@/pages/admin/CreateAdmin.vue')
const AdminTransactions = () => import('@/pages/admin/TransactionsAdmin.vue')
const AdminGames = () => import('@/pages/admin/GamesAdmin.vue')
const Leaderboards = () => import('@/pages/stats/Leaderboards.vue')
const AnonymousStats = () => import('@/pages/stats/AnonymousStats.vue')
const AdminStats = () => import('@/pages/admin/AdminStats.vue')
const HistoryPage = () => import('@/pages/HistoryPage.vue')
const TransactionsPage = () => import('@/pages/TransactionsPage.vue')
const BlockedUserPage = () => import('@/pages/BlockedUserPage.vue')

// Navigation guard to protect admin routes using client-side check
// (server-side middleware also enforces authorization). We rely on localStorage
// because the Pinia store may not be initialized at router creation time.
const isUserAdmin = () => {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null')
    return user && user.type === 'A'
  } catch (e) {
    return false
  }
}

const isUserLoggedIn = () => {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null')
    return !!user
  } catch (e) {
    return false
  }
}

const isUserBlocked = () => {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || 'null')
    return user && user.blocked === true
  } catch (e) {
    return false
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/login',
      component: LoginPage,
    },
    {
      path: '/register',
      component: RegisterPage,
    },
    {
      path: '/profile',
      component: ProfilePage,
    },
    {
      path: '/coin-shop',
      component: CoinShopPage,
      meta: { requiresPlayer: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboard,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/users',
      component: AdminUsers,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/users/:id',
      name: 'admin-user',
      component: () => import('@/pages/admin/UserEditor.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/create',
      component: AdminCreate,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/transactions',
      component: AdminTransactions,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/games',
      component: AdminGames,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/analytics',
      component: AdminStats,
      meta: { requiresAdmin: true },
    },
    {
      path: '/leaderboards',
      component: Leaderboards,
    },
    {
      path: '/transactions',
      component: TransactionsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/stats',
      component: AnonymousStats,
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryPage,
      meta: { requiresAuth: true }
    },
    {
      path: '/game-replay/:id',
      name: 'game-replay',
      component: () => import('@/pages/GameReplayPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/singleplayer',
      name: 'singleplayer',
      component: () => import('@/pages/game/SinglePlayerGame.vue')
    },
    {
      path: '/multiplayer/lobby',
      name: 'multiplayer-lobby',
      component: () => import('@/pages/game/MultiplayerLobby.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/multiplayer/game/:gameId',
      name: 'multiplayer-game',
      component: () => import('@/pages/game/MultiplayerGame.vue'),
      meta: { requiresAuth: true }
    },

    {
      path: '/blocked',
      name: 'blocked',
      component: BlockedUserPage,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ],
})

// Global guard: block access to admin routes if not admin, and block admins from player-only routes
router.beforeEach((to, from, next) => {
  // Prevent logged-in users from accessing login and register pages
  if (isUserLoggedIn() && (to.path === '/login' || to.path === '/register')) {
    return next('/')
  }

  // Allow blocked users to access only the blocked page and login page
  if (isUserBlocked() && to.path !== '/blocked' && to.path !== '/login') {
    return next('/blocked')
  }

  // Don't allow access to blocked page if user is not blocked
  if (to.path === '/blocked' && !isUserBlocked()) {
    return next('/')
  }

  if (to.meta?.requiresAdmin) {
    if (!isUserAdmin()) {
      return next('/')
    }
  }

  if (to.meta?.requiresPlayer) {
    if (isUserAdmin()) {
      return next('/')
    }
  }

  if (to.meta?.requiresAuth) {
    if (!isUserLoggedIn()) {
      return next('/login')
    }
  }

  return next()
})

export default router
