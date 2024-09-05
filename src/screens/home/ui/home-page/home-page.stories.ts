import type { Meta, StoryObj } from "@storybook/vue3";
import { useHttpDump } from '@/entities/http-dump';
import { httpDumpMock, httpDumpPdfMock } from '@/entities/http-dump/mocks';
import HomePage from "./home-page.vue";

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Screens/Home/HomePage",
  component: HomePage
} as Meta<typeof HomePage>;

export const Default: StoryObj<typeof HomePage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpMock),
  }
}

export const WithPdf: StoryObj<typeof HomePage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpPdfMock),
  }
}
