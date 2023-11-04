import { Meta, Story } from "@storybook/vue3";
import { useSmtp } from "../../lib";
import { smtpOrderMock, smtpWelcomeMock } from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeSmtpEvent } = useSmtp();

export default {
  title: "FSD/entities/SMTP/PreviewCard",
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

export const OrderShipped = Template.bind({});

OrderShipped.args = {
  event: normalizeSmtpEvent(smtpOrderMock),
};

export const Welcome = Template.bind({});

Welcome.args = {
  event: normalizeSmtpEvent(smtpWelcomeMock),
};
