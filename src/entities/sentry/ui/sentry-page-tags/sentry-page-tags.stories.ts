import type { Meta, StoryObj } from "@storybook/vue3"
import { useSentry } from "../../lib"
import { sentryLaravelMock, sentrySpiralMock } from "../../mocks"
import SentryPageTags from "./sentry-page-tags.vue"

const { normalizeSentryEvent } = useSentry()

export default {
  title: "Screens/sentry/SentryPageTags",
  component: SentryPageTags
} as Meta<typeof SentryPageTags>

export const Laravel: StoryObj<typeof SentryPageTags> = {
  args: {
    payload: normalizeSentryEvent(sentryLaravelMock).payload
  }
}

export const Spiral: StoryObj<typeof SentryPageTags> = {
  args: {
    payload: normalizeSentryEvent(sentrySpiralMock).payload
  }
}
