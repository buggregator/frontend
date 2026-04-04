import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useHttpDump } from "../../lib";
import {
  httpDumpMock,
  httpDumpProxyJsonMock,
  httpDumpProxyHtmlMock,
  httpDumpProxyErrorMock,
  httpDumpProxy4xxMock,
} from '../../mocks';
import PreviewCard from './preview-card.vue';

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Entities/HttpDump/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

export const Default: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpMock),
  }
}

export const ProxyJson: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyJsonMock),
  }
}

export const ProxyHtml: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyHtmlMock),
  }
}

export const ProxyError: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyErrorMock),
  }
}

export const Proxy4xx: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxy4xxMock),
  }
}
