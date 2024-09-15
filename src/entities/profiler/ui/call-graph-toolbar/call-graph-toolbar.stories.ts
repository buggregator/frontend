import type { Meta, StoryObj } from "@storybook/vue3";
import {GraphTypes} from "@/shared/types";
import CallGraphToolbar from './call-graph-toolbar.vue';


export default {
  title: "Entities/Profiler/CallGraphToolbar",
  component: CallGraphToolbar
} as Meta<typeof CallGraphToolbar>;


export const Default: StoryObj<typeof CallGraphToolbar> = {
  args: {
    toolbar: [{
      description: 'description',
      label: 'label',
      metric: 'd_cpu',
    }],
    isFullscreen: false,
    metric: GraphTypes.CPU,
    threshold: 1,
    percent: 1
  }
};
