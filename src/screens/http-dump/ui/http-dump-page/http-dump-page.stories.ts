import type { Meta, StoryObj } from "@storybook/vue3";
import { useHttpDump } from '~/src/entities/http-dump';
import { httpDumpMock, httpDumpPdfMock } from '~/src/entities/http-dump/mocks';
import HttpDumpPage from "./http-dump-page.vue";

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Screens/http-dump/HttpDumpPage",
  component: HttpDumpPage
} as Meta<typeof HttpDumpPage>;

const Template: StoryObj = (args: unknown) => ({
  components: { HttpDumpPage },
  setup() {
    return {
      args,
    };
  },
  template: `<HttpDumpPage v-bind="args" />`,
});

export const Default = Template.bind({});


Default.args = {
  event: normalizeHttpDumpEvent(httpDumpMock),
};

export const WithPdf = Template.bind({});
WithPdf.args = {
  event: normalizeHttpDumpEvent(httpDumpPdfMock),
};
