import { action } from '@storybook/addon-actions'
import type { Meta, Story } from "@storybook/vue3";
import { EVENT_TYPES } from "../../types";
import PreviewCardHeader from './preview-card-header.vue';

export default {
  title: "Shared/PreviewCardHeader",
  component: PreviewCardHeader,
  argTypes: {
    eventType: {
      control: { type: 'select' },
      options: Object.values(EVENT_TYPES),
      mapping: EVENT_TYPES
    },
  }
} as Meta<typeof PreviewCardHeader>;

const Template: Story = (args) => ({
  components: { PreviewCardHeader },
  methods: {
    action
  },
  setup() {
    return {
      args,
    };
  },
  template: `
    <PreviewCardHeader
      v-bind="args"
      @delete="(a) => action('Delete event')(a)"
      @toggle-view="(a) => action('Toggle event')(a)"
      @copy="(a) => action('Copied event')(a)"
      @download="(a) => action('Downloaded event')(a)"
    />
`,
});

export const Default = Template.bind({});
Default.args = {
  eventUrl: 'https://github.com/buggregator/spiral-app',
  eventType: EVENT_TYPES.SENTRY,
  isOpen: true,
  isVisibleControls: true,
  eventId: 'test-event-id',
  tags: ['one', 'two', 'tree']
};
