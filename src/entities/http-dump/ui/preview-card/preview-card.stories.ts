import type { Meta, StoryObj } from "@storybook/vue3";
import { useHttpDump } from "../../lib";
import { httpDumpMock } from "../../mocks";
import PreviewCard from "./preview-card.vue";

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Entities/http-dump/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

export const Default: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpMock)
  }
};
