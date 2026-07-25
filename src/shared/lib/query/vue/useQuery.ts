import { computed, shallowRef, onScopeDispose, type MaybeRefOrGetter, watch, toValue } from 'vue'
import { hashQueryKey, type QueryKey, type QueryState } from '../core'
import { useQueryClient } from './useQueryClient'
import type { QueryFunction } from '../core/query.type'

type UseQueryOptions<TData> = {
  queryKey: MaybeRefOrGetter<QueryKey>
  queryFn: QueryFunction<TData>
  enable?: MaybeRefOrGetter<boolean>
}
export function useQuery<TData, TError = Error>({ queryKey, queryFn, enable = true }: UseQueryOptions<TData>) {
  const queryClient = useQueryClient()
  const cache = queryClient.getQueryCache()

  const keyValue = computed(() => toValue(queryKey))
  const hashedKey = computed(() => hashQueryKey(keyValue.value))

  const state = shallowRef<QueryState<TData, TError> | undefined>(
    queryClient.getQueryState<TData, TError>(keyValue.value),
  )

  let unsubscribe: (() => void) | undefined

  function subscribe() {
    unsubscribe?.()
    unsubscribe = cache.subscribe((key) => {
      if (key === hashedKey.value) {
        state.value = queryClient.getQueryState<TData, TError>(keyValue.value)
      }
    })
  }
  subscribe()
  onScopeDispose(() => unsubscribe?.())

  const data = computed(() => state.value?.data ?? null)
  const error = computed(() => state.value?.error ?? null)
  const status = computed(() => state.value?.status ?? 'idle')
  const isPending = computed(() => status.value === 'pending')
  const isSuccess = computed(() => status.value === 'success')
  const isError = computed(() => status.value === 'error')

  async function query() {
    if (!toValue(enable)) return
    await queryClient.fetchQuery({
      queryFn,
      queryKey: keyValue.value,
    })
  }

  watch(keyValue, () => {
    state.value = queryClient.getQueryState<TData, TError>(keyValue.value)
    subscribe()
    query().catch(console.error)
  })

  watch(
    () => toValue(enable),
    (isEnabled) => {
      if (isEnabled) {
        query().catch(console.error)
      }
    },
    { immediate: true },
  )

  return { data, error, status, isPending, isSuccess, isError, query }
}
