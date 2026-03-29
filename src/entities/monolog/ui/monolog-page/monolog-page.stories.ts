import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useMonolog } from "../../lib";
import {
  monologMock,
  monologDebugMock,
  monologInfoMock,
  monologNoticeMock,
  monologWarningMock,
  monologErrorMock,
  monologCriticalMock,
  monologAlertMock,
  monologEmergencyMock,
} from '../../mocks';
import Monolog from './monolog-page.vue';

const { normalizeMonologEvent } = useMonolog();

export default {
  title: "Entities/Monolog/MonologPage",
  component: Monolog,
  parameters: {
    layout: 'fullscreen',
  }
} as Meta<typeof Monolog>;

export const Default: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologMock),
  }
}

export const Debug: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologDebugMock),
  }
}

export const Info: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologInfoMock),
  }
}

export const Notice: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologNoticeMock),
  }
}

export const Warning: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologWarningMock),
  }
}

export const Error: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologErrorMock),
  }
}

export const Critical: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologCriticalMock),
  }
}

export const Alert: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologAlertMock),
  }
}

export const Emergency: StoryObj<typeof Monolog> = {
  args: {
    event: normalizeMonologEvent(monologEmergencyMock),
  }
}
