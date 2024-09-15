import type { Meta } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import RenderGraph from './render-graph.vue';

export default {
  title: "Entities/Profiler/RenderGraph",
  component: RenderGraph,
  render: (args: ComponentProps<typeof RenderGraph>) => ({
    components: { RenderGraph },
    setup() {
      return {
        args,
      };
    },
    template: `<RenderGraph :elements="args.elements" :height="500" />`,
  })
} as Meta<typeof RenderGraph>;

export const TestData: Meta<typeof RenderGraph> = {
  args: {
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
  }
};
