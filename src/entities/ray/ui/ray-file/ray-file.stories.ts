import type { Meta, StoryObj } from "@storybook/vue3";
import type { ComponentProps } from "vue-component-type-helpers";
import { useRay } from "../../lib";
import { rayExceptionMock } from "../../mocks";
import type { RayContentException } from "../../types";
import RayFile from "./ray-file.vue";

const { normalizeRayEvent } = useRay();

export default {
  title: "Entities/ray/RayFile",
  component: RayFile,
  render: (args: ComponentProps<typeof RayFile>) =>
    ({
      components: { RayFile },
      setup() {
        return {
          args,
        };
      },
      template: '<RayFile :file="args.file">This is a row 1</RayFile>',
    }),
} as Meta<typeof RayFile>;

export const Default: StoryObj<typeof RayFile> = {
  args: {
    file: (normalizeRayEvent(rayExceptionMock).payload.payloads[0].content as RayContentException)
      .frames[0],
  },
};
