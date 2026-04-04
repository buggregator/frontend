import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useHttpDump } from '../../lib';
import {
  httpDumpMock,
  httpDumpPdfMock,
  httpDumpProxyJsonMock,
  httpDumpProxyHtmlMock,
  httpDumpProxyErrorMock,
  httpDumpProxyXmlMock,
  httpDumpProxyBinaryMock,
  httpDumpProxy4xxMock,
} from '../../mocks';
import HttpDumpPage from "./http-dump-page.vue";

const { normalizeHttpDumpEvent } = useHttpDump();

export default {
  title: "Entities/HttpDump/HttpDumpPage",
  component: HttpDumpPage,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    useUrlFragment: false,
  },
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

export const ProxyJsonResponse: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyJsonMock),
  }
}

export const ProxyHtmlResponse: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyHtmlMock),
  }
}

export const ProxyXmlResponse: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyXmlMock),
  }
}

export const ProxyBinaryResponse: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyBinaryMock),
  }
}

export const Proxy4xxError: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxy4xxMock),
  }
}

export const ProxyConnectionError: StoryObj<typeof HttpDumpPage> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyErrorMock),
  }
}
