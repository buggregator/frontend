import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useHttpDump } from '../../lib'
import {
  httpDumpProxyJsonMock,
  httpDumpProxyHtmlMock,
  httpDumpProxyXmlMock,
  httpDumpProxyBinaryMock,
  httpDumpProxy4xxMock,
} from '../../mocks'
import HttpResponsePanel from './http-response-panel.vue'

const { normalizeHttpDumpEvent } = useHttpDump()

export default {
  title: 'Entities/HttpDump/HttpResponsePanel',
  component: HttpResponsePanel,
} as Meta<typeof HttpResponsePanel>

export const JsonResponse: StoryObj<typeof HttpResponsePanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyJsonMock),
  },
}

export const HtmlResponse: StoryObj<typeof HttpResponsePanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyHtmlMock),
  },
}

export const XmlResponse: StoryObj<typeof HttpResponsePanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyXmlMock),
  },
}

export const BinaryResponse: StoryObj<typeof HttpResponsePanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyBinaryMock),
  },
}

export const ErrorResponse: StoryObj<typeof HttpResponsePanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxy4xxMock),
  },
}
