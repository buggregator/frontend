import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useHttpDump } from '../../lib'
import {
  httpDumpMock,
  httpDumpProxyJsonMock,
  httpDumpProxy4xxMock,
} from '../../mocks'
import HttpRequestPanel from './http-request-panel.vue'

const { normalizeHttpDumpEvent } = useHttpDump()

export default {
  title: 'Entities/HttpDump/HttpRequestPanel',
  component: HttpRequestPanel,
} as Meta<typeof HttpRequestPanel>

export const WithQueryAndHeaders: StoryObj<typeof HttpRequestPanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpMock),
  },
}

export const ProxyPostWithJsonBody: StoryObj<typeof HttpRequestPanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyJsonMock),
  },
}

export const ProxyFormBody: StoryObj<typeof HttpRequestPanel> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxy4xxMock),
  },
}
