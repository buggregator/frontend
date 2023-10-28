import { Meta, Story } from "@storybook/vue3";
import RayDumpPreview from '~/components/RayDumpPreview/RayDumpPreview.vue';
import { normalizeRayDumpEvent } from "~/utils/normalize-event";
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

Text.args = {event: normalizeRayDumpEvent(rayTextMock),};

export const Trace = Template.bind({});
Trace.args = {event: normalizeRayDumpEvent(rayTraceMock),};

export const Table = Template.bind({});
Table.args = {event: normalizeRayDumpEvent(rayTableMock),};

export const Size = Template.bind({});
Size.args = {event: normalizeRayDumpEvent(raySizeMock),};

export const Notify = Template.bind({});
Notify.args = {event: normalizeRayDumpEvent(rayNotifyMock),};

export const Measure = Template.bind({});
Measure.args = {event: normalizeRayDumpEvent(rayMeasureStartMock),};

export const Label = Template.bind({});
Label.args = {event: normalizeRayDumpEvent(rayLabelMock),};

export const Json = Template.bind({});
Json.args = {event: normalizeRayDumpEvent(rayJsonMock),};

export const Image = Template.bind({});
Image.args = {event: normalizeRayDumpEvent(rayImageMock),};

export const Hide = Template.bind({});
Hide.args = {event: normalizeRayDumpEvent(rayHideMock),};

export const Exception = Template.bind({});
Exception.args = {event: normalizeRayDumpEvent(rayExceptionMock),};

export const Dump = Template.bind({});
Dump.args = {event: normalizeRayDumpEvent(rayDumpMock),};

export const Counter = Template.bind({});
Counter.args = {event: normalizeRayDumpEvent(rayCounterMock),};

export const Color = Template.bind({});
Color.args = {event: normalizeRayDumpEvent(rayColorMock),};

export const Carbon = Template.bind({});
Carbon.args = {event: normalizeRayDumpEvent(rayCarbonMock),};

export const Int = Template.bind({});
Int.args = {event: normalizeRayDumpEvent(rayIntegerMock),};

export const Caller = Template.bind({});
Caller.args = {event: normalizeRayDumpEvent(rayCallerMock),};

export const Lock = Template.bind({});
Lock.args = {event: normalizeRayDumpEvent(rayLockMock),};

export const Issue44 = Template.bind({});
Issue44.args = {event: normalizeRayDumpEvent(rayEmptyStringMock),};
