import { action } from "@storybook/addon-actions"
import type { Meta, StoryObj } from "@storybook/vue3"
import { EventTypes } from "../../types"
import PreviewCardHeader from "./preview-card-header.vue"

export default {
  title: "Shared/PreviewCardHeader",
  component: PreviewCardHeader,
  argTypes: {
    onDelete: action("Delete event"),
    onToggleView: action("Toggle event"),
    onCopy: action("Copied event"),
    onDownload: action("Downloaded event"),
    eventType: {
      control: { type: "select" },
      options: Object.values(EventTypes),
      mapping: EventTypes
    }
  }
} as Meta<typeof PreviewCardHeader>

export const Default: StoryObj<typeof PreviewCardHeader> = {
  args: {
    eventUrl: "https://github.com/buggregator/spiral-app",
    eventType: EventTypes.Sentry,
    isOpen: true,
    isVisibleControls: true,
    eventId: "test-event-id",
    labels: ["one", "two", "tree"]
  }
}
