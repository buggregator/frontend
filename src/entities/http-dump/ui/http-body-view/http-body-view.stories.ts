import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HttpBodyView from './http-body-view.vue'

export default {
  title: 'Entities/HttpDump/HttpBodyView',
  component: HttpBodyView,
} as Meta<typeof HttpBodyView>

export const JsonBody: StoryObj<typeof HttpBodyView> = {
  args: {
    body: JSON.stringify({
      id: 101,
      title: 'Buggregator proxy test',
      user: { id: 42, name: 'John Doe', email: 'john@example.com' },
      tags: ['admin', 'developer'],
    }),
    language: 'json',
    contentType: 'application/json',
    size: '234 B',
  },
}

export const EmptyJsonObject: StoryObj<typeof HttpBodyView> = {
  args: {
    body: '{}',
    language: 'json',
    contentType: 'application/json',
    size: '2 B',
  },
}

export const HtmlBody: StoryObj<typeof HttpBodyView> = {
  args: {
    body: '<!DOCTYPE html>\n<html>\n<head><title>Test</title>\n<style>body { font-family: sans-serif; padding: 2rem; }</style>\n</head>\n<body>\n<h1>Hello from Buggregator</h1>\n<p>This is an HTML response preview.</p>\n</body>\n</html>',
    language: 'html',
    contentType: 'text/html',
    size: '210 B',
  },
}

export const XmlBody: StoryObj<typeof HttpBodyView> = {
  args: {
    body: '<?xml version="1.0" encoding="UTF-8"?>\n<response>\n  <status>ok</status>\n  <data>\n    <item id="1">Widget</item>\n    <item id="2">Gadget</item>\n  </data>\n</response>',
    language: 'xml',
    contentType: 'application/xml',
    size: '180 B',
  },
}

export const PlainTextBody: StoryObj<typeof HttpBodyView> = {
  args: {
    body: 'OK',
    language: 'plaintext',
    contentType: 'text/plain',
    size: '2 B',
  },
}

export const LargeJsonBody: StoryObj<typeof HttpBodyView> = {
  args: {
    body: JSON.stringify({
      data: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Item ${i + 1}`,
        description: 'A long description string that demonstrates how the tree view handles moderately sized text content across multiple entries in a large JSON payload',
        nested: { level1: { level2: { value: Math.random() } } },
      })),
    }),
    language: 'json',
    contentType: 'application/json',
    size: '4.2 KB',
  },
}
