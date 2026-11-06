import type { Meta, StoryObj } from '@storybook/vue3-vite'
import AddressFlow from './address-flow.vue'

export default {
  title: 'Shared/AddressFlow',
  component: AddressFlow
} as Meta<typeof AddressFlow>

export const Default: StoryObj<typeof AddressFlow> = {
  args: {
    from: 'Buggregator <noreply@buggregator.dev>',
    to: 'John <john@example.com>'
  }
}

export const OnlyRecipient: StoryObj<typeof AddressFlow> = {
  args: {
    to: '+15551234567'
  }
}
