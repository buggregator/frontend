import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useSettingsStore } from '@/shared/stores'
import KeyboardShortcutsOverlay from './keyboard-shortcuts-overlay.vue'

export default {
  title: 'Widgets/KeyboardShortcutsOverlay',
  component: KeyboardShortcutsOverlay,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof KeyboardShortcutsOverlay>

export const Default: StoryObj<typeof KeyboardShortcutsOverlay> = {
  render: () => ({
    components: { KeyboardShortcutsOverlay },
    setup() {
      const store = useSettingsStore()
      store.isSingleKeyShortcutsEnabled = true
    },
    template: '<KeyboardShortcutsOverlay />',
  }),
}

// Single-key shortcuts off: those rows are dimmed and the note says why.
export const SingleKeyOff: StoryObj<typeof KeyboardShortcutsOverlay> = {
  render: () => ({
    components: { KeyboardShortcutsOverlay },
    setup() {
      const store = useSettingsStore()
      store.isSingleKeyShortcutsEnabled = false
    },
    template: '<KeyboardShortcutsOverlay />',
  }),
}
