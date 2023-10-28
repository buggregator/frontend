import { Meta, Story } from "@storybook/vue3";
import { normalizeFallbackEvent } from "~/utils/normalize-event";
import PreviewFallback from '~/components/PreviewFallback/PreviewFallback.vue';
import { monologMock } from '~/src/entities/monolog/mocks'

export default {
  title: "Preview/PreviewFallback",
  component: PreviewFallback
} as Meta<typeof PreviewFallback>;

const Template: Story = (args) => ({
  components: { PreviewFallback },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewFallback v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  event: normalizeFallbackEvent({ ...monologMock, type: 'unknown' }),
};
