import { ref, shallowRef } from 'vue'
import type { CodeFolderList, CodeRootStatus } from '../types'
import { CodeGraphApiError, useCodeGraphRequests } from './use-code-graph-requests'

// The folder browser of «Add folder» (#6586): one level at a time below the
// server's base dir; adding a folder makes it a root and starts indexing.

export type Crumb = { name: string; path: string }

// The way from the base dir down to `path` («a/b» → base, a, a/b).
export const crumbs = (path: string, baseName = 'base'): Crumb[] => {
  const parts = path.split('/').filter(Boolean)
  return [{ name: baseName, path: '' }, ...parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))]
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e))

export const useFolderBrowser = () => {
  const api = useCodeGraphRequests()
  const list = shallowRef<CodeFolderList | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const adding = ref(false)
  const addError = ref<string | null>(null)

  let seq = 0
  const open = async (path = '') => {
    const mine = ++seq
    loading.value = true
    error.value = null
    try {
      const l = await api.getFolders(path)
      if (mine === seq) list.value = l
    } catch (e) {
      if (mine === seq) error.value = message(e)
    } finally {
      if (mine === seq) loading.value = false
    }
  }

  const add = async (path: string, name?: string): Promise<CodeRootStatus | null> => {
    adding.value = true
    addError.value = null
    try {
      return await api.addRoot(path, name?.trim() || undefined)
    } catch (e) {
      addError.value = e instanceof CodeGraphApiError ? e.message : message(e)
      return null
    } finally {
      adding.value = false
    }
  }

  return { list, loading, error, adding, addError, open, add }
}
