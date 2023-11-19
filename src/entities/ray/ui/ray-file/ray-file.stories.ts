import { Meta, Story } from "@storybook/vue3";
import { useRay } from "../../lib";
import { rayExceptionMock } from "../../mocks";
import { RayContentException } from "../../types";
import RayFile from "./ray-file.vue";

const { normalizeRayEvent } = useRay();

export default {
  title: "FSD/entities/ray/RayFile",
  component: RayFile
} as Meta<typeof RayFile>;

const Template: Story = (args) => ({
  components: { RayFile },
  setup() {
    return {
      args,
    };
  },
  template: `<RayFile :file="args.file">This is a row 1</RayFile>`,
});

export const FileDefault = Template.bind({});
FileDefault.args = {
  file: (normalizeRayEvent(rayExceptionMock).payload.payloads[0].content as RayContentException).frames[0]
};
