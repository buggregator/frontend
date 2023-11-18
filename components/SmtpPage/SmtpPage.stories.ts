import { Meta, Story } from "@storybook/vue3";
import SmtpPage from "~/components/SmtpPage/SmtpPage.vue";
import { smtpOrderMock, smtpTextMock, smtpWelcomeMock } from '~/src/entities/smtp/mocks';
import { useSmtp } from "~/src/entities/smtp";

const { normalizeSmtpEvent } = useSmtp();

export default {
  title: "Smtp/Page/SmtpPage",
  component: SmtpPage
} as Meta<typeof SmtpPage>;

const Template: Story = (args) => ({
  components: { SmtpPage },
  setup() {
    return {
      args,
    };
  },
  template: `<SmtpPage v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  event: normalizeSmtpEvent(smtpWelcomeMock),
  htmlSource: normalizeSmtpEvent(smtpWelcomeMock).payload.html
};

export const Order = Template.bind({});
Order.args = {
  event: normalizeSmtpEvent(smtpOrderMock),
  htmlSource: normalizeSmtpEvent(smtpOrderMock).payload.html
};

export const Text = Template.bind({});
Text.args = {
  event: normalizeSmtpEvent(smtpTextMock),
  htmlSource: normalizeSmtpEvent(smtpTextMock).payload.html
};
