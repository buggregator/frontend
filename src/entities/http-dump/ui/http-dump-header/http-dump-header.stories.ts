import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { useHttpDump } from '../../lib'
import {
  httpDumpMock,
  httpDumpProxyJsonMock,
  httpDumpProxy4xxMock,
  httpDumpProxyErrorMock,
} from '../../mocks'
import HttpDumpHeader from './http-dump-header.vue'

const { normalizeHttpDumpEvent } = useHttpDump()

export default {
  title: 'Entities/HttpDump/HttpDumpHeader',
  component: HttpDumpHeader,
} as Meta<typeof HttpDumpHeader>

export const RegularDump: StoryObj<typeof HttpDumpHeader> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpMock),
  },
}

export const ProxySuccess: StoryObj<typeof HttpDumpHeader> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyJsonMock),
  },
}

export const Proxy4xx: StoryObj<typeof HttpDumpHeader> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxy4xxMock),
  },
}

export const ProxyConnectionError: StoryObj<typeof HttpDumpHeader> = {
  args: {
    event: normalizeHttpDumpEvent(httpDumpProxyErrorMock),
  },
}
