import { Meta, Story } from "@storybook/vue3";
// TODO: move type to entities
import type { Profiler } from "~/config/types";
import { useNormalizeEvent } from "~/src/entities/lib";
import { profilerMock } from  "~/src/entities/profiler/mocks";
import StatBoard from "./stat-board.vue";

const { normalizeProfilerEvent } = useNormalizeEvent()

export default {
  title: "FSD/widgets/StatBoard",
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
  cost: (normalizeProfilerEvent(profilerMock).payload as Profiler)?.peaks,
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
