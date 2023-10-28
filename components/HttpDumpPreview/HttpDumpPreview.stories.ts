import { Meta, Story } from "@storybook/vue3";
import { normalizeHttpDumpEvent } from "~/utils/normalize-event";
import HttpDumpPreview from '~/components/HttpDumpPreview/HttpDumpPreview.vue';
import { httpDumpMock } from '~/src/entities/http-dump/mocks';

export default {
  title: "HttpDump/Components/HttpDumpPreview",
  component: HttpDumpPreview
} as Meta<typeof HttpDumpPreview>;

const Template: Story = (args) => ({
  components: { HttpDumpPreview },
  setup() {
    return {
      args,
    };
  },
  template: `<HttpDumpPreview v-bind="args" />`,
});

export const Event = Template.bind({});

Event.args = {
  event: normalizeHttpDumpEvent(httpDumpMock),
};
