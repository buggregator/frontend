import type { Meta, StoryObj } from '@storybook/vue3';
import StatBoard from './stat-board.vue';
import { StatBoardSize } from './types';

export default {
  title: 'Shared/StatBoard',
  component: StatBoard,
  argTypes: {
    size: {
      control: 'select',
      options: [...Object.values(StatBoardSize), undefined],
    },
  },
} as Meta<typeof StatBoard>;

export const Default: StoryObj<typeof StatBoard> = {
  args: {
    cost: {
      cpu: 44750,
      ct: 1,
      mu: 3112176,
      pmu: 3001416,
      wt: 206270,
    },
  },
};

export const LargePeaks: StoryObj<typeof StatBoard> = {
  args: {
    cost: {
      cpu: 447500000,
      ct: 1,
      mu: 31121760000,
      pmu: 30014160000,
      wt: 2062700000,
    },
  },
};

export const SmallSize: StoryObj<typeof StatBoard> = {
  args: {
    cost: {
      cpu: 44750,
      ct: 1,
      mu: 3112176,
      pmu: 3001416,
      wt: 206270,
    },
    size: StatBoardSize.Small,
  },
};
