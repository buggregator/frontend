import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { onUnmounted } from 'vue';
import MetricsPage from "./metrics-page.vue";

const mockMetrics = {
  events: {
    received: {
      'sentry': 1243,
      'var-dump': 587,
      'monolog': 3891,
      'smtp': 42,
      'http-dump': 156,
      'inspector': 89,
      'ray': 312,
      'profiler': 24,
    },
    stored: {
      'sentry': 318,
      'var-dump': 201,
      'monolog': 1044,
      'smtp': 38,
      'http-dump': 73,
      'inspector': 45,
      'ray': 128,
      'profiler': 24,
    },
    errors: 3,
  },
  connections: {
    websocket: 4,
    tcp: {
      'monolog': 2,
      'smtp': 1,
      'var-dumper': 3,
    },
  },
  http: {
    requests_total: 28471,
  },
  webhooks: {
    sent: 156,
    failed: 2,
  },
}

const emptyMetrics = {
  events: { received: {}, stored: {}, errors: 0 },
  connections: { websocket: 0, tcp: {} },
  http: { requests_total: 0 },
  webhooks: { sent: 0, failed: 0 },
}

function createFetchMockDecorator(data: unknown) {
  return () => ({
    setup() {
      const originalFetch = window.fetch
      window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/metrics')) {
          return Promise.resolve(new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }))
        }
        return originalFetch(input, init)
      }) as typeof window.fetch

      onUnmounted(() => {
        window.fetch = originalFetch
      })
    },
    template: '<story />',
  })
}

export default {
  title: "Screens/Metrics/MetricsPage",
  component: MetricsPage,
  parameters: {
    layout: 'fullscreen',
  },
} as Meta<typeof MetricsPage>;

export const WithData: StoryObj<typeof MetricsPage> = {
  decorators: [createFetchMockDecorator(mockMetrics)],
}

export const Empty: StoryObj<typeof MetricsPage> = {
  decorators: [createFetchMockDecorator(emptyMetrics)],
}
