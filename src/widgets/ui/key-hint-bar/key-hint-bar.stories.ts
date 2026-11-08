import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useSettingsStore } from '@/shared/stores'
import KeyHintBar from './key-hint-bar.vue'

export default {
  title: 'Widgets/KeyHintBar',
  component: KeyHintBar,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof KeyHintBar>

const withHints = (bar: 'event-list' | 'event-page'): StoryObj<typeof KeyHintBar> => ({
  render: () => ({
    components: { KeyHintBar },
    setup() {
      const store = useSettingsStore()
      store.isKeyHintsEnabled = true
      store.isSingleKeyShortcutsEnabled = true
      return { bar }
    },
    template: '<div style="height: 160px"><KeyHintBar :bar="bar" /></div>',
  }),
})

export const EventList = withHints('event-list')
export const EventPage = withHints('event-page')
