import type { Meta, StoryObj } from "@storybook/vue3";
import StatBoard from "./stat-board.vue";

export default {
  title: "Shared/StatBoard",
  component: StatBoard,
} as Meta<typeof StatBoard>;


export const Default: StoryObj<typeof StatBoard> = {
  args: {
    cost: {
      ct: 1,
      wt: 206270,
      cpu: 44750,
      mu: 3112176,
      pmu: 3001416
    },
  }
};


export const LargePeaks: StoryObj<typeof StatBoard> = {
  args: {
    cost: {
      ct: 1,
      wt: 2062700000,
      cpu: 447500000,
      mu: 31121760000,
      pmu: 30014160000,
    },
  }
};
