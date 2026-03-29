import type { Meta, StoryObj } from "@storybook/vue3-vite";
import { useMonolog } from "../../lib";
import {
  monologMock,
  monologExtendedMock,
  monologDebugMock,
  monologInfoMock,
  monologNoticeMock,
  monologWarningMock,
  monologErrorMock,
  monologCriticalMock,
  monologAlertMock,
  monologEmergencyMock,
} from '../../mocks'
import PreviewCard from './preview-card.vue';

const { normalizeMonologEvent } = useMonolog();

export default {
  title: "Entities/Monolog/PreviewCard",
  component: PreviewCard
} as Meta<typeof PreviewCard>;

export const Default: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologMock),
  }
}

export const WithOrigin: StoryObj<typeof PreviewCard> = {
  args: {
    event: {
      ...normalizeMonologEvent(monologMock),
      origin: {
        file: "/var/www/html/vendor/symfony/http-kernel/HttpKernel.php",
        line_number: 151,
        name: "Symfony\\Component\\HttpKernel\\HttpKernel->handleRaw",
      }
    }
  }
}

export const ComplexObject: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologExtendedMock),
  }
}

export const Debug: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologDebugMock),
  }
}

export const Info: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologInfoMock),
  }
}

export const Notice: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologNoticeMock),
  }
}

export const Warning: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologWarningMock),
  }
}

export const Error: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologErrorMock),
  }
}

export const Critical: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologCriticalMock),
  }
}

export const Alert: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologAlertMock),
  }
}

export const Emergency: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologEmergencyMock),
  }
}
