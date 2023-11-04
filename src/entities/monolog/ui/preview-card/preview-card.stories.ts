import { Meta, Story } from "@storybook/vue3";
import { useMonolog } from "../../lib";
import { monologMock } from '../../mocks'
import PreviewCard from './preview-card.vue';

const { normalizeMonologEvent } = useMonolog();

export default {
  title: "FSD/entities/monolog/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

const Template: Story = (args) => ({
  components: { PreviewCard },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewCard v-bind="args" />`,
});

export const Event = Template.bind({});

Event.args = {
  event: normalizeMonologEvent(monologMock),
};

export const WithOrigin = Template.bind({});

WithOrigin.args = {
  event: {
    ...normalizeMonologEvent(monologMock),
    origin: {
      file: "/var/www/html/vendor/symfony/http-kernel/HttpKernel.php",
      line_number: 151,
      name: "Symfony\\Component\\HttpKernel\\HttpKernel->handleRaw",
    }
  },
};
