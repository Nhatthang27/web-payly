import { supabase } from '@/shared/lib/supabase'
import { uploadFile } from '@/shared/lib/file-storage/supabase-file-storage.service'
import { buildExpenseEvidencePath } from '@/shared/lib/file-storage/file-path-builder'
import type { QueryData } from '@supabase/supabase-js'
import type { Json } from '@/shared/lib/database.types'
import type { SplitConfig, SplitMethod } from '@/modules/expense/types/expense-split.type'
import type { OwedDebt, PaidExpense, SettlementStatus } from '@/modules/expense/types/expense.type'

/** One participant's portion of an expense (app-side, camelCase). */
export interface ExpenseSplitInput {
  userId: string
  shareAmount: number
}

export interface CreateExpenseRequest {
  groupId: string
  title: string
  /** Total expense amount; must equal the sum of the split shares. */
  amount: number
  /** User id of the payer (who fronted the money). */
  paidBy: string
  /** How the total was divided. */
  splitMethod: SplitMethod
  /** Method-specific config (percentages / custom amounts) persisted for later edits. */
  splitConfig: SplitConfig
  splits: ExpenseSplitInput[]
}

export interface UpdateExpenseRequest {
  expenseId: string
  groupId: string
  title: string
  /** Total expense amount; must equal the sum of the split shares. */
  amount: number
  /** User id of the payer (who fronted the money). */
  paidBy: string
  /** How the total was divided. */
  splitMethod: SplitMethod
  /** Method-specific config (percentages / custom amounts) persisted for later edits. */
  splitConfig: SplitConfig
  splits: ExpenseSplitInput[]
}

/** Full editable state of an expense — unlike `PaidExpense`, keeps the payer's own split and the raw split config. */
export interface ExpenseEditData {
  id: string
  title: string
  amount: number
  paidBy: string
  splitMethod: SplitMethod
  splitConfig: SplitConfig
  splits: ExpenseSplitInput[]
}

/** A split is settled once it points at a settlement; otherwise it's still owed. */
function shareStatus(settlementId: string | null): SettlementStatus {
  return settlementId ? 'paid' : 'pending'
}

// Shared `select` shapes so the list and detail queries return identical row types.
const PAID_EXPENSE_SELECT = `id, title, amount, created_at, paid_by,
   expense_splits ( user_id, share_amount, settlement_id, users ( id, full_name, avatar_url ) )` as const
const OWED_DEBT_SELECT = `id, share_amount, settlement_id,
   expenses!inner ( id, title, created_at, paid_by, group_id, payer:users!expenses_paid_by_fkey ( id, full_name, avatar_url ) )` as const

/** Expenses the current user paid up front ("Khoản chi"), with each debtor's share embedded. */
function paidExpensesQuery(groupId: string, userId: string) {
  return supabase
    .from('expenses')
    .select(PAID_EXPENSE_SELECT)
    .eq('group_id', groupId)
    .eq('paid_by', userId)
    .order('created_at', { ascending: false })
}
type PaidExpenseRow = QueryData<ReturnType<typeof paidExpensesQuery>>[number]

/** A single expense the current user paid, by id. */
function paidExpenseDetailQuery(expenseId: string, userId: string) {
  return supabase.from('expenses').select(PAID_EXPENSE_SELECT).eq('id', expenseId).eq('paid_by', userId).maybeSingle()
}

const EXPENSE_EDIT_SELECT = `id, title, amount, paid_by, split_method, split_config,
   expense_splits ( user_id, share_amount )` as const

/** The full editable state of one of the current user's paid expenses, by id. */
function expenseEditDataQuery(expenseId: string, userId: string) {
  return supabase.from('expenses').select(EXPENSE_EDIT_SELECT).eq('id', expenseId).eq('paid_by', userId).maybeSingle()
}
type ExpenseEditRow = QueryData<ReturnType<typeof expenseEditDataQuery>>[number]

/** The current user's shares of expenses someone else paid ("Khoản nợ"), with the payer embedded. */
function owedDebtsQuery(groupId: string, userId: string) {
  return supabase
    .from('expense_splits')
    .select(OWED_DEBT_SELECT)
    .eq('user_id', userId)
    .eq('expenses.group_id', groupId)
    .neq('expenses.paid_by', userId)
}
type OwedDebtRow = QueryData<ReturnType<typeof owedDebtsQuery>>[number]

/** The current user's share of a single expense someone else paid, by expense id. */
function owedDebtDetailQuery(expenseId: string, userId: string) {
  return supabase
    .from('expense_splits')
    .select(OWED_DEBT_SELECT)
    .eq('expense_id', expenseId)
    .eq('user_id', userId)
    .maybeSingle()
}

/** Maps a raw paid-expense row to the `PaidExpense` domain model, excluding the payer's own share. */
function mapPaidExpense(row: PaidExpenseRow): PaidExpense {
  const debtors = row.expense_splits
    .filter((split) => split.user_id !== row.paid_by)
    .map((split) => ({
      participant: {
        id: split.user_id,
        name: split.users?.full_name ?? '',
        avatarUrl: split.users?.avatar_url ?? null,
      },
      amount: split.share_amount,
      status: shareStatus(split.settlement_id),
    }))

  return {
    kind: 'expense',
    id: row.id,
    title: row.title,
    paidAt: row.created_at ?? '',
    totalAmount: row.amount,
    amountOwedToMe: debtors.reduce((sum, d) => (d.status === 'paid' ? sum : sum + d.amount), 0),
    debtors,
  }
}

/** Maps a raw expense row to the `ExpenseEditData` domain model, keeping every split (including the payer's own). */
function mapExpenseEditData(row: ExpenseEditRow): ExpenseEditData {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    paidBy: row.paid_by,
    splitMethod: row.split_method,
    splitConfig: row.split_config as unknown as SplitConfig,
    splits: row.expense_splits.map((split) => ({ userId: split.user_id, shareAmount: split.share_amount })),
  }
}

/** Maps a raw owed-debt row to the `OwedDebt` domain model. */
function mapOwedDebt(row: OwedDebtRow): OwedDebt {
  const expense = row.expenses
  return {
    kind: 'debt',
    id: expense.id,
    splitId: row.id,
    title: expense.title,
    paidAt: expense.created_at ?? '',
    paidBy: {
      id: expense.payer?.id ?? expense.paid_by,
      name: expense.payer?.full_name ?? '',
      avatarUrl: expense.payer?.avatar_url ?? null,
    },
    amountIOwe: row.share_amount,
    status: shareStatus(row.settlement_id),
  }
}

export const expenseApi = {
  /** Fetches the current user's "Khoản chi" — expenses they paid for in a group. */
  async fetchPaidExpenses(groupId: string, userId: string): Promise<PaidExpense[]> {
    const { data, error } = await paidExpensesQuery(groupId, userId)
    if (error) throw error
    return data.map(mapPaidExpense)
  },

  /** Fetches the current user's "Khoản nợ" — their shares of expenses others paid in a group. */
  async fetchOwedDebts(groupId: string, userId: string): Promise<OwedDebt[]> {
    const { data, error } = await owedDebtsQuery(groupId, userId)
    if (error) throw error
    // Sort newest-first client-side: PostgREST can't order the outer rows by a foreign-table column.
    return data.map(mapOwedDebt).sort((a, b) => b.paidAt.localeCompare(a.paidAt))
  },

  /** Fetches one of the current user's paid expenses by id, or null if it isn't theirs. */
  async fetchExpenseDetail(expenseId: string, userId: string): Promise<PaidExpense | null> {
    const { data, error } = await paidExpenseDetailQuery(expenseId, userId)
    if (error) throw error
    return data ? mapPaidExpense(data) : null
  },

  /** Fetches the current user's debt for a single expense by id, or null if they owe nothing on it. */
  async fetchDebtDetail(expenseId: string, userId: string): Promise<OwedDebt | null> {
    const { data, error } = await owedDebtDetailQuery(expenseId, userId)
    if (error) throw error
    return data ? mapOwedDebt(data) : null
  },

  /** Fetches the full editable state of one of the current user's paid expenses, or null if it isn't theirs. */
  async fetchExpenseEditData(expenseId: string, userId: string): Promise<ExpenseEditData | null> {
    const { data, error } = await expenseEditDataQuery(expenseId, userId)
    if (error) throw error
    return data ? mapExpenseEditData(data) : null
  },

  /**
   * Creates an expense and its splits atomically via the
   * `create_expense_with_splits` Postgres function.
   * @returns the new expense's id.
   */
  async createExpenseWithSplits(payload: CreateExpenseRequest): Promise<string> {
    // Convert the app's camelCase splits to the snake_case jsonb the RPC expects:
    // `(user_id uuid, share_amount numeric)[]`.
    const expenseSplits = payload.splits.map((s) => ({ user_id: s.userId, share_amount: s.shareAmount }))

    const { data, error } = await supabase.rpc('create_expense_with_splits', {
      p_group_id: payload.groupId,
      p_title: payload.title,
      p_amount: payload.amount,
      p_paid_by: payload.paidBy,
      p_split_method: payload.splitMethod,
      p_split_config: payload.splitConfig as unknown as Json,
      p_expense_splits: expenseSplits as unknown as Json,
    })
    if (error) throw error
    return data
  },

  /**
   * Updates an expense and replaces its splits atomically via the
   * `update_expense_with_splits` Postgres function, which deletes all of the
   * expense's existing splits and recreates them from the new breakdown
   * rather than diffing individual rows.
   * @returns the expense's id.
   */
  async updateExpenseWithSplits(payload: UpdateExpenseRequest): Promise<string> {
    const expenseSplits = payload.splits.map((s) => ({ user_id: s.userId, share_amount: s.shareAmount }))

    const { data, error } = await supabase.rpc('update_expense_with_splits', {
      p_expense_id: payload.expenseId,
      p_title: payload.title,
      p_amount: payload.amount,
      p_paid_by: payload.paidBy,
      p_split_method: payload.splitMethod,
      p_split_config: payload.splitConfig as unknown as Json,
      p_expense_splits: expenseSplits as unknown as Json,
    })
    if (error) throw error
    return data
  },

  /**
   * Uploads a receipt/evidence image for an expense being created, grouped under
   * the uploading user's own folder since the expense itself doesn't exist yet.
   * @returns the storage path (private-bucket, not a URL).
   */
  async uploadExpenseEvidence(userId: string, file: File): Promise<string> {
    const { path } = await uploadFile(file, buildExpenseEvidencePath(userId, file), 'expenseEvidence')
    return path
  },
}
