import type { Meta, StoryObj } from "@storybook/vue3";
import PauseButton from './pause-button.vue';

export default {
  title: "Screens/events/PauseButton",
  component: PauseButton
} as Meta<typeof PauseButton>;

const Template: StoryObj = (args: unknown) => ({
  components: {PauseButton},
  setup() {
    return {
      args,
    };
  },
  template: `<div style="padding: 20px"><PauseButton v-bind="args"/></div>`,
});

export const Default = Template.bind({});
Default.args = {
  disabled: false,
  isPaused: false,
  totalNewEventsCount: 10,
};

export const Disabled = Template.bind({});
Disabled.args = {
  disabled: true,
  isPaused: false,
  totalNewEventsCount: 10,
}

export const Paused = Template.bind({});
Paused.args = {
  disabled: false,
  isPaused: true,
  totalNewEventsCount: 10,
}
