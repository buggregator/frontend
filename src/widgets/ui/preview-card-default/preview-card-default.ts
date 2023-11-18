import { Meta, Story } from "@storybook/vue3";
import { normalizeFallbackEvent } from "~/utils/normalize-event";
import { monologMock } from '~/src/entities/monolog/mocks'
import PreviewCardDefault from './preview-card-default.vue';

export default {
  title: "FSD/widgets/PreviewCardDefault",
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
  event: normalizeFallbackEvent({ ...monologMock, type: 'unknown' }),
};
