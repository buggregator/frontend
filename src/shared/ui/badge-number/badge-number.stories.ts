import type { Meta, StoryObj } from '@storybook/vue3';
import BadgeNumber from './badge-number.vue';

export default {
  title: 'Shared/BadgeNumber',
  component: BadgeNumber,
  render: (args) => ({
    setup() {
      return {
        args,
      };
    },
    components: { BadgeNumber },
    template: `
      <BadgeNumber v-bind="args">
        <button style="width: 100px">
          Button
        </button>
      </BadgeNumber>
    `,
  }),
} as Meta<typeof BadgeNumber>;

export const Default: StoryObj<typeof BadgeNumber> = {
  args: {
    number: 1,
    isVisible: true,
  },
};

export const Maximum: StoryObj<typeof BadgeNumber> = {
  args: {
    number: 10000,
    isVisible: true,
  },
};
