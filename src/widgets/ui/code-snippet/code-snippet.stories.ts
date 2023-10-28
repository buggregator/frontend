import { Meta, Story } from "@storybook/vue3";
import { EVENT_TYPES } from "~/config/constants";
import { HTMLCode, PHPCode } from '@/src/shared/mocks';
import CodeSnippet from "./code-snippet.vue";

export default {
  title: "FSD/widgets/CodeSnippet",
  component: CodeSnippet,
} as Meta<typeof CodeSnippet>;

const Template: Story = (args) => ({
  components: { CodeSnippet },
  setup() {
    return {
      args,
    };
  },
  template: `<CodeSnippet v-bind="args" />`,
});

export const Default = Template.bind({});
Default.args = {
  code: "Hello World!",
  language: 'text'
};

export const Object = Template.bind({});
Object.args = {
  code: {
    id: 'da076402-6f98-4ada-bae2-d77d405cf427',
    type: EVENT_TYPES.MONOLOG,
    serverName: "My server",
    origin: {
      one: 1,
      two: 2,
    },
    date: new Date(1673266869 * 1000),
    labels: ['Monolog', '200' ]
  },
  language: 'javascript'
};

export const HTMLString = Template.bind({});
HTMLString.args = {
  code: HTMLCode,
  language: 'html'
};

export const PHPString = Template.bind({});
PHPString.args = {
  code: PHPCode,
  language: 'php'
};
