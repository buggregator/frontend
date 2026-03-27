import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { profilerMock } from  "../../mocks";
import TopFunctions from './top-functions.vue';

export default {
title: "Entities/Profiler/TopFunctions",
component: TopFunctions
} as Meta<typeof TopFunctions>;

export const Default: StoryObj<typeof TopFunctions> = {
  args: {
    id: profilerMock.uuid,
  }
};
