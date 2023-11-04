import { Meta, Story } from "@storybook/vue3";
import { SFDumpCode, HTMLEscapedString } from "../../mocks";
import ValueDump from './value-dump.vue';

export default {
  title: "FSD/shared/ValueDump",
  component: ValueDump
} as Meta<typeof ValueDump>;

const Template: Story = (args) => ({
  components: { ValueDump },
  setup() {
    return {
      args,
    };
  },
  template: `<ValueDump v-bind="args" />`,
});

export const String = Template.bind({});

String.args = {
  value: HTMLEscapedString,
  type: 'string',
};

export const Boolean = Template.bind({});

Boolean.args = {
  value: true,
};

export const SfDump = Template.bind({});

SfDump.args = {
  value: SFDumpCode,
};
