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
        { data: { id: 'j', name: 'Jerry', weight: 65, faveColor: '#6FB1FC', faveShape: 'triangle' } },
        { data: { id: 'e', name: 'Elaine', weight: 45, faveColor: '#EDA1ED', faveShape: 'ellipse' } },
        { data: { id: 'k', name: 'Kramer', weight: 75, faveColor: '#86B342', faveShape: 'octagon' } },
        { data: { id: 'g', name: 'George', weight: 70, faveColor: '#F5A45D', faveShape: 'rectangle' } }
      ],
      edges: [
        { data: { source: 'j', target: 'e', faveColor: '#6FB1FC', strength: 90 } },
        { data: { source: 'j', target: 'e', faveColor: '#000000', strength: 120 } },
        { data: { source: 'j', target: 'k', faveColor: '#6FB1FC', strength: 70 } },
        { data: { source: 'j', target: 'g', faveColor: '#6FB1FC', strength: 80 } },

        { data: { source: 'e', target: 'j', faveColor: '#EDA1ED', strength: 95 } },
        { data: { source: 'e', target: 'k', faveColor: '#EDA1ED', strength: 60 }, classes: 'questionable' },

        { data: { source: 'k', target: 'j', faveColor: '#86B342', strength: 100 } },
        { data: { source: 'k', target: 'e', faveColor: '#86B342', strength: 100 } },
        { data: { source: 'k', target: 'g', faveColor: '#86B342', strength: 100 } },

        { data: { source: 'g', target: 'j', faveColor: '#F5A45D', strength: 90 } },
        { data: { source: 'g', target: 'g', faveColor: '#F5A45D', strength: 90 } },
        { data: { source: 'g', target: 'g', faveColor: '#F5A45D', strength: 90 } },
        { data: { source: 'g', target: 'g', faveColor: '#F5A45D', strength: 90 } }
      ]
    },
  },
};
