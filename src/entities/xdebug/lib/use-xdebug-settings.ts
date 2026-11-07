import { computed, ref, type Ref } from 'vue'
import type { XdebugConfig, XdebugMode, XdebugSettings } from '../types'
import type { XdebugRequests } from './use-xdebug-requests'

type Draft = { mode: XdebugMode; pause_on_first_line: boolean }

// The settings dialog: a draft of mode and «pause on the first line», saved
// with PUT /api/xdebug/settings. Only changed fields are sent; they apply to
// new sessions only.
export const useXdebugSettings = (
  api: Pick<XdebugRequests, 'putSettings'>,
  config: Ref<XdebugConfig | null>,
  onSaved: (settings: XdebugSettings) => void
) => {
  const current = (): Draft => ({
    mode: config.value?.mode ?? 'auto',
    pause_on_first_line: !!config.value?.pause_on_first_line
  })

  const draft = ref<Draft>(current())
  const saving = ref(false)
  const error = ref('')

  const changes = computed(() => {
    const now = current()
    const out: Partial<Draft> = {}
    if (draft.value.mode !== now.mode) out.mode = draft.value.mode
    if (draft.value.pause_on_first_line !== now.pause_on_first_line) out.pause_on_first_line = draft.value.pause_on_first_line
    return out
  })
  const dirty = computed(() => Object.keys(changes.value).length > 0)

  const open = () => {
    draft.value = current()
    error.value = ''
  }

  // true when the dialog may close.
  const save = async () => {
    if (!dirty.value) return true
    saving.value = true
    error.value = ''
    try {
      onSaved(await api.putSettings(changes.value))
      return true
    } catch (e) {
      error.value = `Could not save: ${e instanceof Error ? e.message : String(e)}`
      return false
    } finally {
      saving.value = false
    }
  }

  return { draft, saving, error, dirty, open, save }
}
