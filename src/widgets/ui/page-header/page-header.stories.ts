import { action } from '@storybook/addon-actions'
import { Meta, Story } from "@storybook/vue3";
import { EVENT_TYPES } from "~/src/shared/types";
import PageHeader from "./page-header.vue";

export default {
  title: "FSD/widgets/PageHeader",
  component: PageHeader,
  argTypes: {
    eventType: {
      control: { type: 'select' },
      options: Object.values(EVENT_TYPES),
      mapping: EVENT_TYPES
    },
  }
} as Meta<typeof PageHeader>;

const Template: Story = (args) => ({
  components: { PageHeader },
  methods: {
    action
  },
  setup() {
    return {
      args,
    };
  },
  template: `
    <PageHeader
      v-bind="args"
      @delete="(a) => action('Delete event')(a)"
    >
      Page title
    </PageHeader>
`,
});

export const Default = Template.bind({});
Default.args = {
  buttonTitle: "Delete event",
};


const TemplateWithActions: Story = (args) => ({
  components: { PageHeader },
  methods: {
    action
  },
  setup() {
    return {
      args,
    };
  },
  template: `
    <PageHeader
      v-bind="args"
      @delete="(a) => action('Delete event')(a)"
    >
      Page title

      <template #controls>
        <button class="flex mr-3 rounded-sm bg-blue-500 text-xs p-1" @click="(a) => action('Custom action event')(a)">
          Additional button
        </button>
      </template>
    </PageHeader>
`,
});

export const WithActions = TemplateWithActions.bind({});
WithActions.args = {
  buttonTitle: "Delete event",
};
