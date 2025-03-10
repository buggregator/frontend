import type { Meta, StoryObj } from "@storybook/vue3";
import { useHttpDump } from '../../lib';
import { httpDumpMock, httpDumpPdfMock } from '../../mocks';
import HttpDumpPage from "./http-dump-page.vue";

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Entities/HttpDump/HttpDumpPage",
  component: HttpDumpPage,
  parameters: {
    layout: 'fullscreen',
  }
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
