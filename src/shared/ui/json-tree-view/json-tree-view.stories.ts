import type { Meta, StoryObj } from '@storybook/vue3-vite'
import JsonTreeView from './json-tree-view.vue'

export default {
  title: 'Shared/JsonTreeView',
  component: JsonTreeView,
} as Meta<typeof JsonTreeView>

const nestedFixture = {
  id: 101,
  title: 'Buggregator proxy test',
  user: {
    id: 42,
    name: 'John Doe',
    email: 'john@example.com',
    address: {
      street: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      geo: { lat: 39.7817, lng: -89.6501 },
    },
    tags: ['admin', 'developer', 'tester'],
  },
  items: [
    { sku: 'WIDGET-001', name: 'Widget', qty: 3, price: 9.99 },
    { sku: 'GADGET-002', name: 'Gadget', qty: 1, price: 24.99 },
  ],
  metadata: {
    created_at: '2026-04-04T12:00:00Z',
    updated_at: null,
    is_active: true,
    description:
      'This is a very long string value that exceeds one hundred characters in length and should be truncated by the tree view component with an expand button shown inline.',
  },
}

export const Default: StoryObj<typeof JsonTreeView> = {
  args: {
    value: nestedFixture,
  },
}

export const SimpleArray: StoryObj<typeof JsonTreeView> = {
  args: {
    value: [1, 'hello', true, null, { nested: 'object' }],
  },
}

export const PrimitiveString: StoryObj<typeof JsonTreeView> = {
  args: {
    value: 'Just a string value',
  },
}

export const EmptyObject: StoryObj<typeof JsonTreeView> = {
  args: {
    value: {},
  },
}

export const DeeplyNested: StoryObj<typeof JsonTreeView> = {
  args: {
    value: {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deep!',
              },
            },
          },
        },
      },
    },
  },
}
