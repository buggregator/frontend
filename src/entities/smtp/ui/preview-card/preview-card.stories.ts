import type { Meta, StoryObj } from '@storybook/vue3';
import { useSmtp } from '../../lib';
import { smtpOrderMock, smtpWelcomeMock } from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeSmtpEvent } = useSmtp();

export default {
  title: 'Entities/SMTP/PreviewCard',
  component: PreviewCard,
} as Meta<typeof PreviewCard>;

export const OrderShipped: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSmtpEvent(smtpOrderMock),
  },
};

export const Welcome: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeSmtpEvent(smtpWelcomeMock),
  },
};
