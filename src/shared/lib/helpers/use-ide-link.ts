import { storeToRefs } from 'pinia'
import type { IDE_KEYS } from '../../constants'
import { useSettingsStore } from '../../stores'
import { pathToIDEFilePath } from './pathToIDEFilePath'

export function useIdeLink() {
  const { codeEditor, customFilePathMapping } = storeToRefs(useSettingsStore())

  const buildLink = (file: string, line?: number): string | null => {
    if (!file || file === 'unknown') return null
    try {
      if (customFilePathMapping.value.length) {
        const mapping = customFilePathMapping.value.find(({ source_path }) => file.startsWith(source_path))
        if (mapping) {
          const mappedFile = file.replace(mapping.source_path, mapping.target_path)
          return pathToIDEFilePath(codeEditor.value as IDE_KEYS, mappedFile, line)
        }
      }

      return pathToIDEFilePath(codeEditor.value as IDE_KEYS, file, line)
    } catch {
      return null
    }
  }

  return { buildLink, codeEditor }
}
