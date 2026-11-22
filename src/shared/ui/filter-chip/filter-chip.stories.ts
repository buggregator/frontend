import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { action } from 'storybook/actions'
import FilterChip from './filter-chip.vue'

export default {
  title: 'Shared/FilterChip',
  component: FilterChip,
  parameters: { layout: 'centered' },
  args: { name: 'host', value: 'anna-mbp' },
  argTypes: { onRemove: action('Remove filter') }
} as Meta<typeof FilterChip>

export const Default: StoryObj<typeof FilterChip> = {}

export const Exclude: StoryObj<typeof FilterChip> = {
  args: { name: 'channel', value: 'doctrine', not: true }
}

export const LongValue: StoryObj<typeof FilterChip> = {
  args: { name: 'release', value: 'buggregator@2.4.1+build.20261122.abcdef0123456789' }
}
