import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/groups/:id/expenses/new',
    name: 'ExpenseCreate',
    component: () => import('./views/ExpenseCreateView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups/:id/expenses/:expenseId',
    name: 'ExpenseDetail',
    component: () => import('./views/ExpenseDetailView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups/:id/expenses/:expenseId/edit',
    name: 'ExpenseEdit',
    component: () => import('./views/ExpenseEditView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/groups/:id/debts/:debtId',
    name: 'DebtDetail',
    component: () => import('./views/DebtDetailView.vue'),
    meta: { requiresAuth: true },
  },
]

export default routes
