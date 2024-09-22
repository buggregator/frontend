import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/vue3";
import PauseButton from "./pause-button.vue";

export default {
  title: "Shared/PauseButton",
  component: PauseButton,
  argTypes: {
    onToggleUpdate: action("Toggle pause"),
    onToggleView: action("Toggle event")
  }
} as Meta<typeof PauseButton>;

export const Default: StoryObj<typeof PauseButton> = {
  args: {
    disabledPause: false,
    isPaused: false,
    totalNewEventsCount: 10
  }
};

export const Disabled: StoryObj<typeof PauseButton> = {
  args: {
    disabledPause: true,
    isPaused: false,
    totalNewEventsCount: 10
  }
};

export const Paused: StoryObj<typeof PauseButton> = {
  args: {
    disabledPause: false,
    isPaused: true,
    totalNewEventsCount: 10
  }
};
