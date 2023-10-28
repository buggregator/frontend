import { Meta, Story } from "@storybook/vue3";
import { normalizeHttpDumpEvent } from "~/utils/normalize-event";
import HttpDumpPage from "~/components/HttpDumpPage/HttpDumpPage.vue";
import { httpDumpMock, httpDumpPdfMock } from '~/src/entities/http-dump/mocks';

export default {
  title: "HttpDump/Page/HttpDumpPage",
  component: HttpDumpPage
} as Meta<typeof HttpDumpPage>;

const Template: Story = (args) => ({
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
