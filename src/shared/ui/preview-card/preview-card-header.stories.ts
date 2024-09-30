import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/vue3';
import { EventTypes } from '../../types';
import PreviewCardHeader from './preview-card-header.vue';

export default {
  title: 'Shared/PreviewCardHeader',
  component: PreviewCardHeader,
  argTypes: {
    eventType: {
      control: { type: 'select' },
      options: Object.values(EventTypes),
      mapping: EventTypes,
    },
    onCopy: action('Copied event'),
    onDelete: action('Delete event'),
    onDownload: action('Downloaded event'),
    onToggleView: action('Toggle event'),
  },
} as Meta<typeof PreviewCardHeader>;

export const Default: StoryObj<typeof PreviewCardHeader> = {
  args: {
    eventId: 'test-event-id',
    eventType: EventTypes.Sentry,
    eventUrl: 'https://github.com/buggregator/spiral-app',
    isOpen: true,
    isVisibleControls: true,
    labels: [
      'one',
      'two',
      'tree',
    ],
  },
};
