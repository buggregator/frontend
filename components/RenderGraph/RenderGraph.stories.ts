import { Meta, Story } from "@storybook/vue3";
import RenderGraph from '~/components/RenderGraph/RenderGraph.vue';

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
  data: {
    elements: {
      nodes: [
        { data: { id: 'e10', name: 'Spiral\\Core\\AbstractCore::callAction', weight: 70, faveColor: '#6FB1FC' } },
        { data: { id: 'e11', name: 'Spiral\\Core\\AbstractCore::Spiral\\Core\\{closure}', weight: 70, faveColor: '#EDA1ED' } },
        { data: { id: 'e12', name: 'App\\Controller\\HomeController::email', weight: 70, faveColor: '#86B342' } },
        { data: { id: 'e13', name: 'Spiral\\SendIt\\MailQueue::send', weight: 70, faveColor: '#F5A45D' } },
        { data: { id: 'e14', name: 'Spiral\\Queue\\Queue::push', weight: 70, faveColor: '#F5A45D' } }
      ],
      edges: [
        { data: { source: 'e10', target: 'e11', faveColor: '#6FB1FC' } },
        { data: { source: 'e11', target: 'e12', faveColor: '#6FB1FC' } },
        { data: { source: 'e12', target: 'e13', faveColor: '#6FB1FC' } },
        { data: { source: 'e13', target: 'e14', faveColor: '#EDA1ED' } },
        { data: { source: 'e14', target: 'e14', faveColor: '#EDA1ED' } },
        { data: { source: 'e14', target: 'e14', faveColor: '#EDA1ED' } },
        { data: { source: 'e14', target: 'e10', faveColor: '#EDA1ED' } },
        { data: { source: 'e14', target: 'e14', faveColor: '#EDA1ED' } },
      ]
    },
  },
};
