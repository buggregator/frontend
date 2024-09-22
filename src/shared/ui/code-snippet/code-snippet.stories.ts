import type { Meta, StoryObj } from "@storybook/vue3";
import { HTMLCode, PHPCode } from "../../mocks";
import { EventTypes } from "../../types";
import CodeSnippet from "./code-snippet.vue";

export default {
  title: "Shared/CodeSnippet",
  component: CodeSnippet,
} as Meta<typeof CodeSnippet>;

export const Default: StoryObj<typeof CodeSnippet> = {
  args: {
    code: "Hello World!",
    language: "text",
  },
};

export const Object: StoryObj<typeof CodeSnippet> = {
  args: {
    code: {
      id: "da076402-6f98-4ada-bae2-d77d405cf427",
      type: EventTypes.Monolog,
      serverName: "My server",
      origin: {
        one: 1,
        two: 2,
      },
      date: new Date(1673266869 * 1000),
      labels: ["Monolog", "200"],
    },
    language: "javascript",
  },
};

export const HTMLString: StoryObj<typeof CodeSnippet> = {
  args: {
    code: HTMLCode,
    language: "html",
  },
};

export const PHPString = {
  args: {
    code: PHPCode,
    language: "php",
  },
};
