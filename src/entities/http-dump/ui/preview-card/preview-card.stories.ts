import type { Meta, StoryObj } from "@storybook/vue3";
import { useHttpDump } from "../../lib";
import { httpDumpMock } from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Entities/http-dump/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

const Template: StoryObj = (args: unknown) => ({
  components: { PreviewCard },
  setup() {
    return {
      args,
    };
  },
  template: `<PreviewCard v-bind="args" />`,
});

export const Event = Template.bind({});

Event.args = {
  event: normalizeHttpDumpEvent(httpDumpMock),
};
