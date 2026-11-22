import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import SegmentedControl from './segmented-control.vue'

export default {
  title: 'Shared/SegmentedControl',
  component: SegmentedControl,
  parameters: { layout: 'centered' },
  args: {
    label: 'Order',
    modelValue: 'newest',
    options: [
      { value: 'newest', label: 'Newest first' },
      { value: 'oldest', label: 'Oldest first' }
    ]
  },
  argTypes: {
    size: { control: { type: 'select' }, options: ['sm', 'md'] },
    variant: { control: { type: 'select' }, options: ['track', 'outline'] }
  },
  render: (args) => ({
    components: { SegmentedControl },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: '<SegmentedControl v-bind="args" v-model="value" />'
  })
} as Meta<typeof SegmentedControl>

export const Default: StoryObj<typeof SegmentedControl> = {}

export const Small: StoryObj<typeof SegmentedControl> = {
  args: {
    size: 'sm',
    label: 'Body view',
    modelValue: 'pretty',
    options: [
      { value: 'raw', label: 'Raw' },
      { value: 'pretty', label: 'Pretty' },
      { value: 'tree', label: 'Tree' }
    ]
  }
}

export const Outline: StoryObj<typeof SegmentedControl> = {
  args: { variant: 'outline' }
}

export const IconsAndCounts: StoryObj<typeof SegmentedControl> = {
  args: {
    label: 'Device',
    modelValue: 'desktop',
    iconOnlyOnPhone: true,
    options: [
      { value: 'desktop', label: 'Desktop', icon: 'desktop-device' },
      { value: 'tablet', label: 'Tablet', icon: 'tablet-device', count: 2 },
      { value: 'mobile', label: 'Mobile', icon: 'mobile-device', disabled: true }
    ]
  }
}

export const Block: StoryObj<typeof SegmentedControl> = {
  args: {
    block: true,
    label: 'Pane',
    modelValue: 'rules',
    options: [
      { value: 'rules', label: 'Rules', count: 4 },
      { value: 'requests', label: 'Requests', count: 12 }
    ]
  },
  decorators: [() => ({ template: '<div style="width: 360px"><story /></div>' })]
}
