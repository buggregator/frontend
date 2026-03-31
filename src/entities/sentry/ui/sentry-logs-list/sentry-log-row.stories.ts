import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { mockLogs } from "../../mocks";
import SentryLogRow from './sentry-log-row.vue';

export default {
  title: "Entities/Sentry/SentryLogRow",
  component: SentryLogRow,
} as Meta<typeof SentryLogRow>;

export const Info: StoryObj<typeof SentryLogRow> = {
  args: { log: mockLogs[0] },
};

export const Warning: StoryObj<typeof SentryLogRow> = {
  args: { log: mockLogs[1] },
};

export const Error: StoryObj<typeof SentryLogRow> = {
  args: { log: mockLogs[2] },
};

export const Debug: StoryObj<typeof SentryLogRow> = {
  args: { log: mockLogs[3] },
};
