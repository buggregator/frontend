import type { Meta, StoryObj } from "@storybook/vue3";
import { useMonolog } from "../../lib";
import { monologMock } from '../../mocks';
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
