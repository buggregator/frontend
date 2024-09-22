import type { Meta, StoryObj } from "@storybook/vue3";
import { useMonolog } from "../../lib";
import { monologMock, monologExtendedMock } from "../../mocks";
import PreviewCard from "./preview-card.vue";

const { normalizeMonologEvent } = useMonolog();

export default {
  title: "Entities/monolog/PreviewCard",
  component: PreviewCard,
} as Meta<typeof PreviewCard>;

export const Default: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologMock),
  },
};

export const WithOrigin: StoryObj<typeof PreviewCard> = {
  args: {
    event: {
      ...normalizeMonologEvent(monologMock),
      origin: {
        file: "/var/www/html/vendor/symfony/http-kernel/HttpKernel.php",
        line_number: 151,
        name: "Symfony\\Component\\HttpKernel\\HttpKernel->handleRaw",
      },
    },
  },
};

export const ComplexObject: StoryObj<typeof PreviewCard> = {
  args: {
    event: normalizeMonologEvent(monologExtendedMock),
  },
};
