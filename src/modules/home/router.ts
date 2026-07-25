import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'Home',
    component: () => import('./views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
]

export default routes
