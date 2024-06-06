import type { Meta, StoryObj } from "@storybook/vue3";
import { useRay } from "~/src/entities/ray";
import { rayCallerMock } from '~/src/entities/ray/mocks';
import RayPage from './ray-page.vue';

const { normalizeRayEvent } = useRay();

export default {
  title: "Screens/Ray/RayPage",
  component: RayPage
} as Meta<typeof RayPage>;


export const Default: StoryObj<typeof RayPage> = {
  args: {
    event: normalizeRayEvent(rayCallerMock),
  }
}
