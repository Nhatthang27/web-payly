import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth.store'
import authRoutes from '@/modules/auth/router'
import homeRoutes from '@/modules/home/router'
import groupRoutes from '@/modules/group/router'
import groupMemberRoutes from '@/modules/group-member/router'
import expenseRoutes from '@/modules/expense/router'
import settlementRoutes from '@/modules/settlement/router'
import userRoutes from '@/modules/user/router'
import storybookRoutes from '@/modules/storybook/router'

const routes = [
  ...authRoutes,
  ...homeRoutes,
  ...groupRoutes,
  ...groupMemberRoutes,
  ...expenseRoutes,
  ...settlementRoutes,
  ...userRoutes,
  ...storybookRoutes,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (!auth.initialized) await auth.init()

  if (to.path === '/') {
    return auth.isAuthenticated ? '/home' : '/sign-in'
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/sign-in', query: { redirect: to.fullPath } }
  }

  if (to.path === '/sign-in' && auth.isAuthenticated) {
    return '/home'
  }
})

export default router
