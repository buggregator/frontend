import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Tab } from 'vue3-tabs-component'
import PageTabs from './page-tabs.vue'

export default {
  title: 'Shared/PageTabs',
  component: PageTabs,
  parameters: {
    layout: 'padded'
  },
  render: (args) => ({
    components: { PageTabs, Tab },
    setup() {
      return { args }
    },
    template: `
      <PageTabs v-bind="args">
        <Tab name="Overview">
          <div style="padding: 16px;">Overview content</div>
        </Tab>
        <Tab name="Details">
          <div style="padding: 16px;">Details content</div>
        </Tab>
        <Tab name="Settings">
          <div style="padding: 16px;">Settings content</div>
        </Tab>
      </PageTabs>
    `
  })
} as Meta<typeof PageTabs>

export const Default: StoryObj<typeof PageTabs> = {}

export const WithBadges: StoryObj<typeof PageTabs> = {
  render: (args) => ({
    components: { PageTabs, Tab },
    setup() {
      return { args }
    },
    template: `
      <PageTabs v-bind="args">
        <Tab
          name="Exceptions"
          :suffix="'<span class=\\'tab-badge\\'>3</span>'"
        >
          <div style="padding: 16px;">3 exceptions found</div>
        </Tab>
        <Tab name="Request">
          <div style="padding: 16px;">Request details</div>
        </Tab>
        <Tab
          name="Breadcrumbs"
          :suffix="'<span class=\\'tab-badge\\'>12</span>'"
        >
          <div style="padding: 16px;">12 breadcrumbs recorded</div>
        </Tab>
        <Tab
          name="Modules"
          :suffix="'<span class=\\'tab-badge\\'>48</span>'"
        >
          <div style="padding: 16px;">48 modules loaded</div>
        </Tab>
      </PageTabs>
    `
  })
}
