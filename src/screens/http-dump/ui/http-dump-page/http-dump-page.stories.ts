import type { Meta, StoryObj } from "@storybook/vue3";
import { useHttpDump } from '~/src/entities/http-dump';
import { httpDumpMock, httpDumpPdfMock } from '~/src/entities/http-dump/mocks';
import HttpDumpPage from "./http-dump-page.vue";

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Screens/http-dump/HttpDumpPage",
  component: HttpDumpPage
} as Meta<typeof HttpDumpPage>;

export const Default: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpMock),
  }
}

export const WithPdf: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpPdfMock),
  }
}
