import type { Meta, StoryObj } from "@storybook/vue3";
import { SFDumpCode, HTMLEscapedString } from "../../mocks";
import ValueDump from './value-dump.vue';

// TODO: move out of shared
export default {
  title: "Shared/ValueDump",
  component: ValueDump,
} as  Meta<typeof ValueDump>;


export const String: StoryObj<typeof ValueDump> = {
  args: {
    value: HTMLEscapedString,
    type: 'string',
  }
};

export const Boolean: StoryObj<typeof ValueDump> = {
  args: {
    value: true,
  }
};

export const SfDump: StoryObj<typeof ValueDump> = {
  args: {
    value: SFDumpCode,
  }
};
