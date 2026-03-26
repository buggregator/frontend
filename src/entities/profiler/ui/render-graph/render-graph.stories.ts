import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import type { ProfilerCallGraph } from "../../types";
import RenderGraph from './render-graph.vue';

const mockServerData: ProfilerCallGraph = {
  toolbar: [
    { label: 'CPU', metric: 'cpu', description: 'CPU time in ms.' },
    { label: 'Wall time', metric: 'wt', description: 'Wall time in ms.' },
  ],
  nodes: [
    {
      data: {
        id: 'n1',
        name: 'main() (1x)',
        color: '#000000',
        textColor: '#FFFFFF',
        cost: { cpu: 864132, wt: 891083, pmu: 2104624, mu: 620856, ct: 1 },
        metrics: { cost: 891083, percents: 100 },
      }
    },
    {
      data: {
        id: 'n2',
        name: 'App\\Http\\Kernel::handle (1x)',
        color: '#000000',
        textColor: '#FFFFFF',
        cost: { cpu: 860000, wt: 889000, pmu: 2100000, mu: 618000, ct: 1 },
        metrics: { cost: 889000, percents: 99.8 },
      }
    },
    {
      data: {
        id: 'n3',
        name: 'Illuminate\\Pipeline::then (1x)',
        color: '#540d0d',
        textColor: '#FFFFFF',
        cost: { cpu: 750000, wt: 780000, pmu: 1800000, mu: 500000, ct: 1 },
        metrics: { cost: 780000, percents: 87.5 },
      }
    },
    {
      data: {
        id: 'n4',
        name: 'App\\Controller::index (3x)',
        color: '#d93939',
        textColor: '#FFFFFF',
        cost: { cpu: 250000, wt: 300000, pmu: 600000, mu: 200000, ct: 3 },
        metrics: { cost: 300000, percents: 33.7 },
      }
    },
    {
      data: {
        id: 'n5',
        name: 'DB::query (12x)',
        color: '#f19797',
        textColor: '#000000',
        cost: { cpu: 120000, wt: 180000, pmu: 300000, mu: 100000, ct: 12 },
        metrics: { cost: 180000, percents: 20.2 },
      }
    },
    {
      data: {
        id: 'n6',
        name: 'View::render (1x)',
        color: '#ffffff',
        textColor: '#000000',
        cost: { cpu: 50000, wt: 60000, pmu: 150000, mu: 80000, ct: 1 },
        metrics: { cost: 60000, percents: 6.7 },
      }
    },
    {
      data: {
        id: 'n7',
        name: 'Cache::remember (5x)',
        color: '#ffffff',
        textColor: '#000000',
        cost: { cpu: 10000, wt: 15000, pmu: 50000, mu: 20000, ct: 5 },
        metrics: { cost: 15000, percents: 1.7 },
      }
    },
  ],
  edges: [
    { data: { source: 'n1', target: 'n2', label: '99.8%', color: '#000000' } },
    { data: { source: 'n2', target: 'n3', label: '87.5%', color: '#540d0d' } },
    { data: { source: 'n3', target: 'n4', label: '33.7%', color: '#d93939' } },
    { data: { source: 'n4', target: 'n5', label: '20.2%', color: '#f19797' } },
    { data: { source: 'n4', target: 'n6', label: '6.7%', color: '#999' } },
    { data: { source: 'n3', target: 'n7', label: '1.7%', color: '#999' } },
  ]
};

export default {
  title: "Entities/Profiler/RenderGraph",
  component: RenderGraph,
  render: (args: ComponentProps<typeof RenderGraph>) => ({
    components: { RenderGraph },
    setup() {
      return { args };
    },
    template: `<div style="height: 600px; width: 100%;"><RenderGraph v-bind="args" /></div>`,
  })
} as Meta<typeof RenderGraph>;

export const Default: StoryObj<typeof RenderGraph> = {
  args: {
    serverData: mockServerData,
    height: 600,
  }
};
