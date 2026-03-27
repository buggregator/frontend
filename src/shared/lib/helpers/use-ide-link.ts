import { storeToRefs } from 'pinia'
import type { IDE_KEYS } from '../../constants'
import { useSettingsStore } from '../../stores'
import { pathToIDEFilePath } from './pathToIDEFilePath'

export function useIdeLink() {
  const { codeEditor } = storeToRefs(useSettingsStore())

  const buildLink = (file: string, line?: number): string | null => {
    if (!file || file === 'unknown') return null
    try {
      return pathToIDEFilePath(codeEditor.value as IDE_KEYS, file, line)
    } catch {
      return null
    }
  }

  return { buildLink, codeEditor }
}
