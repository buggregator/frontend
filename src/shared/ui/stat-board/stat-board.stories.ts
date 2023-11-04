import { Meta, Story } from "@storybook/vue3";
import StatBoard from "./stat-board.vue";

export default {
  title: "FSD/shared/StatBoard",
  component: StatBoard,
} as Meta<typeof StatBoard>;

const Template: Story = (args) => ({
  components: { StatBoard },
  setup() {
    return {
      args,
    };
  },
  template: `<StatBoard v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  cost: {
    ct: 1,
    wt: 206270,
    cpu: 44750,
    mu: 3112176,
    pmu: 3001416
},
};

export const LargePeaks = Template.bind({});

LargePeaks.args = {
  cost: {
    ct: 1,
    wt: 2062700000,
    cpu: 447500000,
    mu: 31121760000,
    pmu: 30014160000,
  },
};
