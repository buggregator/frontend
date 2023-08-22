import { Meta, Story } from "@storybook/vue3";
import { normalizeProfilerEvent } from "~/utils/normalize-event";
import StatBoard from "~/components/StatBoard/StatBoard.vue";
import profilerEventMock from "~/mocks/profiler.json";
import type { Profiler } from "~/config/types";

export default {
  title: "Components/StatBoard",
  component: StatBoard,
} as Meta<typeof StatBoard>;

const Template: Story = (args) => ({
  components: { StatBoard },
  setup() {
    return {
      args,
    };
  },
  template: `<stat-board v-bind="args" />`,
});

export const Default = Template.bind({});

Default.args = {
  cost: (normalizeProfilerEvent(profilerEventMock).payload as Profiler)?.peaks,
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
