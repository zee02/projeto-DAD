import HomePage from '@/pages/home/HomePage.vue'
import LoginPage from '@/pages/LoginPage.vue'
import RegisterPage from '@/pages/RegisterPage.vue'
import ProfilePage from '@/pages/ProfilePage.vue'
import CoinShopPage from '@/pages/CoinShopPage.vue'
import LaravelPage from '@/pages/testing/LaravelPage.vue'
import WebsocketsPage from '@/pages/testing/WebsocketsPage.vue'
import AdminDashboard from '@/pages/admin/AdminDashboard.vue'
import AdminUsers from '@/pages/admin/UsersAdmin.vue'
import AdminCreate from '@/pages/admin/CreateAdmin.vue'
import AdminTransactions from '@/pages/admin/TransactionsAdmin.vue'
import AdminGames from '@/pages/admin/GamesAdmin.vue'
import Leaderboards from '@/pages/stats/Leaderboards.vue'
import AnonymousStats from '@/pages/stats/AnonymousStats.vue'
import AdminStats from '@/pages/admin/AdminStats.vue'
import { createRouter, createWebHistory } from 'vue-router'

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
    },
    {
      path: '/testing',
      children: [
        {
          path: 'laravel',
          component: LaravelPage,
        },
        {
          path: 'websockets',
          component: WebsocketsPage,
        },
      ],
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
      path: '/stats',
      component: AnonymousStats,
    },
  ],
})

// Global guard: block access to admin routes if not admin
router.beforeEach((to, from, next) => {
  if (to.meta?.requiresAdmin) {
    if (!isUserAdmin()) {
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
