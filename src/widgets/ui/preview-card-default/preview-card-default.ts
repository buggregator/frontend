import { Meta, Story } from "@storybook/vue3";
import { monologMock } from '~/src/entities/monolog/mocks'
import { useEvents } from "~/src/shared/lib/use-events";
import PreviewCardDefault from './preview-card-default.vue';

const { normalizeUnknownEvent } = useEvents();

export default {
  title: "Widgets/PreviewCardDefault",
  component: PreviewCardDefault
} as Meta<typeof PreviewCardDefault>;

const Template: Story = (args) => ({
  components: { PreviewCardDefault },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewCardDefault v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  event: normalizeUnknownEvent({ ...monologMock, type: 'unknown' }),
};
