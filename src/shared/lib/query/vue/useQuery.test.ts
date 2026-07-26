// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { QueryClient } from '../core'
import { deferred } from '@/shared/utils/promise.util'
import { provideQueryClient } from './useQueryClient'
import { useQuery, type UseQueryOptions } from './useQuery'

// Mounts useQuery inside a child whose ancestor provides the client, so
// inject() and onScopeDispose() run in a real component context.
function mountQuery<TData>(client: QueryClient, options: UseQueryOptions<TData>) {
  let api!: ReturnType<typeof useQuery<TData>>
  const Child = defineComponent({
    setup() {
      api = useQuery<TData>(options)
      return () => h('div')
    },
  })
  const wrapper = mount(
    defineComponent({
      setup() {
        provideQueryClient(client)
        return () => h(Child)
      },
    }),
  )
  return { api, wrapper }
}

describe('useQuery', () => {
  it('is idle with no data when disabled and nothing is cached for the key', () => {
    const client = new QueryClient()
    // enable: false — a default-enabled query auto-fetches on mount (see below),
    // which would immediately flip status to 'pending' and defeat this assertion.
    const { api } = mountQuery(client, {
      queryKey: ['none'],
      queryFn: () => Promise.resolve('x'),
      enable: false,
    })

    expect(api.status.value).toBe('idle')
    expect(api.data.value).toBeNull()
    expect(api.error.value).toBeNull()
    expect(api.isPending.value).toBe(false)
  })

  it('automatically fetches on mount when enabled (the default) and nothing is cached', async () => {
    const client = new QueryClient()
    const { api } = mountQuery(client, {
      queryKey: ['auto'],
      queryFn: () => Promise.resolve('x'),
    })

    // The initial `enable` watcher fires synchronously during setup.
    expect(api.status.value).toBe('pending')

    await vi.waitFor(() => expect(api.status.value).toBe('success'))
    expect(api.data.value).toBe('x')
  })

  it('initializes from already-cached state', async () => {
    const client = new QueryClient()
    await client.fetchQuery({ queryKey: ['pre'], queryFn: () => Promise.resolve('cached') })

    const { api } = mountQuery(client, {
      queryKey: ['pre'],
      queryFn: () => Promise.resolve('cached'),
    })

    expect(api.status.value).toBe('success')
    expect(api.data.value).toBe('cached')
    expect(api.isSuccess.value).toBe(true)
  })

  it('reflects the pending state while the query is in flight', async () => {
    const client = new QueryClient()
    const d = deferred<string>()
    const { api } = mountQuery(client, { queryKey: ['k'], queryFn: () => d.promise })

    const pending = api.query()
    expect(api.status.value).toBe('pending')
    expect(api.isPending.value).toBe(true)

    d.resolve('value')
    await pending

    expect(api.status.value).toBe('success')
    expect(api.data.value).toBe('value')
    expect(api.isPending.value).toBe(false)
  })

  it('transitions to the error state when the query fails', async () => {
    const client = new QueryClient()
    const error = new Error('boom')
    const { api } = mountQuery(client, {
      queryKey: ['bad'],
      queryFn: () => Promise.reject(error),
    })

    await expect(api.query()).rejects.toBe(error)

    expect(api.status.value).toBe('error')
    expect(api.error.value).toBe(error)
    expect(api.isError.value).toBe(true)
  })

  it('updates reactively when another consumer of the same key fetches', async () => {
    const client = new QueryClient()
    const queryFn = vi.fn().mockResolvedValue('shared')
    const a = mountQuery(client, { queryKey: ['s'], queryFn })
    // enable: false — b must never fetch on its own (auto or manual); it should
    // only ever observe the cache through its subscription.
    const b = mountQuery(client, { queryKey: ['s'], queryFn, enable: false })

    await vi.waitFor(() => expect(a.api.isSuccess.value).toBe(true))

    // b never fetched, but sees a's auto-fetch result through its subscription
    expect(b.api.data.value).toBe('shared')
    expect(b.api.isSuccess.value).toBe(true)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('resets to idle when its key is invalidated', async () => {
    const client = new QueryClient()
    const { api } = mountQuery(client, {
      queryKey: ['k'],
      queryFn: () => Promise.resolve('value'),
    })
    await api.query()
    expect(api.data.value).toBe('value')

    client.invalidateQuery(['k'])

    expect(api.status.value).toBe('idle')
    expect(api.data.value).toBeNull()
  })

  it('unsubscribes from the cache when the component is unmounted', async () => {
    const client = new QueryClient()
    const cache = client.getQueryCache()
    const { wrapper } = mountQuery(client, {
      queryKey: ['k'],
      queryFn: () => Promise.resolve('value'),
    })

    expect(cache.hasListeners()).toBe(true)

    wrapper.unmount()

    expect(cache.hasListeners()).toBe(false)
  })
})
