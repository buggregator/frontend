import type { Meta, StoryObj } from "@storybook/vue3";
import { useSmtp } from "~/src/entities/smtp";
import { smtpOrderMock, smtpTextMock, smtpWelcomeMock } from '~/src/entities/smtp/mocks';
import { REST_API_URL } from "~/src/shared/lib/io";
import SmtpPage from "./smtp-page.vue";

const { normalizeSmtpEvent } = useSmtp();

export default {
  title: "Screens/smtp/SmtpPage",
  component: SmtpPage
} as Meta<typeof SmtpPage>;

const Template: StoryObj = (args: unknown) => ({
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
  event: normalizeSmtpEvent(smtpWelcomeMock)
};

export const Order = Template.bind({});
Order.args = {
  event: normalizeSmtpEvent(smtpOrderMock)
};

export const Text = Template.bind({});
Text.args = {
  event: normalizeSmtpEvent(smtpTextMock)
};

export const withSource = Template.bind({});
withSource.args = {
  event: normalizeSmtpEvent(smtpTextMock),
  htmlSource: `<iframe src="${REST_API_URL}/api/smtp/${normalizeSmtpEvent(smtpTextMock).id}/html"/>`
};
