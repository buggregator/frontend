import type { Meta, StoryObj } from "@storybook/vue3";
import { useSmtp } from "../../lib";
import { smtpOrderMock, smtpTextMock, smtpWelcomeMock } from "../../mocks";
import SmtpPage from "./smtp-page.vue";

const { normalizeSmtpEvent } = useSmtp();

export default {
  title: "Screens/smtp/SmtpPage",
  component: SmtpPage
} as Meta<typeof SmtpPage>;

export const Default: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent(smtpWelcomeMock)
  }
};

export const Order: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent(smtpOrderMock)
  }
};

export const Text: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent(smtpTextMock)
  }
};
