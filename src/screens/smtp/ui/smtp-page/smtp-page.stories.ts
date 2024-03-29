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

export const WithSource: StoryObj<typeof SmtpPage> = {
  args: {
    event: normalizeSmtpEvent(smtpTextMock),
    htmlSource: `<iframe src="${REST_API_URL}/api/smtp/${normalizeSmtpEvent(smtpTextMock).id}/html"/>`
  }
};
