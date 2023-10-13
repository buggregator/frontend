import { Meta, Story } from "@storybook/vue3";
import RenderGraph from '~/components/RenderGraph/RenderGraph.vue';
import profilerEventMock from '~/mocks/profiler.json'
import { GraphTypes } from "~/config/types";
import { calcGraphData } from "~/utils/calc-graph-data";

export default {
  title: "Components/RenderGraph",
  component: RenderGraph
} as Meta<typeof RenderGraph>;

const Template: Story = (args) => ({
  components: { RenderGraph },
  setup() {
    return {
      args,
    };
  },
  template: `<RenderGraph v-bind="args" />`,
});

export const TestData = Template.bind({});

TestData.args = {
    elements: {
      nodes: [
        { data: { id: 'e10', name: 'Spiral\\Core\\AbstractCore::callAction', color: '#6FB1FC' } },
        { data: { id: 'e11', name: 'Spiral\\Core\\AbstractCore::Spiral\\Core\\{closure}', color: '#EDA1ED' } },
        { data: { id: 'e12', name: 'App\\Controller\\HomeController::email', color: '#86B342' } },
        { data: { id: 'e13', name: 'Spiral\\SendIt\\MailQueue::send', color: '#F5A45D' } },
        { data: { id: 'e14', name: 'Spiral\\Queue\\Queue::push', color: '#e74c3c' } }
      ],
      edges: [
        { data: { source: 'e10', target: 'e11', label: '100%' } },
        { data: { source: 'e11', target: 'e12', label: '100%' } },
        { data: { source: 'e12', target: 'e13', label: '100%' } },
        { data: { source: 'e13', target: 'e14', label: '100%' } },
        { data: { source: 'e14', target: 'e14', label: '100%' } },
        { data: { source: 'e14', target: 'e14', label: '100%' } },
        { data: { source: 'e14', target: 'e10', label: '100%' } },
        { data: { source: 'e14', target: 'e14', label: '100%' } },
      ]
    },
};



export const ProfilerData = Template.bind({});

ProfilerData.args = {
  elements: calcGraphData(profilerEventMock.payload.edges, GraphTypes.CPU, 1)
};

export const ProfilerMemoryData = Template.bind({});

ProfilerMemoryData.args = {
  elements: calcGraphData(profilerEventMock.payload.edges, GraphTypes.MEMORY, 1)
};

export const ProfilerMemoryChangeData = Template.bind({});

ProfilerMemoryChangeData.args = {
  elements: calcGraphData(profilerEventMock.payload.edges, GraphTypes.MEMORY_CHANGE, 1)
};
