import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useSettingsStore } from '../../stores'

// When to show key hints. Hints under inputs follow «Show key hints» alone
// (Enter and Esc in a field always work); the hint bar lists single-key
// shortcuts, so it hides while those are off.
export function useKeyHints() {
  const { isKeyHintsEnabled, isSingleKeyShortcutsEnabled } = storeToRefs(useSettingsStore())

  return {
    showInputHints: computed(() => isKeyHintsEnabled.value),
    showHintBar: computed(() => isKeyHintsEnabled.value && isSingleKeyShortcutsEnabled.value),
  }
}
