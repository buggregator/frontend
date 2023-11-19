import { Meta, Story } from "@storybook/vue3";
import RayDumpPreview from '~/components/RayDumpPreview/RayDumpPreview.vue';
import {
  rayCallerMock,
  rayCarbonMock,
  rayColorMock,
  rayCounterMock,
  rayDumpMock,
  rayExceptionMock,
  rayEmptyStringMock,
  rayHideMock,
  rayImageMock,
  rayIntegerMock,
  rayJsonMock,
  rayLabelMock,
  rayMeasureStartMock,
  rayNotifyMock,
  raySizeMock,
  rayTableMock,
  rayTextMock,
  rayTraceMock,
  rayLockMock,
} from '~/src/entities/ray/mocks';
import { useRay } from "~/src/entities/ray";

const { normalizeRayEvent } = useRay()

export default {
  title: "RayDump/RayDumpPreview/Common",
  component: RayDumpPreview
} as Meta<typeof RayDumpPreview>;

const Template: Story = (args) => ({
  components: { RayDumpPreview },
  setup() {
    return {
      args,
    };
  },
  template: `<RayDumpPreview v-bind="args" />`,
});

export const Text = Template.bind({});

Text.args = {event: normalizeRayEvent(rayTextMock),};

export const Trace = Template.bind({});
Trace.args = {event: normalizeRayEvent(rayTraceMock),};

export const Table = Template.bind({});
Table.args = {event: normalizeRayEvent(rayTableMock),};

export const Size = Template.bind({});
Size.args = {event: normalizeRayEvent(raySizeMock),};

export const Notify = Template.bind({});
Notify.args = {event: normalizeRayEvent(rayNotifyMock),};

export const Measure = Template.bind({});
Measure.args = {event: normalizeRayEvent(rayMeasureStartMock),};

export const Label = Template.bind({});
Label.args = {event: normalizeRayEvent(rayLabelMock),};

export const Json = Template.bind({});
Json.args = {event: normalizeRayEvent(rayJsonMock),};

export const Image = Template.bind({});
Image.args = {event: normalizeRayEvent(rayImageMock),};

export const Hide = Template.bind({});
Hide.args = {event: normalizeRayEvent(rayHideMock),};

export const Exception = Template.bind({});
Exception.args = {event: normalizeRayEvent(rayExceptionMock),};

export const Dump = Template.bind({});
Dump.args = {event: normalizeRayEvent(rayDumpMock),};

export const Counter = Template.bind({});
Counter.args = {event: normalizeRayEvent(rayCounterMock),};

export const Color = Template.bind({});
Color.args = {event: normalizeRayEvent(rayColorMock),};

export const Carbon = Template.bind({});
Carbon.args = {event: normalizeRayEvent(rayCarbonMock),};

export const Int = Template.bind({});
Int.args = {event: normalizeRayEvent(rayIntegerMock),};

export const Caller = Template.bind({});
Caller.args = {event: normalizeRayEvent(rayCallerMock),};

export const Lock = Template.bind({});
Lock.args = {event: normalizeRayEvent(rayLockMock),};

export const Issue44 = Template.bind({});
Issue44.args = {event: normalizeRayEvent(rayEmptyStringMock),};
