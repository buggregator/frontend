import type { Meta, StoryObj } from "@storybook/vue3";
import EventsListPage from "./events-list-page.vue";

export default {
  title: "Screens/EventsListPage/EventsListPage",
  component: EventsListPage,
} as Meta<typeof EventsListPage>;

export const Default: StoryObj<typeof EventsListPage> = {
  args: {},
};
