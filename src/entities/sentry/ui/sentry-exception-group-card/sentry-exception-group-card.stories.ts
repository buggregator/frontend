import type { Meta, StoryObj } from "@storybook/vue3-vite";
import type { SentryErrorGroup } from "../../types";
import SentryExceptionGroupCard from './sentry-exception-group-card.vue';

const mockGroup: SentryErrorGroup = {
  fingerprint: 'a1b2c3d4e5f6a7b8',
  exception_type: 'Illuminate\\Database\\QueryException',
  exception_value: 'SQLSTATE[HY000]: General error: 2006 MySQL server has gone away',
  count: 184,
  first_seen: '2025-03-30T09:14:00Z',
  last_seen: '2025-03-30T14:23:47Z',
  level: 'error',
  handled: false,
  sample_event_id: 'abc-123',
}

export default {
  title: "Entities/Sentry/SentryExceptionGroupCard",
  component: SentryExceptionGroupCard,
} as Meta<typeof SentryExceptionGroupCard>;

export const Unhandled: StoryObj<typeof SentryExceptionGroupCard> = {
  args: {
    group: mockGroup,
  }
};

export const Handled: StoryObj<typeof SentryExceptionGroupCard> = {
  args: {
    group: { ...mockGroup, handled: true, count: 12, level: 'warning' },
  }
};

export const SingleOccurrence: StoryObj<typeof SentryExceptionGroupCard> = {
  args: {
    group: { ...mockGroup, count: 1, level: 'info', exception_type: 'RuntimeException' },
  }
};

export const LongClassName: StoryObj<typeof SentryExceptionGroupCard> = {
  args: {
    group: {
      ...mockGroup,
      exception_type: 'App\\Domain\\Payment\\Exceptions\\InsufficientFundsException',
      exception_value: 'Insufficient funds: balance is $0.00, required $49.99 for order #12345',
    },
  }
};
