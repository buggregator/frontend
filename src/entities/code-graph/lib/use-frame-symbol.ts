import { ref, watchEffect, type MaybeRefOrGetter, toValue } from 'vue'
import type { CodeSymbol } from '../types'
import { useCodeGraphEnabled } from './use-code-graph-enabled'
import { isCodeNotFound, useCodeGraphRequests } from './use-code-graph-requests'

// Why a frame has no way into the graph, said as text next to it (#6573):
// a vendor file is not indexed, a line outside any function has no symbol.
export type FrameSymbolState =
  | { state: 'off' }
  | { state: 'loading' }
  | { state: 'found'; symbol: CodeSymbol }
  | { state: 'vendor' }
  | { state: 'no-symbol'; line: number }
  | { state: 'unknown' }

const cache = new Map<string, Promise<CodeSymbol | null>>()

export const isVendorPath = (file: string) => /(^|[\\/])(vendor|node_modules)[\\/]/.test(file)

export const frameSymbolReason = (s: FrameSymbolState): string | null => {
  if (s.state === 'vendor') return 'vendor · not in the code graph'
  if (s.state === 'no-symbol') return `no symbol on line ${s.line}`
  return null
}

// Resolves a frame (file + line) to the innermost symbol, once per file:line
// per page load. Off when the server has no code graph.
export const useFrameSymbol = (file: MaybeRefOrGetter<string | null | undefined>, line: MaybeRefOrGetter<number | null | undefined>) => {
  const enabled = useCodeGraphEnabled()
  const result = ref<FrameSymbolState>({ state: 'off' })

  watchEffect(() => {
    const f = toValue(file)
    const l = toValue(line)
    if (!enabled.value || !f || !l) {
      result.value = { state: 'off' }
      return
    }
    if (isVendorPath(f)) {
      result.value = { state: 'vendor' }
      return
    }
    const key = `${f}:${l}`
    if (!cache.has(key)) {
      cache.set(
        key,
        useCodeGraphRequests()
          .resolve(f, l)
          .catch((e) => {
            if (isCodeNotFound(e)) return null
            cache.delete(key)
            throw e
          })
      )
    }
    result.value = { state: 'loading' }
    cache
      .get(key)!
      .then((symbol) => {
        if (toValue(file) !== f || toValue(line) !== l) return
        result.value = symbol ? { state: 'found', symbol } : { state: 'no-symbol', line: l }
      })
      .catch(() => {
        result.value = { state: 'unknown' }
      })
  })

  return result
}
