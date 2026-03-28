import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useSms } from "../../lib";
import { smsTwilioMock, smsVonageMock, smsGenericMock, smsTwilioWarningsMock, smsVonageWarningsMock } from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeSmsEvent } = useSms();

export default {
  title: "Entities/SMS/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

export const Twilio: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSmsEvent(smsTwilioMock),
  }
};

export const Vonage: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSmsEvent(smsVonageMock),
  }
};

export const Generic: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSmsEvent(smsGenericMock),
  }
};

export const TwilioWithWarnings: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSmsEvent(smsTwilioWarningsMock),
  }
};

export const VonageWithWarnings: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSmsEvent(smsVonageWarningsMock),
  }
};
