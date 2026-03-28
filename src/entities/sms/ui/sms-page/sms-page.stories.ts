import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useSms } from "../../lib";
import { smsTwilioMock, smsVonageMock, smsGenericMock, smsTwilioWarningsMock, smsVonageWarningsMock } from '../../mocks';
import SmsPage from "./sms-page.vue";

const { normalizeSmsEvent } = useSms();

export default {
  title: "Entities/SMS/SmsPage",
  component: SmsPage,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof SmsPage>;

export const Twilio: StoryObj<typeof SmsPage> = {
  args: {
    event: normalizeSmsEvent(smsTwilioMock)
  }
};

export const Vonage: StoryObj<typeof SmsPage> = {
  args: {
    event: normalizeSmsEvent(smsVonageMock)
  }
};

export const Generic: StoryObj<typeof SmsPage> = {
  args: {
    event: normalizeSmsEvent(smsGenericMock)
  }
};

export const TwilioWithWarnings: StoryObj<typeof SmsPage> = {
  args: {
    event: normalizeSmsEvent(smsTwilioWarningsMock)
  }
};

export const VonageWithWarnings: StoryObj<typeof SmsPage> = {
  args: {
    event: normalizeSmsEvent(smsVonageWarningsMock)
  }
};
