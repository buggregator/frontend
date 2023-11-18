import { Meta, Story } from "@storybook/vue3";
import { normalizeSMTPEvent } from "~/utils/normalize-event";
import smtpEventWelcomeMock from '~/mocks/smtp-welcome.json'
import smtpEventOrderMock from '~/mocks/smtp-order.json'
import smtpEventTextMock from '~/mocks/smtp-text.json'
import SmtpPage from "~/components/SmtpPage/SmtpPage.vue";

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

const normalizeEventWelcome = normalizeSMTPEvent(smtpEventWelcomeMock)
const normalizeEventOrder = normalizeSMTPEvent(smtpEventOrderMock)
const normalizeEventText = normalizeSMTPEvent(smtpEventTextMock)

export const Default = Template.bind({});
Default.args = {
  event: normalizeEventWelcome,
  htmlSource: normalizeEventWelcome.payload.html
};

export const Order = Template.bind({});
Order.args = {
  event: normalizeEventOrder,
  htmlSource: normalizeEventOrder.payload.html
};

export const Text = Template.bind({});
Text.args = {
  event: normalizeEventText,
  htmlSource: normalizeEventText.payload.html
};
