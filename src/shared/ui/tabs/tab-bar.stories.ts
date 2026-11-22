import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Tabs from './tab-bar.vue'

const VIEWS = [
  { id: 'waterfall', label: 'Waterfall' },
  { id: 'flame', label: 'Flame graph' },
  { id: 'graph', label: 'Call graph' },
  { id: 'sequence', label: 'Sequence' },
  { id: 'errors', label: 'Related errors', count: 2 },
  { id: 'logs', label: 'Related logs', count: 14 }
]

export default {
  title: 'Shared/Tabs',
  component: Tabs,
  args: { tabs: VIEWS, label: 'Trace view' },
  render: (args) => ({
    components: { Tabs },
    setup() {
      const current = ref(args.modelValue ?? args.tabs[0].id)
      return { args, current }
    },
    template: '<Tabs v-bind="args" v-model="current" />'
  })
} as Meta<typeof Tabs>

export const Default: StoryObj<typeof Tabs> = {}

export const WithIconsAndInfo: StoryObj<typeof Tabs> = {
  args: {
    label: 'Traces view',
    tabs: [
      { id: 'list', label: 'List', icon: 'events' },
      { id: 'map', label: 'Service map', icon: 'host' }
    ]
  },
  render: (args) => ({
    components: { Tabs },
    setup() {
      const current = ref('list')
      return { args, current }
    },
    template: '<Tabs v-bind="args" v-model="current"><template #info><span>Period <b>1h</b></span></template></Tabs>'
  })
}

export const Disabled: StoryObj<typeof Tabs> = {
  args: {
    label: 'Variable scope',
    tabs: [
      { id: 'locals', label: 'Locals' },
      { id: 'globals', label: 'Superglobals', disabled: true },
      { id: 'consts', label: 'User constants' }
    ]
  }
}

export const Links: StoryObj<typeof Tabs> = {
  args: {
    as: 'link',
    label: 'Sentry',
    modelValue: 'logs',
    tabs: [
      { id: 'exceptions', label: 'Exceptions', count: 21, to: '/sentry/exceptions' },
      { id: 'traces', label: 'Traces', count: 4, to: '/sentry/traces' },
      { id: 'logs', label: 'Logs', count: 66, to: '/sentry/logs' },
      { id: 'metrics', label: 'Metrics', to: '/sentry/metrics' },
      { id: 'feedback', label: 'Feedback', to: '/sentry/feedback' },
      { id: 'crons', label: 'Crons', count: 3, to: '/sentry/crons' }
    ]
  }
}

// A narrow row: the tabs scroll sideways, the edges fade, the selected one is centred.
export const Overflow: StoryObj<typeof Tabs> = {
  args: { modelValue: 'sequence' },
  decorators: [() => ({ template: '<div style="width: 280px"><story /></div>' })]
}
